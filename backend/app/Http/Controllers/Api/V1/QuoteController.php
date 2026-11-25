<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\QuoteStatusRequest;
use App\Http\Requests\Billing\SaveQuoteRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\QuoteResource;
use App\Models\Invoice;
use App\Models\Quote;
use App\Services\ActivityLogService;
use App\Services\QuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class QuoteController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(protected QuoteService $quotes, protected ActivityLogService $audit)
    {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(Quote::class, 'quote');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return QuoteResource::collection($this->quotes->paginate(
            $request->only(['search', 'status', 'company_id', 'sort']), (int) $request->integer('per_page', 15)
        ));
    }

    public function store(SaveQuoteRequest $request): JsonResponse
    {
        $quote = $this->quotes->create($request->validated());
        $this->audit->log('quote_created', $quote, "Quote {$quote->number} created", ['total_minor' => $quote->total_minor]);

        return (new QuoteResource($quote))->response()->setStatusCode(201);
    }

    public function show(Quote $quote): QuoteResource
    {
        return new QuoteResource($quote->load('company', 'lines'));
    }

    public function update(SaveQuoteRequest $request, Quote $quote): QuoteResource
    {
        $quote = $this->quotes->update($quote, $request->validated());
        $this->audit->log('quote_updated', $quote, "Quote {$quote->number} updated");

        return new QuoteResource($quote);
    }

    public function destroy(Quote $quote): JsonResponse
    {
        $this->quotes->delete($quote);
        $this->audit->log('quote_deleted', $quote, "Quote {$quote->number} deleted");

        return response()->json(null, 204);
    }

    public function status(QuoteStatusRequest $request, Quote $quote): QuoteResource
    {
        $quote = $this->quotes->setStatus($quote, $request->validated('status'));
        $this->audit->log('quote_status_changed', $quote, "Quote {$quote->number} marked {$quote->status}");

        return new QuoteResource($quote->load('company', 'lines'));
    }

    /** Creates a draft invoice from the quote. Needs permission to create invoices as well. */
    public function convert(Quote $quote): JsonResponse
    {
        $this->authorize('update', $quote);
        $this->authorize('create', Invoice::class);

        $invoice = $this->quotes->convert($quote);
        $this->audit->log('quote_converted', $quote, "Quote {$quote->number} converted to an invoice draft", ['invoice_id' => $invoice->id]);

        return (new InvoiceResource($invoice->load('payments')))->response()->setStatusCode(201);
    }
}
