<?php

namespace App\Services\Billing;

use App\Models\BusinessProfile;
use App\Models\Company;
use App\Models\Item;
use App\Support\Billing\TaxCalculator;
use Illuminate\Validation\ValidationException;

/**
 * Turns the lines a user typed into a priced document: fills defaults from catalog items,
 * decides the tax regime (GST same-state vs inter-state, US sales tax, exempt customers)
 * and runs the calculator. Quotes, invoices and re-pricing at issue time all use this.
 */
class DocumentPricer
{
    /**
     * @param list<array<string,mixed>> $lines normalised lines: quantity_milli, unit_price_minor (or item_id), ...
     * @return array<string,mixed> header totals plus 'rows' ready to be stored as document lines
     */
    public function price(BusinessProfile $profile, Company $company, array $lines): array
    {
        $resolved = array_map(fn (array $line, int $i) => $this->resolveLine($line, $i), $lines, array_keys($lines));

        $result = TaxCalculator::calculate($resolved, [
            'country' => $profile->country,
            'intra_state' => $profile->country !== 'IN' || $this->sameState($profile, $company),
            'tax_exempt' => (bool) $company->tax_exempt,
        ]);

        $rows = [];
        foreach ($resolved as $i => $line) {
            $rows[] = [
                'position' => $i,
                'item_id' => $line['item_id'] ?? null,
                'description' => $line['description'],
                'hsn_sac' => $line['hsn_sac'] ?? null,
                'unit' => $line['unit'] ?? null,
                'quantity_milli' => $line['quantity_milli'],
                'unit_price_minor' => $line['unit_price_minor'],
                'discount_percent' => $line['discount_percent'],
                'tax_rate' => $company->tax_exempt ? 0 : $line['tax_rate'],
            ] + $result['lines'][$i];
        }

        return [
            'currency' => $profile->currency,
            'country' => $profile->country,
            'place_of_supply' => $company->state_code,
            'subtotal_minor' => $result['subtotal_minor'],
            'discount_minor' => $result['discount_minor'],
            'tax_minor' => $result['tax_minor'],
            'total_minor' => $result['total_minor'],
            'tax_breakup' => $result['tax_breakup'],
            'rows' => $rows,
        ];
    }

    private function sameState(BusinessProfile $profile, Company $company): bool
    {
        // Unknown states are treated as same-state here; issuing an Indian invoice with GST requires both (see InvoiceService).
        return $profile->state_code === null || $company->state_code === null || $profile->state_code === $company->state_code;
    }

    private function resolveLine(array $line, int $index): array
    {
        $item = ! empty($line['item_id']) ? Item::query()->with('taxRate')->find($line['item_id']) : null;

        if (! empty($line['item_id']) && ! $item) {
            throw ValidationException::withMessages(["lines.$index.item_id" => ['This item does not exist.']]);
        }

        $line['description'] = filled($line['description'] ?? null) ? $line['description'] : $item?->name;
        $line['unit'] = $line['unit'] ?? $item?->unit;
        $line['hsn_sac'] = $line['hsn_sac'] ?? $item?->hsn_sac;
        $line['unit_price_minor'] = $line['unit_price_minor'] ?? $item?->price_minor;
        $line['tax_rate'] = $line['tax_rate'] ?? $item?->taxRate?->rate ?? 0;
        $line['discount_percent'] = $line['discount_percent'] ?? 0;

        if (blank($line['description']) || $line['unit_price_minor'] === null) {
            throw ValidationException::withMessages(["lines.$index.description" => ['Each line needs a description and a price, or a catalog item.']]);
        }

        return $line;
    }
}
