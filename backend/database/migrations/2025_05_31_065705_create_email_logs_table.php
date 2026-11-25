<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // User who initiated send
            
            $table->foreignId('contact_id')->nullable()->constrained()->onDelete('set null');
            
            $table->foreignId('lead_id')->nullable()->constrained()->onDelete('set null');
            
            $table->foreignId('mail_configuration_id')->nullable()->constrained('mail_configurations')->onDelete('set null');

            $table->string('recipient_email');
            $table->string('recipient_name')->nullable();
            $table->string('from_address');
            $table->string('from_name');
            $table->string('subject');
            $table->longText('body_html')->nullable(); // Consider if you need to store the full body

            $table->string('status')->default('queued'); // e.g., queued, sent, failed, delivered, opened, clicked, bounced, spam
            $table->string('esp_message_id')->nullable()->index(); // Unique ID from Email Service Provider (e.g., Brevo)

            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('opened_at')->nullable(); // Timestamp of first open
            $table->timestamp('clicked_at')->nullable(); // Timestamp of first click
            $table->timestamp('failed_at')->nullable();
            $table->text('error_message')->nullable();

            $table->unsignedInteger('opens_count')->default(0);
            $table->unsignedInteger('clicks_count')->default(0);

            $table->json('properties')->nullable(); // For any extra metadata (e.g., campaign_id)
            $table->timestamps();

            // Add indexes for frequently queried columns
            $table->index('status');
            $table->index('sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
