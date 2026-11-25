<?php

namespace App\Services;

use App\Jobs\SendEmailCampaign;
use App\Models\EmailCampaign;
use App\Models\EmailLog;
use App\Models\MailConfiguration;
use App\Support\HtmlSanitizer;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EmailCampaignService
{
    public function __construct(protected CampaignSender $sender)
    {
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return EmailCampaign::query()
            ->with('prospectLists')
            ->when(filled($filters['search'] ?? null), fn ($q) => $q->where(
                fn ($q) => $q->where('name', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('subject', 'like', '%' . $filters['search'] . '%')))
            ->when(filled($filters['status'] ?? null), fn ($q) => $q->where('status', $filters['status']))
            ->orderByDesc('updated_at')
            ->paginate(min(max($perPage, 1), 100));
    }

    /** workspace_id comes from the BelongsToWorkspace trait; new campaigns always start as drafts. */
    public function createEmailCampaign(array $data): EmailCampaign
    {
        return DB::transaction(function () use ($data) {
            $campaign = new EmailCampaign([
                'name' => $data['name'],
                'subject' => $data['subject'],
                'body' => $this->cleanBody($data['body']),
            ]);
            $campaign->user_id = Auth::id();
            $campaign->status = 'draft';
            $campaign->save();
            $campaign->prospectLists()->sync($data['prospect_list_ids']);

            return $campaign;
        });
    }

    public function updateEmailCampaign(EmailCampaign $campaign, array $data): EmailCampaign
    {
        $this->assertEditable($campaign);

        return DB::transaction(function () use ($campaign, $data) {
            if (isset($data['body'])) {
                $data['body'] = $this->cleanBody($data['body']);
            }
            $campaign->update(array_intersect_key($data, array_flip(['name', 'subject', 'body'])));
            if (isset($data['prospect_list_ids'])) {
                $campaign->prospectLists()->sync($data['prospect_list_ids']);
            }

            return $campaign;
        });
    }

    public function deleteEmailCampaign(EmailCampaign $campaign): void
    {
        if (in_array($campaign->status, ['queued', 'sending'], true)) {
            throw ValidationException::withMessages(['status' => ['A campaign that is being sent cannot be deleted.']]);
        }

        $campaign->delete();
    }

    /** Queue the campaign for immediate sending. */
    public function send(EmailCampaign $campaign): EmailCampaign
    {
        $this->assertReadyToSend($campaign);
        $this->transition($campaign, 'queued', ['scheduled_at' => null]);
        SendEmailCampaign::dispatch($campaign->id, $campaign->workspace_id);

        return $campaign->refresh();
    }

    /** Queue the campaign to go out at $at. The job only fires if the schedule is still unchanged. */
    public function schedule(EmailCampaign $campaign, CarbonInterface $at): EmailCampaign
    {
        $this->assertReadyToSend($campaign);
        $this->transition($campaign, 'scheduled', ['scheduled_at' => $at->copy()->startOfSecond()]);
        SendEmailCampaign::dispatch($campaign->id, $campaign->workspace_id, $at->copy()->startOfSecond()->timestamp)->delay($at);

        return $campaign->refresh();
    }

    public function cancelSchedule(EmailCampaign $campaign): EmailCampaign
    {
        if ($campaign->status !== 'scheduled') {
            throw ValidationException::withMessages(['status' => ['Only a scheduled campaign can be cancelled.']]);
        }
        $this->transition($campaign, 'draft', ['scheduled_at' => null], ['scheduled']);

        return $campaign->refresh();
    }

    /** @return array{recipients:int, sent:int, delivered:int, failed:int, opened:int, clicked:int} */
    public function stats(EmailCampaign $campaign): array
    {
        $logs = EmailLog::where('campaign_id', $campaign->id);

        return [
            'recipients' => $this->sender->recipientsQuery($campaign)->count(),
            'sent' => (clone $logs)->whereNotNull('sent_at')->count(),
            'delivered' => (clone $logs)->whereNotNull('delivered_at')->count(),
            'failed' => (clone $logs)->whereNotNull('failed_at')->count(),
            'opened' => (clone $logs)->whereNotNull('opened_at')->count(),
            'clicked' => (clone $logs)->whereNotNull('clicked_at')->count(),
        ];
    }

    public function deliveries(EmailCampaign $campaign, array $filters = [], int $perPage = 25): LengthAwarePaginator
    {
        return EmailLog::where('campaign_id', $campaign->id)
            ->when(filled($filters['status'] ?? null), fn ($q) => $q->where('status', $filters['status']))
            ->orderByDesc('id')
            ->paginate(min(max($perPage, 1), 100));
    }

    private function cleanBody(string $html): string
    {
        $clean = trim(HtmlSanitizer::clean($html));
        if ($clean === '') {
            throw ValidationException::withMessages(['body' => ['The email body is empty after removing unsafe content.']]);
        }

        return $clean;
    }

    private function assertEditable(EmailCampaign $campaign): void
    {
        if (! $campaign->isEditable()) {
            throw ValidationException::withMessages(['status' => ['Only draft or scheduled campaigns can be edited.']]);
        }
    }

    private function assertReadyToSend(EmailCampaign $campaign): void
    {
        $this->assertEditable($campaign);

        $smtp = MailConfiguration::query()->where('driver', 'smtp')->first();
        if (! $smtp || blank($smtp->host)) {
            throw ValidationException::withMessages(['campaign' => ['Configure your SMTP settings before sending.']]);
        }
        if ($this->sender->recipientsQuery($campaign)->count() === 0) {
            throw ValidationException::withMessages(['campaign' => ['The selected lists have no subscribed contacts with an email address.']]);
        }
    }

    /** Atomic status change so concurrent requests cannot both win. */
    private function transition(EmailCampaign $campaign, string $to, array $extra = [], array $from = EmailCampaign::EDITABLE): void
    {
        $changed = EmailCampaign::query()->whereKey($campaign->id)->whereIn('status', $from)
            ->update(['status' => $to] + $extra);

        if ($changed !== 1) {
            throw ValidationException::withMessages(['status' => ['The campaign changed in the meantime. Reload and try again.']]);
        }
    }
}
