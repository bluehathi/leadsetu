<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('google_drive_connections', function (Blueprint $table) {
            $table->boolean('lock_to_default_folder')->default(false)->after('favorite_folders');
        });
    }

    public function down(): void
    {
        Schema::table('google_drive_connections', function (Blueprint $table) {
            $table->dropColumn('lock_to_default_folder');
        });
    }
};
