<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per workspace: who is selling, where, and in which currency/tax regime.
        Schema::create('business_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('legal_name');
            $table->string('country', 2);            // IN | US
            $table->string('currency', 3);           // INR | USD
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state_code', 2)->nullable(); // IN: GST state code (e.g. 27); US: postal abbreviation
            $table->string('postal_code', 12)->nullable();
            $table->string('tax_id', 20)->nullable();    // GSTIN (IN) / EIN or sales-tax permit (US)
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->unsignedTinyInteger('fy_start_month')->default(4);
            $table->string('invoice_prefix', 5)->default('INV');
            $table->string('quote_prefix', 5)->default('QT');
            $table->unsignedSmallInteger('default_due_days')->default(15);
            $table->text('default_terms')->nullable();
            $table->timestamps();
        });

        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('rate', 6, 3);              // percent, e.g. 18.000 or 8.875
            $table->boolean('is_default')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['workspace_id', 'name']);
        });

        Schema::create('document_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20);                 // invoice | quote
            $table->string('period', 20);               // financial year label, e.g. 25-26
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();
            $table->unique(['workspace_id', 'type', 'period']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->string('billing_email')->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state_code', 2)->nullable();
            $table->string('postal_code', 12)->nullable();
            $table->string('country', 2)->nullable();
            $table->string('tax_id', 20)->nullable();   // customer GSTIN / VAT-style id
            $table->boolean('tax_exempt')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['billing_email', 'address_line1', 'address_line2', 'city', 'state_code', 'postal_code', 'country', 'tax_id', 'tax_exempt']);
        });
        Schema::dropIfExists('document_sequences');
        Schema::dropIfExists('tax_rates');
        Schema::dropIfExists('business_profiles');
    }
};
