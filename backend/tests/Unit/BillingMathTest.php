<?php

namespace Tests\Unit;

use App\Support\Billing\Money;
use App\Support\Billing\TaxCalculator;
use PHPUnit\Framework\TestCase;

class BillingMathTest extends TestCase
{
    private function line(int $qtyMilli, int $price, $disc = 0, $tax = 0): array
    {
        return ['quantity_milli' => $qtyMilli, 'unit_price_minor' => $price, 'discount_percent' => $disc, 'tax_rate' => $tax];
    }

    public function test_money_div_round_cases(): void
    {
        $this->assertSame(1, Money::divRound(4, 3));
        $this->assertSame(2, Money::divRound(5, 3));
        $this->assertSame(0, Money::divRound(0, 7));
        $this->assertSame(-3, Money::divRound(-5, 2));
        $this->assertSame(123450, Money::parse('1234.50'));
        $this->assertSame(123400, Money::parse('1234'));
        $this->assertSame(5, Money::parse('0.05'));
        $this->assertSame(120, Money::parse('1.2'));
        $this->assertSame('1234.50 INR', Money::format(123450, 'INR'));
        $this->assertSame('-0.05', Money::format(-5));
    }

    public function test_money_parse_rejects_floats_with_too_many_decimals_and_junk(): void
    {
        foreach (['1.234', 'abc', '1,000.00', '', '1e3'] as $bad) {
            try {
                Money::parse($bad);
                $this->fail("Accepted $bad");
            } catch (\InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_india_same_state_splits_gst_into_cgst_and_sgst(): void
    {
        // 2 x Rs 1,000.00 = 2,000; 10% discount = 200; taxable 1,800; GST 18% = 324 -> CGST 162 + SGST 162
        $r = TaxCalculator::calculate([$this->line(2000, 100000, 10, 18)], ['country' => 'IN', 'intra_state' => true, 'tax_exempt' => false]);

        $this->assertSame(200000, $r['subtotal_minor']);
        $this->assertSame(20000, $r['discount_minor']);
        $this->assertSame(32400, $r['tax_minor']);
        $this->assertSame(212400, $r['total_minor']);
        $this->assertSame(['CGST', 'SGST'], array_column($r['tax_breakup'], 'code'));
        $this->assertSame([16200, 16200], array_column($r['tax_breakup'], 'amount_minor'));
        $this->assertSame([9.0, 9.0], array_column($r['tax_breakup'], 'rate'));
    }

    public function test_india_other_state_uses_igst_and_odd_paise_stay_balanced(): void
    {
        $inter = TaxCalculator::calculate([$this->line(1000, 100000, 0, 18)], ['country' => 'IN', 'intra_state' => false, 'tax_exempt' => false]);
        $this->assertSame([['code' => 'IGST', 'label' => 'IGST', 'rate' => 18.0, 'amount_minor' => 18000]], $inter['tax_breakup']);

        // 5% of 0.99 = 4.95 paise -> 5; CGST 3 (half-up of 2.5) + SGST 2 = 5, never off by a paisa
        $odd = TaxCalculator::calculate([$this->line(1000, 99, 0, 5)], ['country' => 'IN', 'intra_state' => true, 'tax_exempt' => false]);
        $this->assertSame(5, $odd['tax_minor']);
        $this->assertSame(5, array_sum(array_column($odd['tax_breakup'], 'amount_minor')));
    }

    public function test_us_sales_tax_supports_fractional_rates_and_exemption(): void
    {
        $ctx = ['country' => 'US', 'intra_state' => true, 'tax_exempt' => false, 'tax_label' => 'CA sales tax'];
        $r = TaxCalculator::calculate([$this->line(1000, 10000, 0, 8.875)], $ctx); // $100.00 * 8.875% = $8.875 -> $8.88
        $this->assertSame(888, $r['tax_minor']);
        $this->assertSame(10888, $r['total_minor']);
        $this->assertSame('CA sales tax', $r['tax_breakup'][0]['label']);

        $exempt = TaxCalculator::calculate([$this->line(1000, 10000, 0, 8.875)], array_merge($ctx, ['tax_exempt' => true]));
        $this->assertSame(0, $exempt['tax_minor']);
        $this->assertSame(10000, $exempt['total_minor']);
        $this->assertSame([], $exempt['tax_breakup']);
    }

    public function test_lines_always_add_up_to_the_totals_and_fractional_quantities_work(): void
    {
        $lines = [$this->line(1500, 33333, 12.5, 18), $this->line(333, 999, 0, 5), $this->line(1000, 1, 0, 28)];
        $r = TaxCalculator::calculate($lines, ['country' => 'IN', 'intra_state' => true, 'tax_exempt' => false]);

        $this->assertSame(array_sum(array_column($r['lines'], 'tax_minor')), $r['tax_minor']);
        $this->assertSame(array_sum(array_column($r['lines'], 'total_minor')), $r['total_minor']);
        $this->assertSame($r['subtotal_minor'] - $r['discount_minor'] + $r['tax_minor'], $r['total_minor']);
        $this->assertSame(array_sum(array_column($r['tax_breakup'], 'amount_minor')), $r['tax_minor']);
        // 0.333 x 9.99 = 3.32667 -> 333 paise
        $this->assertSame(333, $r['lines'][1]['gross_minor']);
        $this->assertSame(1, $r['lines'][2]['gross_minor']); // 1 x 0.01
    }

    public function test_zero_rated_lines_produce_no_tax_breakup(): void
    {
        $r = TaxCalculator::calculate([$this->line(1000, 5000, 0, 0)], ['country' => 'IN', 'intra_state' => true, 'tax_exempt' => false]);
        $this->assertSame(0, $r['tax_minor']);
        $this->assertSame([], $r['tax_breakup']);
    }
}
