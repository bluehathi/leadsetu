<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_campaign_prospect_list', function (Blueprint $table) {
            $table->id();
            $table->foreignId('email_campaign_id')->constrained()->onDelete('cascade');
            $table->foreignId('prospect_list_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->unique(['email_campaign_id', 'prospect_list_id'], 'ecpl_campaign_list_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_campaign_prospect_list');
    }
};
