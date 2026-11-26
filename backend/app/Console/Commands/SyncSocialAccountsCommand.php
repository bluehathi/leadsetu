<?php

namespace App\Console\Commands;

use App\Models\SocialAccount;
use App\Services\SocialOAuthSyncService;
use Illuminate\Console\Command;

class SyncSocialAccountsCommand extends Command
{
    protected $signature = 'social:sync {--platform= : Optional platform filter (youtube|instagram)}';

    protected $description = 'Auto-sync all connected YouTube & Instagram accounts across workspaces';

    public function handle(SocialOAuthSyncService $syncService): int
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

        $this->info("Synced {$count} social account(s), {$failed} failed.");

        return self::SUCCESS;
    }
}
