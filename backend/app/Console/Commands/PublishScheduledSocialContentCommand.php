<?php

namespace App\Console\Commands;

use App\Models\GoogleDriveConnection;
use App\Models\SocialContent;
use App\Services\ActivityLogService;
use App\Services\GoogleDriveService;
use App\Support\WorkspaceContext;
use Illuminate\Console\Command;

class PublishScheduledSocialContentCommand extends Command
{
    protected $signature = 'social:publish-scheduled';

    protected $description = 'Automatically publish scheduled Content Planner items whose scheduled_at time has arrived';

    public function handle(GoogleDriveService $drive, ActivityLogService $audit): int
    {
        $due = SocialContent::withoutGlobalScopes()
            ->with('account')
            ->where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->whereNull('publish_error')
            ->orderBy('scheduled_at')
            ->limit(20)
            ->get();

        $published = 0;
        $failed = 0;

        foreach ($due as $content) {
            WorkspaceContext::run((int) $content->workspace_id, function () use ($content, $drive, $audit, &$published, &$failed) {
                try {
                    $updated = $drive->publishContent($content, 'public');
                    $audit->log('social_content_auto_published', $updated, "Auto-published '{$updated->title}' to {$updated->platform}");
                    $published++;
                } catch (\Throwable $e) {
                    $failed++;
                    report($e);
                    $this->warn("Content #{$content->id} failed: {$e->getMessage()}");
                }
            });
        }

        if ($published > 0 || $failed > 0) {
            $this->info("Scheduled publish complete: {$published} published, {$failed} failed.");
        }

        return self::SUCCESS;
    }
}
