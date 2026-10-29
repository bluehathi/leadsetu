<?php

namespace App\Rules;

use App\Models\Role;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Each role must be visible to the caller's workspace and must not carry any
 * permission the caller lacks, so nobody can hand out more power than they have.
 */
class AssignableRoles implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $actor = auth()->user();
        $role = Role::query()->with('permissions')->find($value);

        if (! $role) {
            $fail('The selected role is invalid.');
            return;
        }

        if (! $actor->holdsAll($role->permissions->pluck('name'))) {
            $fail("You cannot assign the \"{$role->name}\" role because it grants permissions you do not have.");
        }
    }
}
