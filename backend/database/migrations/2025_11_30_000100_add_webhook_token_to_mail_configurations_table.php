<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Per-workspace secret for the provider webhook URL (replaces one secret shared by all tenants). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mail_configurations', function (Blueprint $table) {
            $table->string('webhook_token', 64)->nullable()->unique()->after('from_name');
        });
    }

    public function down(): void
    {
        Schema::table('mail_configurations', function (Blueprint $table) {
            $table->dropUnique(['webhook_token']);
            $table->dropColumn('webhook_token');
        });
    }
};
