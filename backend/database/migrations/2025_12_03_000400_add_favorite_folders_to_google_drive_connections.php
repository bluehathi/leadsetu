<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('google_drive_connections', function (Blueprint $table) {
            $table->json('favorite_folders')->nullable()->after('default_folder_name');
        });
    }

    public function down(): void
    {
        Schema::table('google_drive_connections', function (Blueprint $table) {
            $table->dropColumn('favorite_folders');
        });
    }
};
