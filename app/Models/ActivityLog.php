<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'log_name',
        'event',
        'description',
        'subject_type',
        'subject_id',
        'causer_type',
        'causer_id',
        'properties',
        'changes',
        'module',
        'ip_address',
        'user_agent',
        'url',
        'method',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'changes' => 'array',
        ];
    }

    /**
     * Get the subject of the activity.
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the causer of the activity.
     */
    public function causer(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the old values from changes.
     */
    public function getOldAttribute(): array
    {
        return $this->changes['old'] ?? [];
    }

    /**
     * Get the new values from changes.
     */
    public function getNewAttribute(): array
    {
        return $this->changes['new'] ?? [];
    }

    /**
     * Log an activity.
     */
    public static function log(
        string $event,
        string $description,
        ?Model $subject = null,
        ?Model $causer = null,
        array $properties = [],
        array $changes = [],
        ?string $module = null,
        string $logName = 'default'
    ): self {
        return self::create([
            'log_name' => $logName,
            'event' => $event,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->getKey(),
            'causer_type' => $causer ? get_class($causer) : null,
            'causer_id' => $causer?->getKey(),
            'properties' => $properties,
            'changes' => $changes,
            'module' => $module,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'url' => request()->fullUrl(),
            'method' => request()->method(),
        ]);
    }

    /**
     * Scope to filter by log name.
     */
    public function scopeInLog($query, string $logName)
    {
        return $query->where('log_name', $logName);
    }

    /**
     * Scope to filter by event.
     */
    public function scopeForEvent($query, string $event)
    {
        return $query->where('event', $event);
    }

    /**
     * Scope to filter by module.
     */
    public function scopeInModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    /**
     * Scope to filter by causer.
     */
    public function scopeCausedBy($query, Model $causer)
    {
        return $query->where('causer_type', get_class($causer))
                     ->where('causer_id', $causer->getKey());
    }

    /**
     * Scope to filter by subject.
     */
    public function scopeForSubject($query, Model $subject)
    {
        return $query->where('subject_type', get_class($subject))
                     ->where('subject_id', $subject->getKey());
    }

    /**
     * Scope to get recent logs.
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
