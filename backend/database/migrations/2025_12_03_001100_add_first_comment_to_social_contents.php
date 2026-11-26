<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('social_contents', function (Blueprint $table) {
            $table->text('first_comment')->nullable()->after('description');
            $table->boolean('pin_first_comment')->default(true)->after('first_comment');
            $table->string('first_comment_id', 128)->nullable()->after('published_url');
            $table->text('first_comment_error')->nullable()->after('publish_error');
        });
    }

    public function down(): void
    {
        Schema::table('social_contents', function (Blueprint $table) {
            $table->dropColumn(['first_comment', 'pin_first_comment', 'first_comment_id', 'first_comment_error']);
        });
    }
};
