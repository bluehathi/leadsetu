<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('social_contents', function (Blueprint $table) {
            $table->string('instagram_media_id', 64)->nullable()->after('youtube_video_id');
            $table->string('published_url', 500)->nullable()->after('instagram_media_id');
        });
    }

    public function down(): void
    {
        Schema::table('social_contents', function (Blueprint $table) {
            $table->dropColumn(['instagram_media_id', 'published_url']);
        });
    }
};
