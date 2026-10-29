<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Quote;
use App\Services\Billing\DocumentPricer;
use App\Services\Billing\LineNormalizer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuoteService
{
    private const SORTABLE = ['number', 'issue_date', 'total_minor', 'created_at'];

    public function __construct(
        protected BusinessProfileService $business,
        protected DocumentPricer $pricer,
        protected DocumentNumbering $numbering,
        protected InvoiceService $invoices,
    ) {
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Quote::query()->with('company');

        if (filled($filters['search'] ?? null)) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('number', 'like', $term)
                ->orWhereHas('company', fn ($c) => $c->where('name', 'like', $term)));
        }
        if (filled($filters['status'] ?? null)) {
            $query->where('status', $filters['status']);
        }
        if (filled($filters['company_id'] ?? null)) {
            $query->where('company_id', $filters['company_id']);
        }

        $sort = $filters['sort'] ?? '-created_at';
        $column = ltrim($sort, '-');
        $query->orderBy(in_array($column, self::SORTABLE, true) ? $column : 'created_at', str_starts_with($sort, '-') ? 'desc' : 'asc')->orderByDesc('id');

        return $query->paginate(min(max($perPage, 1), 100));
    }

    /** Quotes are numbered when created (they are not tax documents), so the customer can reference them. */
    public function create(array $data): Quote
    {
        $profile = $this->business->require();
        $company = Company::findOrFail($data['company_id']);
        $issueDate = isset($data['issue_date']) ? \Illuminate\Support\Carbon::parse($data['issue_date']) : today();

        return DB::transaction(function () use ($data, $profile, $company, $issueDate) {
            $priced = $this->pricer->price($profile, $company, LineNormalizer::fromRequest($data['lines']));

            $quote = new Quote([
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? $profile->default_terms,
            ]);
            $quote->user_id = Auth::id();
            $quote->company_id = $company->id;
            $quote->contact_id = $data['contact_id'] ?? null;
            $quote->number = $this->numbering->next($profile, 'quote', $issueDate);
            $quote->status = 'draft';
            $quote->issue_date = $issueDate;
            $quote->valid_until = $data['valid_until'] ?? $issueDate->copy()->addDays(30);
            $this->fill($quote, $priced);
            $quote->save();
            $quote->lines()->createMany($priced['rows']);

            return $quote->load('company', 'lines');
        });
    }

    public function update(Quote $quote, array $data): Quote
    {
        $this->assertEditable($quote);
        $profile = $this->business->require();

        return DB::transaction(function () use ($quote, $data, $profile) {
            $company = Company::findOrFail($data['company_id'] ?? $quote->company_id);
            $lines = isset($data['lines']) ? LineNormalizer::fromRequest($data['lines']) : LineNormalizer::fromModels($quote->lines);
            $priced = $this->pricer->price($profile, $company, $lines);

            $quote->fill(array_intersect_key($data, array_flip(['notes', 'terms'])));
            $quote->company_id = $company->id;
            if (array_key_exists('contact_id', $data)) {
                $quote->contact_id = $data['contact_id'];
            }
            foreach (['issue_date', 'valid_until'] as $field) {
                if (isset($data[$field])) {
                    $quote->{$field} = $data[$field];
                }
            }
            $this->fill($quote, $priced);
            $quote->save();
            $quote->lines()->delete();
            $quote->lines()->createMany($priced['rows']);

            return $quote->load('company', 'lines');
        });
    }

    /** draft -> sent -> accepted | declined. Invoicing happens through convert(). */
    public function setStatus(Quote $quote, string $to): Quote
    {
        $allowed = ['draft' => ['sent'], 'sent' => ['accepted', 'declined', 'draft'], 'accepted' => ['declined'], 'declined' => ['sent']];

        if ($quote->status === 'invoiced' || ! in_array($to, $allowed[$quote->status] ?? [], true)) {
            throw ValidationException::withMessages(['status' => ["A {$quote->status} quote cannot be marked as {$to}."]]);
        }

        $quote->status = $to;
        $quote->save();

        return $quote;
    }

    /** Creates a draft invoice from the quote (a quote can be invoiced once). */
    public function convert(Quote $quote): \App\Models\Invoice
    {
        return DB::transaction(function () use ($quote) {
            $locked = Quote::query()->lockForUpdate()->findOrFail($quote->id);
            if ($locked->status === 'invoiced' || $locked->status === 'declined') {
                throw ValidationException::withMessages(['status' => ["A {$locked->status} quote cannot be invoiced."]]);
            }

            $invoice = $this->invoices->createFromQuote($locked);
            $locked->forceFill(['status' => 'invoiced', 'invoice_id' => $invoice->id])->save();

            return $invoice;
        });
    }

    public function delete(Quote $quote): void
    {
        if ($quote->status === 'invoiced') {
            throw ValidationException::withMessages(['status' => ['An invoiced quote cannot be deleted.']]);
        }
        $quote->delete();
    }

    private function assertEditable(Quote $quote): void
    {
        if (! $quote->isEditable()) {
            throw ValidationException::withMessages(['status' => ["A {$quote->status} quote cannot be edited."]]);
        }
    }

    private function fill(Quote $quote, array $priced): void
    {
        $quote->currency = $priced['currency'];
        $quote->country = $priced['country'];
        $quote->place_of_supply = $priced['place_of_supply'];
        $quote->subtotal_minor = $priced['subtotal_minor'];
        $quote->discount_minor = $priced['discount_minor'];
        $quote->tax_minor = $priced['tax_minor'];
        $quote->total_minor = $priced['total_minor'];
        $quote->tax_breakup = $priced['tax_breakup'];
    }
}
