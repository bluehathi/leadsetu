<?php

namespace App\Support\Billing;

/** Integer money maths. Amounts are minor units (paise/cents); never floats. */
final class Money
{
    /** Divide and round half away from zero (non-negative operands). */
    public static function divRound(int $numerator, int $denominator): int
    {
        if ($denominator <= 0) {
            throw new \InvalidArgumentException('Denominator must be positive.');
        }

        return intdiv(abs($numerator) * 2 + $denominator, $denominator * 2) * ($numerator < 0 ? -1 : 1);
    }

    /** "1234.50" -> 123450. Accepts at most two decimals; used for any text input. */
    public static function parse(string $amount): int
    {
        if (! preg_match('/^(-?)(\d+)(?:\.(\d{1,2}))?$/', trim($amount), $m)) {
            throw new \InvalidArgumentException("Invalid amount: $amount");
        }

        return ($m[1] === '-' ? -1 : 1) * ((int) $m[2] * 100 + (int) str_pad($m[3] ?? '0', 2, '0'));
    }

    public static function format(int $minor, string $currency = ''): string
    {
        $sign = $minor < 0 ? '-' : '';
        $abs = abs($minor);

        return trim($sign . intdiv($abs, 100) . '.' . str_pad((string) ($abs % 100), 2, '0', STR_PAD_LEFT) . ' ' . $currency);
    }
}
