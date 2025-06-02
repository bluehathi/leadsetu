<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('email_campaign_contact', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('email_campaign_id');
            $table->unsignedBigInteger('contact_id');
            $table->string('status')->default('pending'); // pending, sent, failed
            $table->timestamp('sent_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('email_campaign_id')->references('id')->on('email_campaigns')->onDelete('cascade');
            $table->foreign('contact_id')->references('id')->on('contacts')->onDelete('cascade');
            $table->unique(['email_campaign_id', 'contact_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_campaign_contact');
    }
};
