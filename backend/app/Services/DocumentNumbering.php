<?php

namespace App\Services;

use App\Models\BusinessProfile;
use App\Models\DocumentSequence;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Gap-free, per-financial-year document numbers such as INV/25-26/0001.
 * The sequence row is locked inside the caller's transaction, so concurrent requests cannot
 * receive the same number and a rolled-back document does not burn one.
 * (GST requires numbers of at most 16 characters made of letters, digits, "/" and "-".)
 */
class DocumentNumbering
{
    public function next(BusinessProfile $profile, string $type, CarbonInterface $date): string
    {
        $period = $this->period($profile, $date);

        return DB::transaction(function () use ($profile, $type, $period) {
            $sequence = DocumentSequence::query()->withoutGlobalScopes()
                ->where(['workspace_id' => $profile->workspace_id, 'type' => $type, 'period' => $period])
                ->lockForUpdate()->first();

            if (! $sequence) {
                $sequence = new DocumentSequence(['type' => $type, 'period' => $period, 'last_number' => 0]);
                $sequence->workspace_id = $profile->workspace_id;
            }

            $sequence->last_number++;
            $sequence->save();

            $prefix = $type === 'invoice' ? $profile->invoice_prefix : $profile->quote_prefix;

            return sprintf('%s/%s/%04d', $prefix, $period, $sequence->last_number);
        });
    }

    /** India: "25-26" (April-March by default). Other countries: the year the financial year starts, "2025". */
    public function period(BusinessProfile $profile, CarbonInterface $date): string
    {
        $startYear = $date->month >= $profile->fy_start_month ? $date->year : $date->year - 1;

        if ($profile->fy_start_month === 1) {
            return (string) $date->year;
        }

        return $profile->country === 'IN'
            ? sprintf('%02d-%02d', $startYear % 100, ($startYear + 1) % 100)
            : (string) $startYear;
    }
}
