<?php

namespace App\Jobs;

use App\Models\EmailCampaign;
use App\Services\CampaignSender;
use App\Support\WorkspaceContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

/**
 * Sends a campaign in the background. Carries only ids and runs inside the campaign's own
 * workspace context. The status transition is atomic, so duplicate or stale jobs (campaign
 * rescheduled, cancelled, already sent) do nothing.
 */
class SendEmailCampaign implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 3600;

    /** @param int|null $scheduledFor unix time the job was scheduled for (null = send now) */
    public function __construct(public int $campaignId, public int $workspaceId, public ?int $scheduledFor = null)
    {
    }

    public function handle(CampaignSender $sender): void
    {
        WorkspaceContext::run($this->workspaceId, function () use ($sender) {
            $claimed = EmailCampaign::query()
                ->whereKey($this->campaignId)
                ->when(
                    $this->scheduledFor === null,
                    fn ($q) => $q->where('status', 'queued'),
                    fn ($q) => $q->where('status', 'scheduled')->where('scheduled_at', date('Y-m-d H:i:s', $this->scheduledFor)),
                )
                ->update(['status' => 'sending']);

            if ($claimed !== 1) {
                return; // cancelled, rescheduled, or already handled
            }

            $campaign = EmailCampaign::with('user')->findOrFail($this->campaignId);

            try {
                $result = $sender->send($campaign);
            } catch (\Throwable $e) {
                $campaign->forceFill(['status' => 'failed', 'failed_at' => now()])->save();
                throw $e;
            }

            $nothingWentOut = $result['sent'] === 0 && $result['skipped'] === 0;
            $campaign->forceFill($nothingWentOut
                ? ['status' => 'failed', 'failed_at' => now()]
                : ['status' => 'sent', 'sent_at' => now()])->save();
        });
    }
}
