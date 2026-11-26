<?php

namespace App\Console\Commands;

use App\Models\GoogleDriveConnection;
use App\Models\SocialAccount;
use App\Services\GoogleDriveService;
use App\Services\SocialOAuthSyncService;
use Illuminate\Console\Command;

class SyncSocialAccountsCommand extends Command
{
    protected $signature = 'social:sync {--platform= : Optional platform filter (youtube|instagram)}';

    protected $description = 'Auto-sync all connected YouTube & Instagram accounts and Drive metadata cache across workspaces';

    public function handle(SocialOAuthSyncService $syncService, GoogleDriveService $driveService): int
    {
        $query = SocialAccount::withoutGlobalScopes()
            ->where('status', 'connected');

        if ($platform = $this->option('platform')) {
            $query->where('platform', $platform);
        }

        $count = 0;
        $failed = 0;
        foreach ($query->cursor() as $account) {
            // One broken account (network error, revoked token) must not stop the rest.
            try {
                $syncService->syncAccount($account);
                $count++;
            } catch (\Throwable $e) {
                $failed++;
                report($e);
                $this->warn("Account #{$account->id} ({$account->platform}) failed: {$e->getMessage()}");
            }
        }

        $driveCount = 0;
        if (! $platform) {
            foreach (GoogleDriveConnection::withoutGlobalScopes()->cursor() as $conn) {
                try {
                    $driveService->listFiles($conn, $conn->default_folder_id ?: null, null, true);
                    $driveCount++;
                } catch (\Throwable $e) {
                    report($e);
                    $this->warn("Drive #{$conn->id} failed: {$e->getMessage()}");
                }
            }
        }

        $this->info("Synced {$count} social account(s), {$driveCount} Drive folder(s), {$failed} failed.");

        return self::SUCCESS;
    }
}
