<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class WorkSpaceScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // If the user is authenticated and has a workspace_id, apply the scope
        if (auth()->check() && auth()->user()->workspace_id) {
            $builder->where($model->getTable() . '.workspace_id', auth()->user()->workspace_id);
        }
    }
}
