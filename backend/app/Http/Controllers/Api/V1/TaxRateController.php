<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\SaveTaxRateRequest;
use App\Http\Resources\TaxRateResource;
use App\Models\TaxRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class TaxRateController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public static function middleware(): array
    {
        return static::resourcePolicy(TaxRate::class, 'tax_rate');
    }

    public function index(): AnonymousResourceCollection
    {
        return TaxRateResource::collection(TaxRate::query()->orderBy('rate')->orderBy('name')->get());
    }

    public function store(SaveTaxRateRequest $request): JsonResponse
    {
        $rate = TaxRate::create($request->validated());
        $this->singleDefault($rate);

        return (new TaxRateResource($rate))->response()->setStatusCode(201);
    }

    public function show(TaxRate $taxRate): TaxRateResource
    {
        return new TaxRateResource($taxRate);
    }

    public function update(SaveTaxRateRequest $request, TaxRate $taxRate): TaxRateResource
    {
        $taxRate->update($request->validated());
        $this->singleDefault($taxRate);

        return new TaxRateResource($taxRate);
    }

    /** Existing documents keep their own rate; items fall back to "no tax" if their rate is removed. */
    public function destroy(TaxRate $taxRate): JsonResponse
    {
        $taxRate->delete();

        return response()->json(null, 204);
    }

    private function singleDefault(TaxRate $rate): void
    {
        if ($rate->is_default) {
            TaxRate::query()->where('id', '!=', $rate->id)->update(['is_default' => false]);
        }
    }
}
