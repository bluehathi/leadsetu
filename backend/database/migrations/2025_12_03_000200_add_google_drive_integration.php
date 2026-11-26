<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_drive_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('google_email')->nullable();
            $table->text('access_token');
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->string('default_folder_id')->nullable();
            $table->string('default_folder_name')->nullable();
            $table->timestamps();
        });

        Schema::table('social_contents', function (Blueprint $table) {
            $table->string('drive_file_id')->nullable()->after('thumbnail_url');
            $table->string('drive_file_name')->nullable()->after('drive_file_id');
            $table->string('drive_file_url')->nullable()->after('drive_file_name');
            $table->string('drive_mime_type', 100)->nullable()->after('drive_file_url');
            $table->string('drive_thumbnail_file_id')->nullable()->after('drive_mime_type');
            $table->string('youtube_video_id', 64)->nullable()->after('drive_thumbnail_file_id');
        });
    }

    public function down(): void
    {
        Schema::table('social_contents', function (Blueprint $table) {
            $table->dropColumn([
                'drive_file_id',
                'drive_file_name',
                'drive_file_url',
                'drive_mime_type',
                'drive_thumbnail_file_id',
                'youtube_video_id',
            ]);
        });

        Schema::dropIfExists('google_drive_connections');
    }
};
