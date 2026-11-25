<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Quote;
use App\Services\Billing\DocumentPricer;
use App\Services\Billing\LineNormalizer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Invoice lifecycle: draft (freely editable, unnumbered) -> issued (numbered, immutable)
 * -> partially_paid -> paid, or void. Corrections happen by voiding, never by editing or deleting
 * an issued invoice, and numbers are never reused.
 */
class InvoiceService
{
    private const SORTABLE = ['number', 'issue_date', 'due_date', 'total_minor', 'balance_minor', 'created_at'];

    public function __construct(
        protected BusinessProfileService $business,
        protected DocumentPricer $pricer,
        protected DocumentNumbering $numbering,
    ) {
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Invoice::query()->with('company');

        if (filled($filters['search'] ?? null)) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('number', 'like', $term)
                ->orWhereHas('company', fn ($c) => $c->where('name', 'like', $term)));
        }
        if (filled($filters['company_id'] ?? null)) {
            $query->where('company_id', $filters['company_id']);
        }
        if (($filters['status'] ?? null) === 'overdue') {
            $query->whereIn('status', ['issued', 'partially_paid'])->where('balance_minor', '>', 0)->whereDate('due_date', '<', today());
        } elseif (filled($filters['status'] ?? null)) {
            $query->where('status', $filters['status']);
        }

        $sort = $filters['sort'] ?? '-created_at';
        $column = ltrim($sort, '-');
        $query->orderBy(in_array($column, self::SORTABLE, true) ? $column : 'created_at', str_starts_with($sort, '-') ? 'desc' : 'asc')->orderByDesc('id');

        return $query->paginate(min(max($perPage, 1), 100));
    }

    public function createDraft(array $data): Invoice
    {
        $profile = $this->business->require();
        $company = Company::findOrFail($data['company_id']);

        return DB::transaction(function () use ($data, $profile, $company) {
            $priced = $this->pricer->price($profile, $company, LineNormalizer::fromRequest($data['lines']));

            $invoice = new Invoice(['notes' => $data['notes'] ?? null, 'terms' => $data['terms'] ?? $profile->default_terms]);
            $invoice->user_id = Auth::id();
            $invoice->company_id = $company->id;
            $invoice->contact_id = $data['contact_id'] ?? null;
            $invoice->status = 'draft';
            $invoice->issue_date = $data['issue_date'] ?? null;
            $invoice->due_date = $data['due_date'] ?? null;
            $this->fill($invoice, $priced);
            $invoice->save();
            $invoice->lines()->createMany($priced['rows']);

            return $invoice->load('company', 'lines', 'payments');
        });
    }

    public function createFromQuote(Quote $quote): Invoice
    {
        $profile = $this->business->require();
        $company = $quote->company;

        $priced = $this->pricer->price($profile, $company, LineNormalizer::fromModels($quote->lines));

        $invoice = new Invoice(['notes' => $quote->notes, 'terms' => $quote->terms]);
        $invoice->user_id = Auth::id();
        $invoice->company_id = $company->id;
        $invoice->contact_id = $quote->contact_id;
        $invoice->quote_id = $quote->id;
        $invoice->status = 'draft';
        $this->fill($invoice, $priced);
        $invoice->save();
        $invoice->lines()->createMany($priced['rows']);

        return $invoice->load('company', 'lines');
    }

    public function updateDraft(Invoice $invoice, array $data): Invoice
    {
        $this->assertDraft($invoice, 'edited');
        $profile = $this->business->require();

        return DB::transaction(function () use ($invoice, $data, $profile) {
            $company = Company::findOrFail($data['company_id'] ?? $invoice->company_id);
            $lines = isset($data['lines']) ? LineNormalizer::fromRequest($data['lines']) : LineNormalizer::fromModels($invoice->lines);
            $priced = $this->pricer->price($profile, $company, $lines);

            $invoice->fill(array_intersect_key($data, array_flip(['notes', 'terms'])));
            $invoice->company_id = $company->id;
            if (array_key_exists('contact_id', $data)) {
                $invoice->contact_id = $data['contact_id'];
            }
            foreach (['issue_date', 'due_date'] as $field) {
                if (array_key_exists($field, $data)) {
                    $invoice->{$field} = $data[$field];
                }
            }
            $this->fill($invoice, $priced);
            $invoice->save();
            $invoice->lines()->delete();
            $invoice->lines()->createMany($priced['rows']);

            return $invoice->load('company', 'lines', 'payments');
        });
    }

    public function deleteDraft(Invoice $invoice): void
    {
        $this->assertDraft($invoice, 'deleted');
        $invoice->delete();
    }

    /** Numbers the invoice, re-prices it against today's customer/business data and freezes it. */
    public function issue(Invoice $invoice): Invoice
    {
        $profile = $this->business->require();

        return DB::transaction(function () use ($invoice, $profile) {
            $locked = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);
            $this->assertDraft($locked, 'issued');

            $locked->load('company', 'lines');
            $company = $locked->company;
            $priced = $this->pricer->price($profile, $company, LineNormalizer::fromModels($locked->lines));
            $this->assertIssuable($profile, $company, $priced);

            $issueDate = $locked->issue_date ?? today();
            $locked->number = $this->numbering->next($profile, 'invoice', Carbon::parse($issueDate));
            $locked->issue_date = $issueDate;
            $locked->due_date ??= Carbon::parse($issueDate)->addDays($profile->default_due_days);
            $locked->seller_snapshot = $profile->snapshot();
            $locked->buyer_snapshot = $company->billingSnapshot();
            $this->fill($locked, $priced);
            $locked->amount_paid_minor = 0;
            $locked->balance_minor = $priced['total_minor'];
            $locked->status = 'issued';
            $locked->issued_at = now();
            $locked->save();
            $locked->lines()->delete();
            $locked->lines()->createMany($priced['rows']);

            return $locked->load('company', 'lines', 'payments');
        });
    }

    public function void(Invoice $invoice, string $reason): Invoice
    {
        return DB::transaction(function () use ($invoice, $reason) {
            $locked = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);

            if (! $locked->isOpen()) {
                throw ValidationException::withMessages(['status' => ["A {$locked->status} invoice cannot be voided."]]);
            }
            if ($locked->amount_paid_minor > 0) {
                throw ValidationException::withMessages(['status' => ['Void the recorded payments first.']]);
            }

            $locked->forceFill(['status' => 'void', 'voided_at' => now(), 'void_reason' => $reason, 'balance_minor' => 0])->save();

            return $locked->load('company', 'lines', 'payments');
        });
    }

    public function recordPayment(Invoice $invoice, array $data): Invoice
    {
        return DB::transaction(function () use ($invoice, $data) {
            $locked = Invoice::query()->lockForUpdate()->findOrFail($invoice->id);

            if (! $locked->isOpen()) {
                throw ValidationException::withMessages(['invoice' => ["Payments can only be recorded on issued invoices (this one is {$locked->status})."]]);
            }
            if ($data['amount_minor'] > $locked->balance_minor) {
                throw ValidationException::withMessages(['amount_minor' => ['The payment is larger than the outstanding balance.']]);
            }

            $payment = new Payment(\Illuminate\Support\Arr::only($data, ['amount_minor', 'paid_at', 'method', 'reference', 'notes']));
            $payment->invoice_id = $locked->id;
            $payment->user_id = Auth::id();
            $payment->save();

            return $this->recalculate($locked);
        });
    }

    public function voidPayment(Payment $payment, string $reason): Invoice
    {
        return DB::transaction(function () use ($payment, $reason) {
            $invoice = Invoice::query()->lockForUpdate()->findOrFail($payment->invoice_id);
            $fresh = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($fresh->voided_at !== null) {
                throw ValidationException::withMessages(['payment' => ['This payment is already voided.']]);
            }
            $fresh->forceFill(['voided_at' => now(), 'void_reason' => $reason])->save();

            return $this->recalculate($invoice);
        });
    }

    /** Receivable figures are always derived from the non-voided payments. */
    private function recalculate(Invoice $invoice): Invoice
    {
        $paid = (int) Payment::query()->where('invoice_id', $invoice->id)->whereNull('voided_at')->sum('amount_minor');
        $invoice->amount_paid_minor = $paid;
        $invoice->balance_minor = $invoice->total_minor - $paid;
        $invoice->status = $invoice->balance_minor === 0 ? 'paid' : ($paid > 0 ? 'partially_paid' : 'issued');
        $invoice->save();

        return $invoice->load('company', 'lines', 'payments');
    }

    private function assertDraft(Invoice $invoice, string $action): void
    {
        if (! $invoice->isDraft()) {
            throw ValidationException::withMessages(['status' => ["Only draft invoices can be {$action}. Issued invoices are void-and-reissue only."]]);
        }
    }

    private function assertIssuable($profile, Company $company, array $priced): void
    {
        $errors = [];
        if (count($priced['rows']) === 0) {
            $errors['lines'] = ['Add at least one line.'];
        }
        if ($priced['total_minor'] <= 0) {
            $errors['total'] = ['An invoice must have a positive total.'];
        }
        if ($profile->country === 'IN' && $priced['tax_minor'] > 0) {
            if (blank($profile->tax_id)) {
                $errors['business'] = ['Add your GSTIN to the business profile to charge GST.'];
            }
            if (blank($profile->state_code)) {
                $errors['business_state'] = ['Add your state to the business profile to charge GST.'];
            }
            if (blank($company->state_code)) {
                $errors['company'] = ['Add the customer\'s state (place of supply) before issuing a GST invoice.'];
            }
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function fill(Invoice $invoice, array $priced): void
    {
        $invoice->currency = $priced['currency'];
        $invoice->country = $priced['country'];
        $invoice->place_of_supply = $priced['place_of_supply'];
        $invoice->subtotal_minor = $priced['subtotal_minor'];
        $invoice->discount_minor = $priced['discount_minor'];
        $invoice->tax_minor = $priced['tax_minor'];
        $invoice->total_minor = $priced['total_minor'];
        $invoice->tax_breakup = $priced['tax_breakup'];
        if ($invoice->isDraft()) {
            $invoice->balance_minor = $priced['total_minor'];
        }
    }
}
