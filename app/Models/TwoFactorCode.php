<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TwoFactorCode extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'code',
        'type',
        'expires_at',
        'used_at',
        'ip_address',
        'user_agent',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the two factor code.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the code is valid (not expired and not used).
     */
    public function isValid(): bool
    {
        return !$this->isExpired() && !$this->isUsed();
    }

    /**
     * Check if the code is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the code has been used.
     */
    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    /**
     * Mark the code as used.
     */
    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }

    /**
     * Generate a new 6-digit code.
     */
    public static function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Create a new two factor code for user.
     */
    public static function createForUser(User $user, string $type = 'login', int $expiresInMinutes = 10): self
    {
        // Invalidate existing codes of the same type
        self::where('user_id', $user->id)
            ->where('type', $type)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        return self::create([
            'user_id' => $user->id,
            'code' => self::generateCode(),
            'type' => $type,
            'expires_at' => now()->addMinutes($expiresInMinutes),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Scope to get valid codes.
     */
    public function scopeValid($query)
    {
        return $query->whereNull('used_at')
                     ->where('expires_at', '>', now());
    }

    /**
     * Scope to get codes by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
