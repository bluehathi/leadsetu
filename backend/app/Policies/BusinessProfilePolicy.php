<?php

namespace App\Policies;

use App\Models\BusinessProfile;
use App\Models\User;

class BusinessProfilePolicy
{
    /** Anyone who works with billing documents needs to read the business details. */
    public function view(User $user): bool
    {
        return $user->workspace_id !== null
            && $user->canAny(['manage_business_profile', 'view_invoices', 'view_quotes', 'view_items']);
    }

    public function manage(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('manage_business_profile');
    }
}
