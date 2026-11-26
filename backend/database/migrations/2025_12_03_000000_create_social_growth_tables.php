<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('platform', 20); // youtube | instagram
            $table->string('account_name');
            $table->string('handle');
            $table->string('external_id')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('niche')->nullable();
            $table->unsignedBigInteger('followers_count')->default(0);
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedInteger('posts_count')->default(0);
            $table->decimal('engagement_rate', 5, 2)->default(0);
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->string('status', 30)->default('connected');
            $table->text('notes')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'platform']);
        });

        Schema::create('social_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('social_account_id')->constrained('social_accounts')->cascadeOnDelete();
            $table->string('platform', 20); // youtube | instagram
            $table->string('content_type', 20)->default('video'); // video | short | reel | post | carousel
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('hook')->nullable();
            $table->longText('script')->nullable();
            $table->json('tags')->nullable();
            $table->json('hashtags')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->string('target_keyword')->nullable();
            $table->string('status', 20)->default('draft'); // idea | draft | scheduled | published
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->unsignedTinyInteger('seo_score')->default(0);
            $table->json('seo_breakdown')->nullable();
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('likes_count')->default(0);
            $table->unsignedBigInteger('comments_count')->default(0);
            $table->timestamps();

            $table->index(['workspace_id', 'social_account_id', 'status']);
        });

        Schema::create('social_keywords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('social_account_id')->nullable()->constrained('social_accounts')->nullOnDelete();
            $table->string('platform', 20)->default('youtube'); // youtube | instagram | both
            $table->string('keyword');
            $table->unsignedInteger('search_volume')->default(0);
            $table->unsignedTinyInteger('competition_score')->default(50);
            $table->unsignedTinyInteger('overall_score')->default(50);
            $table->string('trend', 20)->default('steady'); // rising | steady | declining
            $table->json('related_tags')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'platform']);
        });

        Schema::create('social_competitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('social_account_id')->nullable()->constrained('social_accounts')->nullOnDelete();
            $table->string('platform', 20); // youtube | instagram
            $table->string('channel_name');
            $table->string('handle');
            $table->string('external_id')->nullable();
            $table->unsignedBigInteger('followers_count')->default(0);
            $table->unsignedBigInteger('avg_views')->default(0);
            $table->decimal('engagement_rate', 5, 2)->default(0);
            $table->string('top_video_title')->nullable();
            $table->unsignedBigInteger('top_video_views')->default(0);
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'platform']);
        });

        Schema::create('social_ideas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('social_account_id')->nullable()->constrained('social_accounts')->nullOnDelete();
            $table->string('platform', 20); // youtube | instagram
            $table->string('title');
            $table->text('hook')->nullable();
            $table->string('angle')->nullable();
            $table->unsignedTinyInteger('predicted_score')->default(75);
            $table->string('status', 20)->default('new'); // new | saved | dismissed | converted
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_ideas');
        Schema::dropIfExists('social_competitors');
        Schema::dropIfExists('social_keywords');
        Schema::dropIfExists('social_contents');
        Schema::dropIfExists('social_accounts');
    }
};
