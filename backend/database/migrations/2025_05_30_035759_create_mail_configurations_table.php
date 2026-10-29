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
        Schema::create('mail_configurations', function (Blueprint $table) {
                    $table->id();
        $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
        $table->string('driver')->default('smtp'); // 'smtp', 'brevo-api', etc.

        // Encrypt all sensitive credentials
        $table->text('host')->nullable();
        $table->text('port')->nullable();
        $table->text('username')->nullable();
        $table->text('password')->nullable(); // This will store the SMTP Key
        $table->text('encryption')->nullable(); // e.g., 'tls'
        $table->text('from_address')->nullable();
        $table->text('from_name')->nullable();
        $table->unique(['workspace_id', 'driver'], 'unique_workspace_driver');
        $table->timestamps();
        
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mail_configurations');
    }
};
