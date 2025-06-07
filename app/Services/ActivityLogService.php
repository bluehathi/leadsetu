<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Save an activity log entry.
     *
     * @param string $action
     * @param mixed|null $subject
     * @param string|null $description
     * @param array $properties
     * @return ActivityLog
     */
    public function log(string $action, $subject = null, ?string $description = null, array $properties = []): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user() ? Auth::user()->workspace_id : null,
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject->id ?? null,
            'description' => $description,
            'properties' => $properties,
        ]);
    }
}
