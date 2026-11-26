<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_drive_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('drive_file_id', 128);
            $table->string('parent_folder_id', 128)->default('root');
            $table->string('name');
            $table->string('mime_type', 128);
            $table->boolean('is_folder')->default(false);
            $table->boolean('is_video')->default(false);
            $table->boolean('is_image')->default(false);
            $table->unsignedBigInteger('size')->nullable();
            $table->string('thumbnail_url', 1000)->nullable();
            $table->string('web_view_url', 1000)->nullable();
            $table->timestamp('modified_time')->nullable();
            $table->unsignedBigInteger('duration_millis')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'drive_file_id'], 'gdrive_files_workspace_file_unique');
            $table->index(['workspace_id', 'parent_folder_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_drive_files');
    }
};
