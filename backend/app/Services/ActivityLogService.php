<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
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

    private const PER_PAGE = 20;

    /** @param array{user_id?:mixed,action?:mixed,entity?:mixed,from?:mixed,to?:mixed} $filters */
    public function paginate(array $filters = [], int $perPage = self::PER_PAGE): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = ActivityLog::query()->with('user:id,name');

        if (filled($filters['user_id'] ?? null)) {
            $query->where('user_id', $filters['user_id']);
        }
        if (filled($filters['action'] ?? null)) {
            $query->where('action', $filters['action']);
        }
        if (filled($filters['entity'] ?? null)) {
            // Entities are shown by short name ("Lead"); map back to the stored class names.
            $types = ActivityLog::query()->whereNotNull('subject_type')->distinct()->pluck('subject_type')
                ->filter(fn ($t) => class_basename($t) === $filters['entity'])->all();
            $query->whereIn('subject_type', $types ?: ['__none__']);
        }
        if (filled($filters['from'] ?? null)) {
            $query->where('created_at', '>=', \Illuminate\Support\Carbon::parse($filters['from'])->startOfDay());
        }
        if (filled($filters['to'] ?? null)) {
            $query->where('created_at', '<=', \Illuminate\Support\Carbon::parse($filters['to'])->endOfDay());
        }

        return $query->orderByDesc('id')->paginate(min(max($perPage, 1), 100));
    }

    /** Values for the filter dropdowns, limited to the current workspace. */
    public function filterOptions(): array
    {
        return [
            'actions' => ActivityLog::query()->distinct()->orderBy('action')->pluck('action')->values(),
            'entities' => ActivityLog::query()->whereNotNull('subject_type')->distinct()->pluck('subject_type')
                ->map(fn ($t) => class_basename($t))->unique()->sort()->values(),
            'users' => User::query()->where('workspace_id', Auth::user()->workspace_id)->orderBy('name')->get(['id', 'name']),
        ];
    }
}
