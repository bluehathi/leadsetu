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
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name', 180);
            $table->string('email', 180)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('company', 180);
            $table->string('website', 180)->nullable();
            $table->text('notes');
            $table->string('status', 180);
            $table->string('source', 180);
            $table->string('title', 180)->nullable();
            $table->string('positions', 180)->nullable();
            $table->json('tags')->nullable();
            $table->integer('deal_value')->nullable();
            $table->date('expected_close')->nullable();
            $table->integer('lead_score')->nullable();
            $table->string('lead_owner', 180)->nullable();
            $table->string('priority', 20)->nullable();
            $table->json('attachments')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
