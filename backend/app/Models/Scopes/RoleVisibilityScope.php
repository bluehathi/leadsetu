<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/** A tenant sees system roles (workspace_id NULL) plus its own custom roles. */
class RoleVisibilityScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if (! $user) {
            // Seeders / artisan are unrestricted; an unauthenticated HTTP request sees system roles only.
            if (! app()->runningInConsole()) {
                $builder->whereNull($model->getTable() . '.workspace_id');
            }
            return;
        }

        $builder->where(function (Builder $q) use ($model, $user) {
            $q->whereNull($model->getTable() . '.workspace_id');
            if ($user->workspace_id !== null) {
                $q->orWhere($model->getTable() . '.workspace_id', $user->workspace_id);
            }
        });
    }
}
