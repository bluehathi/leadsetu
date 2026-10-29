<?php

namespace App\Support\Billing;

/**
 * Prices a document. Pure and deterministic (no I/O) so it is easy to test.
 *
 * Prices are tax-exclusive. Every line is rounded to the minor unit on its own, then summed, so the
 * printed lines always add up to the printed totals.
 *
 * Tax regimes:
 *  - IN: the line's GST rate is split into CGST + SGST (same state) or taxed as IGST (different state).
 *  - US: a single sales-tax component per rate; tax-exempt customers pay none.
 */
final class TaxCalculator
{
    /**
     * @param list<array{quantity_milli:int, unit_price_minor:int, discount_percent:float|int|string, tax_rate:float|int|string}> $lines
     * @param array{country:string, intra_state:bool, tax_exempt:bool, tax_label?:string} $context
     * @return array{lines:list<array<string,int>>, subtotal_minor:int, discount_minor:int, tax_minor:int, total_minor:int, tax_breakup:list<array{code:string,label:string,rate:float,amount_minor:int}>}
     */
    public static function calculate(array $lines, array $context): array
    {
        $out = [];
        $breakup = [];
        $subtotal = $discount = $tax = 0;

        foreach ($lines as $line) {
            $gross = Money::divRound($line['quantity_milli'] * $line['unit_price_minor'], 1000);
            // discount % has two decimals => hundredths of a percent
            $lineDiscount = Money::divRound($gross * self::scaled($line['discount_percent'], 100), 10000);
            $taxable = $gross - $lineDiscount;

            $rate = $context['tax_exempt'] ? 0.0 : (float) $line['tax_rate'];
            // tax rate has three decimals => thousandths of a percent
            $lineTax = Money::divRound($taxable * self::scaled($rate, 1000), 100000);

            foreach (self::components($context, $rate, $lineTax) as $c) {
                $key = $c['code'] . '|' . $c['rate'];
                $breakup[$key] ??= ['code' => $c['code'], 'label' => $c['label'], 'rate' => $c['rate'], 'amount_minor' => 0];
                $breakup[$key]['amount_minor'] += $c['amount_minor'];
            }

            $out[] = [
                'gross_minor' => $gross, 'discount_minor' => $lineDiscount, 'taxable_minor' => $taxable,
                'tax_minor' => $lineTax, 'total_minor' => $taxable + $lineTax,
            ];
            $subtotal += $gross;
            $discount += $lineDiscount;
            $tax += $lineTax;
        }

        return [
            'lines' => $out,
            'subtotal_minor' => $subtotal,
            'discount_minor' => $discount,
            'tax_minor' => $tax,
            'total_minor' => $subtotal - $discount + $tax,
            'tax_breakup' => array_values(array_filter($breakup, fn ($b) => $b['amount_minor'] !== 0 || $b['rate'] > 0)),
        ];
    }

    /** @return list<array{code:string,label:string,rate:float,amount_minor:int}> */
    private static function components(array $context, float $rate, int $tax): array
    {
        if ($rate <= 0) {
            return [];
        }

        if ($context['country'] === 'IN') {
            if (! $context['intra_state']) {
                return [['code' => 'IGST', 'label' => 'IGST', 'rate' => $rate, 'amount_minor' => $tax]];
            }
            $cgst = Money::divRound($tax, 2);

            return [
                ['code' => 'CGST', 'label' => 'CGST', 'rate' => $rate / 2, 'amount_minor' => $cgst],
                ['code' => 'SGST', 'label' => 'SGST', 'rate' => $rate / 2, 'amount_minor' => $tax - $cgst],
            ];
        }

        return [['code' => 'SALES_TAX', 'label' => $context['tax_label'] ?? 'Sales tax', 'rate' => $rate, 'amount_minor' => $tax]];
    }

    /** 8.875 with $scale 1000 => 8875 (exact for the supported precision). */
    private static function scaled(float|int|string $value, int $scale): int
    {
        return (int) round(((float) $value) * $scale);
    }
}
