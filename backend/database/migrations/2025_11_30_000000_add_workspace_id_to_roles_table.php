<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Roles with workspace_id = NULL are system roles (shared templates, read-only for
 * tenants). Roles with a workspace_id are custom roles owned by that workspace.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->unsignedBigInteger('workspace_id')->nullable()->after('guard_name')->index();
            $table->dropUnique(['name', 'guard_name']);
            $table->unique(['workspace_id', 'name', 'guard_name']);
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropUnique(['workspace_id', 'name', 'guard_name']);
            $table->dropColumn('workspace_id');
            $table->unique(['name', 'guard_name']);
        });
    }
};
