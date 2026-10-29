<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Spatie\Permission\Models\Permission;

/** A permission can be put on a role only if it exists and the caller holds it too. */
class GrantablePermissions implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $permission = Permission::query()->find($value);

        if (! $permission) {
            $fail('The selected permission is invalid.');
            return;
        }

        if (! auth()->user()->holdsAll([$permission->name])) {
            $fail("You cannot grant the \"{$permission->name}\" permission because you do not have it.");
        }
    }
}
