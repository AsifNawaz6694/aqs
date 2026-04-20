<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;
use App\Mail\PasswordResetMail;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'password_setup_token',
        'password_setup_token_expires_at',
        'password_set',
        'role_id',
        'signature_html',
        'status',
        'last_login_at',
        'last_login_ip',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'password_setup_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'password_setup_token_expires_at' => 'datetime',
            'password_set' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Get the role that owns the user.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the profile associated with the user.
     */
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    /**
     * Get the two factor codes for the user.
     */
    public function twoFactorCodes(): HasMany
    {
        return $this->hasMany(TwoFactorCode::class);
    }

    /**
     * Get the activity logs caused by this user.
     */
    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'causer');
    }

    /**
     * Get the products created by this user.
     */
    public function createdProducts(): HasMany
    {
        return $this->hasMany(Product::class, 'created_by');
    }

    /**
     * Get the clients assigned to this user.
     */
    public function assignedClients(): HasMany
    {
        return $this->hasMany(Client::class, 'assigned_to');
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $roleSlug): bool
    {
        return $this->role && $this->role->slug === $roleSlug;
    }

    /**
     * Check if user has any of the given roles.
     */
    public function hasAnyRole(array $roleSlugs): bool
    {
        return $this->role && in_array($this->role->slug, $roleSlugs);
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if (!$this->role) {
            return false;
        }

        // SuperAdmin has all permissions
        if ($this->role->slug === 'super-admin') {
            return true;
        }

        return $this->role->permissions()->where('slug', $permissionSlug)->exists();
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissionSlugs): bool
    {
        if (!$this->role) {
            return false;
        }

        // SuperAdmin has all permissions
        if ($this->role->slug === 'super-admin') {
            return true;
        }

        return $this->role->permissions()->whereIn('slug', $permissionSlugs)->exists();
    }

    /**
     * Check if user is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if password setup token is valid.
     */
    public function isPasswordSetupTokenValid(): bool
    {
        return $this->password_setup_token &&
               $this->password_setup_token_expires_at &&
               $this->password_setup_token_expires_at->isFuture();
    }

    /**
     * Send the password reset notification using a custom mailable.
     */
    public function sendPasswordResetNotification($token): void
    {
        $resetUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $this->email,
        ], false));

        Mail::to($this->email)->send(new PasswordResetMail($this, $resetUrl));
    }

    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include users with password set.
     */
    public function scopePasswordSet($query)
    {
        return $query->where('password_set', true);
    }
}
