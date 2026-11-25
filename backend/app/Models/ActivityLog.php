<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use \App\Models\Concerns\BelongsToWorkspace;

    private const SENSITIVE_KEY = '/pass(word)?|token|secret|api[_-]?key|authorization|credential/i';

    protected $fillable = [
        'user_id',
        'workspace_id',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'properties',
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    protected static function booted(): void
    {
        // The audit trail must never become a place where secrets are stored, whichever code writes to it.
        static::saving(function (ActivityLog $log) {
            if (is_array($log->properties)) {
                $log->properties = static::redact($log->properties);
            }
        });
    }

    /** Recursively masks values stored under sensitive-looking keys. */
    public static function redact(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($key) && preg_match(self::SENSITIVE_KEY, $key)) {
                $data[$key] = '[redacted]';
            } elseif (is_array($value)) {
                $data[$key] = static::redact($value);
            }
        }

        return $data;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
