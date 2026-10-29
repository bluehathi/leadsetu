<?php

namespace App\Models\Scopes;

use App\Support\WorkspaceContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class WorkSpaceScope implements Scope
{
    /**
     * Restrict queries to the current tenant. Fails closed: an HTTP request whose
     * user has no workspace (or no user at all) sees nothing. Only console contexts
     * (seeders, artisan, queue workers) without a tenant are left unscoped, and jobs
     * should wrap their work in WorkspaceContext::run().
     */
    public function apply(Builder $builder, Model $model): void
    {
        $column = $model->getTable() . '.workspace_id';

        if (($workspaceId = WorkspaceContext::id()) !== null) {
            $builder->where($column, $workspaceId);
            return;
        }

        if (auth()->check()) {
            $workspaceId = auth()->user()->workspace_id;
            $workspaceId === null ? $builder->whereRaw('1 = 0') : $builder->where($column, $workspaceId);
            return;
        }

        if (! app()->runningInConsole()) {
            $builder->whereRaw('1 = 0');
        }
    }
}
