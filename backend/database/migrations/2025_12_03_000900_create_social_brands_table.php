<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_brands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('niche', 120)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'name']);
        });

        Schema::table('social_accounts', function (Blueprint $table) {
            $table->foreignId('social_brand_id')
                ->nullable()
                ->after('user_id')
                ->constrained('social_brands')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('social_brand_id');
        });

        Schema::dropIfExists('social_brands');
    }
};
