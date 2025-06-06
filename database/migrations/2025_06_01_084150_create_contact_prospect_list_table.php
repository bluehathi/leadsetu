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
        Schema::create('contact_prospect_list', function (Blueprint $table) {
            $table->foreignId('contact_id')->constrained()->onDelete('cascade');
            $table->foreignId('prospect_list_id')->constrained()->onDelete('cascade');
            $table->timestamp('subscribed_at')->useCurrent();

            // Set a composite primary key to prevent duplicate entries
            $table->primary(['contact_id', 'prospect_list_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_prospect_list');
    }
};
