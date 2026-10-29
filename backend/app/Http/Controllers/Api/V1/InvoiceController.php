<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\ReasonRequest;
use App\Http\Requests\Billing\RecordPaymentRequest;
use App\Http\Requests\Billing\SaveInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\ActivityLogService;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class InvoiceController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(protected InvoiceService $invoices, protected ActivityLogService $audit)
    {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(Invoice::class, 'invoice');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return InvoiceResource::collection($this->invoices->paginate(
            $request->only(['search', 'status', 'company_id', 'sort']), (int) $request->integer('per_page', 15)
        ));
    }

    public function store(SaveInvoiceRequest $request): JsonResponse
    {
        $invoice = $this->invoices->createDraft($request->validated());
        $this->audit->log('invoice_draft_created', $invoice, 'Invoice draft created', ['total_minor' => $invoice->total_minor]);

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource($invoice->load('company', 'lines', 'payments'));
    }

    public function update(SaveInvoiceRequest $request, Invoice $invoice): InvoiceResource
    {
        $invoice = $this->invoices->updateDraft($invoice, $request->validated());
        $this->audit->log('invoice_draft_updated', $invoice, 'Invoice draft updated');

        return new InvoiceResource($invoice);
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->invoices->deleteDraft($invoice);
        $this->audit->log('invoice_draft_deleted', $invoice, 'Invoice draft deleted');

        return response()->json(null, 204);
    }

    public function issue(Invoice $invoice): InvoiceResource
    {
        $this->authorize('issue', $invoice);
        $invoice = $this->invoices->issue($invoice);
        $this->audit->log('invoice_issued', $invoice, "Invoice {$invoice->number} issued", ['total_minor' => $invoice->total_minor]);

        return new InvoiceResource($invoice);
    }

    public function void(ReasonRequest $request, Invoice $invoice): InvoiceResource
    {
        $this->authorize('void', $invoice);
        $invoice = $this->invoices->void($invoice, $request->validated('reason'));
        $this->audit->log('invoice_voided', $invoice, "Invoice {$invoice->number} voided", ['reason' => $invoice->void_reason]);

        return new InvoiceResource($invoice);
    }

    public function recordPayment(RecordPaymentRequest $request, Invoice $invoice): JsonResponse
    {
        $invoice = $this->invoices->recordPayment($invoice, $request->validated());
        $this->audit->log('payment_recorded', $invoice, "Payment recorded on {$invoice->number}", ['amount_minor' => $request->validated('amount_minor')]);

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    public function voidPayment(ReasonRequest $request, Payment $payment): InvoiceResource
    {
        $this->authorize('voidPayment', [Invoice::class, $payment]);
        $invoice = $this->invoices->voidPayment($payment, $request->validated('reason'));
        $this->audit->log('payment_voided', $invoice, "Payment voided on {$invoice->number}", ['payment_id' => $payment->id, 'reason' => $request->validated('reason')]);

        return new InvoiceResource($invoice);
    }
}
