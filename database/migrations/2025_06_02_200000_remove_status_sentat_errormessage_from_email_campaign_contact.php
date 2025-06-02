<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class  extends Migration {
    public function up(): void
    {
        Schema::table('email_campaign_contact', function (Blueprint $table) {
            if (Schema::hasColumn('email_campaign_contact', 'status')) {
                $table->dropColumn('status');
            }
            if (Schema::hasColumn('email_campaign_contact', 'sent_at')) {
                $table->dropColumn('sent_at');
            }
            if (Schema::hasColumn('email_campaign_contact', 'error_message')) {
                $table->dropColumn('error_message');
            }
        });
    }

    public function down(): void
    {
        Schema::table('email_campaign_contact', function (Blueprint $table) {
            $table->string('status')->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->text('error_message')->nullable();
        });
    }
};
