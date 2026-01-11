<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'quotation_status_history';

    protected $fillable = [
        'quotation_id',
        'user_id',
        'from_status',
        'to_status',
        'notes',
        'action',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    // Relationships
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Get status label
    public function getStatusLabelAttribute(): string
    {
        $statuses = Quotation::getStatuses();
        return $statuses[$this->to_status] ?? $this->to_status;
    }

    // Get action label
    public function getActionLabelAttribute(): string
    {
        $actions = [
            'created' => 'Created',
            'updated' => 'Updated',
            'status_changed' => 'Status Changed',
            'sent' => 'Sent to Client',
            'pdf_generated' => 'PDF Generated',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'accepted' => 'Accepted by Client',
            'version_created' => 'New Version Created',
        ];

        return $actions[$this->action] ?? ucfirst(str_replace('_', ' ', $this->action ?? ''));
    }
}
