<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// This migration was originally for organizations, now applies to workspaces
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('address')->nullable();
            $table->string('logo')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn(['contact_email', 'contact_phone', 'address', 'logo']);
        });
    }
};
