<?php

namespace App\Services;

use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Contact;
use App\Models\EmailCampaign;
use App\Models\EmailLog;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Workspace overview. Each section is only computed for users who may see that area, and every
 * query goes through the tenant-scoped models (EmailLog has no scope, so it is filtered explicitly).
 */
class DashboardService
{
    private const OPEN_STATUSES = ['new', 'contacted', 'qualified'];

    public function build(User $user): array
    {
        return [
            'leads' => $user->can('view_leads') ? $this->leads() : null,
            'contacts' => $user->can('view_contacts') ? $this->contacts() : null,
            'companies' => $user->can('view_companies') ? ['total' => Company::count()] : null,
            'campaigns' => $user->can('view_campaigns') ? $this->campaigns($user->workspace_id) : null,
            'recent_activity' => $user->can('view_activity_logs') ? $this->recentActivity() : null,
        ];
    }

    private function leads(): array
    {
        $total = Lead::count();
        $won = Lead::where('status', 'won')->count();
        $byStatus = Lead::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        $months = collect(range(5, 0))->map(function (int $ago) {
            $start = now()->startOfMonth()->subMonths($ago);
            $row = Lead::query()
                ->whereBetween('created_at', [$start, $start->copy()->endOfMonth()])
                ->selectRaw("count(*) as created, coalesce(sum(case when status = 'won' then 1 else 0 end), 0) as won")
                ->first();

            return ['month' => $start->format('Y-m'), 'label' => $start->format('M'), 'created' => (int) $row->created, 'won' => (int) $row->won];
        })->values();

        return [
            'total' => $total,
            'won' => $won,
            'conversion_rate' => $total > 0 ? round($won / $total * 100, 1) : 0,
            'by_status' => $byStatus,
            'open_pipeline_value' => (int) Lead::whereIn('status', self::OPEN_STATUSES)->sum('deal_value'),
            'won_value' => (int) Lead::where('status', 'won')->sum('deal_value'),
            'new_this_month' => Lead::where('created_at', '>=', now()->startOfMonth())->count(),
            'per_month' => $months,
        ];
    }

    private function contacts(): array
    {
        return [
            'total' => Contact::count(),
            'new_this_month' => Contact::where('created_at', '>=', now()->startOfMonth())->count(),
            'unsubscribed' => Contact::whereNotNull('unsubscribed_at')->count(),
        ];
    }

    private function campaigns(int $workspaceId): array
    {
        $since = Carbon::now()->subDays(30);
        $logs = EmailLog::query()->where('workspace_id', $workspaceId)->whereNotNull('campaign_id')->where('created_at', '>=', $since);
        $sent = (clone $logs)->whereNotNull('sent_at')->count();
        $opened = (clone $logs)->whereNotNull('opened_at')->count();

        return [
            'total' => EmailCampaign::count(),
            'by_status' => EmailCampaign::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'emails_sent_30d' => $sent,
            'open_rate_30d' => $sent > 0 ? round($opened / $sent * 100, 1) : 0,
        ];
    }

    private function recentActivity(): array
    {
        return ActivityLogResource::collection(
            ActivityLog::query()->with('user:id,name')->orderByDesc('id')->limit(10)->get()
        )->resolve();
    }
}
