<?php

namespace App\Models\Concerns;

use App\Models\Scopes\WorkSpaceScope;
use App\Models\Workspace;
use App\Support\WorkspaceContext;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tenant-owned model: queries are scoped to the current workspace and new rows
 * always take the tenant from the authenticated user, never from request input.
 */
trait BelongsToWorkspace
{
    public static function bootBelongsToWorkspace(): void
    {
        static::addGlobalScope(new WorkSpaceScope());

        static::creating(function ($model) {
            $workspaceId = WorkspaceContext::id() ?? auth()->user()?->workspace_id;

            if ($workspaceId !== null) {
                $model->workspace_id = $workspaceId;
            }
        });
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
