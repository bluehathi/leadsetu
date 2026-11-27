<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('social_contents', function (Blueprint $table) {
            $table->boolean('contains_ai_content')->default(false)->after('pin_first_comment');
        });
    }

    public function down(): void
    {
        Schema::table('social_contents', function (Blueprint $table) {
            $table->dropColumn('contains_ai_content');
        });
    }
};
