<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'timezone',
        'is_active',
    ];
    protected $casts = [
        'is_active' => 'boolean',
    ];
    protected $table = 'workspaces';
    protected $primaryKey = 'id';

    public function owners()
    {
        return $this->belongsToMany(User::class, 'workspace_owners');
    }

    public function resolvedTimezone(): string
    {
        return $this->timezone ?: 'Asia/Kolkata';
    }

    /**
     * Parse a datetime string (naive strings are interpreted in the workspace timezone)
     * and normalize to UTC for consistent database storage.
     */
    public static function parseInTimezone(?string $raw, ?string $timezone = null): ?Carbon
    {
        $raw = trim((string) $raw);
        if ($raw === '') {
            return null;
        }

        $tz = $timezone ?: 'Asia/Kolkata';
        $hasExplicitOffset = (bool) preg_match('/(Z|[+\-]\d{2}:?\d{2}|GMT|UTC|IST)$/i', $raw);

        return $hasExplicitOffset
            ? Carbon::parse($raw)->utc()
            : Carbon::parse($raw, $tz)->utc();
    }
}
