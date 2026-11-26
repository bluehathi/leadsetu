<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->json('analytics_cache')->nullable()->after('last_synced_at');
            $table->timestamp('analytics_synced_at')->nullable()->after('analytics_cache');
        });

        Schema::create('social_video_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('social_account_id')->constrained('social_accounts')->cascadeOnDelete();
            $table->string('external_video_id', 64);
            $table->json('payload');
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->unique(['social_account_id', 'external_video_id'], 'social_video_analytics_account_video_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_video_analytics');

        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropColumn(['analytics_cache', 'analytics_synced_at']);
        });
    }
};
