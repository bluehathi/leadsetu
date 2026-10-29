<?php

namespace App\Services\Billing;

/** Converts validated request lines (decimal quantity) into stored units (thousandths). */
class LineNormalizer
{
    /** @param list<array<string,mixed>> $lines */
    public static function fromRequest(array $lines): array
    {
        return array_map(fn (array $l) => [
            'item_id' => $l['item_id'] ?? null,
            'description' => $l['description'] ?? null,
            'unit' => $l['unit'] ?? null,
            'hsn_sac' => $l['hsn_sac'] ?? null,
            'quantity_milli' => (int) round(((float) $l['quantity']) * 1000),
            'unit_price_minor' => isset($l['unit_price_minor']) ? (int) $l['unit_price_minor'] : null,
            'discount_percent' => isset($l['discount_percent']) ? (float) $l['discount_percent'] : 0,
            'tax_rate' => isset($l['tax_rate']) ? (float) $l['tax_rate'] : null,
        ], array_values($lines));
    }

    /** Stored lines back into the normalised shape (for re-pricing). */
    public static function fromModels(iterable $lines): array
    {
        $out = [];
        foreach ($lines as $l) {
            $out[] = [
                'item_id' => $l->item_id, 'description' => $l->description, 'unit' => $l->unit, 'hsn_sac' => $l->hsn_sac,
                'quantity_milli' => $l->quantity_milli, 'unit_price_minor' => $l->unit_price_minor,
                'discount_percent' => $l->discount_percent, 'tax_rate' => $l->tax_rate,
            ];
        }

        return $out;
    }
}
