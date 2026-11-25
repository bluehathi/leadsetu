<?php

namespace App\Services;

use App\Models\BusinessProfile;
use App\Models\Invoice;
use App\Models\TaxRate;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BusinessProfileService
{
    public function current(): ?BusinessProfile
    {
        return BusinessProfile::query()->first();
    }

    /** Like current(), but documents cannot be created before the business is set up. */
    public function require(): BusinessProfile
    {
        return $this->current() ?? throw ValidationException::withMessages([
            'business' => ['Set up your business profile (country, currency, address) before creating quotes or invoices.'],
        ]);
    }

    /** workspace_id comes from BelongsToWorkspace. Indian workspaces get the standard GST slabs on first save. */
    public function save(array $data): BusinessProfile
    {
        return DB::transaction(function () use ($data) {
            $profile = $this->current() ?? new BusinessProfile();
            $isNew = ! $profile->exists;

            $data += BusinessProfile::defaultsFor($data['country']);
            $data['currency'] = BusinessProfile::COUNTRIES[$data['country']]; // currency follows the regime

            if (! $isNew && ($profile->country !== $data['country']) && Invoice::query()->where('status', '!=', 'draft')->exists()) {
                throw ValidationException::withMessages(['country' => ['The country cannot be changed after invoices have been issued.']]);
            }

            $profile->fill($data)->save();

            if ($isNew && $profile->country === 'IN') {
                foreach (TaxRate::GST_SLABS as $slab) {
                    TaxRate::create(['name' => "GST {$slab}%", 'rate' => $slab, 'is_default' => $slab === 18, 'active' => true]);
                }
            }

            return $profile;
        });
    }
}
