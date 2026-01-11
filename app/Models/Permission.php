<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'group',
        'description',
    ];

    /**
     * Get the roles that have this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permission')->withTimestamps();
    }

    /**
     * Scope to get permissions by group.
     */
    public function scopeInGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    /**
     * Get all unique permission groups.
     */
    public static function getGroups(): array
    {
        return self::distinct()->pluck('group')->toArray();
    }

    /**
     * Get permissions grouped by their group.
     */
    public static function getAllGrouped(): array
    {
        return self::all()->groupBy('group')->toArray();
    }
}
