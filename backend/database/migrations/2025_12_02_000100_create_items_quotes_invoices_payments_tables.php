<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Money is stored as integer minor units (paise / cents); quantities as thousandths.
 * Issued invoices are immutable: they carry snapshots of the seller and buyer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('type', 10)->default('service');   // product | service
            $table->string('name');
            $table->string('sku', 60)->nullable();
            $table->text('description')->nullable();
            $table->string('unit', 20)->default('nos');
            $table->unsignedBigInteger('price_minor')->default(0);
            $table->foreignId('tax_rate_id')->nullable()->constrained('tax_rates')->nullOnDelete();
            $table->string('hsn_sac', 10)->nullable();        // India: HSN (goods) / SAC (services)
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['workspace_id', 'sku']);
        });

        foreach (['quotes', 'invoices'] as $doc) {
            Schema::create($doc, function (Blueprint $table) use ($doc) {
                $table->id();
                $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained();
                $table->foreignId('company_id')->constrained();
                $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
                $table->string('number', 30)->nullable();
                $table->string('status', 20)->default('draft');
                $table->date('issue_date')->nullable();
                $table->date($doc === 'quotes' ? 'valid_until' : 'due_date')->nullable();
                $table->string('currency', 3);
                $table->string('country', 2);
                $table->string('place_of_supply', 2)->nullable();   // buyer's state code (GST place of supply)
                $table->bigInteger('subtotal_minor')->default(0);   // before discount, before tax
                $table->bigInteger('discount_minor')->default(0);
                $table->bigInteger('tax_minor')->default(0);
                $table->bigInteger('total_minor')->default(0);
                $table->json('tax_breakup')->nullable();           // [{code,label,rate,amount_minor}]
                $table->text('notes')->nullable();
                $table->text('terms')->nullable();
                $table->json('seller_snapshot')->nullable();        // frozen when issued
                $table->json('buyer_snapshot')->nullable();
                if ($doc === 'quotes') {
                    $table->unsignedBigInteger('invoice_id')->nullable();  // set when converted
                } else {
                    $table->unsignedBigInteger('quote_id')->nullable();
                    $table->bigInteger('amount_paid_minor')->default(0);
                    $table->bigInteger('balance_minor')->default(0);
                    $table->timestamp('issued_at')->nullable();
                    $table->timestamp('voided_at')->nullable();
                    $table->string('void_reason')->nullable();
                }
                $table->timestamps();
                $table->unique(['workspace_id', 'number']);   // NULLs (drafts) do not collide
                $table->index(['workspace_id', 'status']);
            });

            Schema::create($doc === 'quotes' ? 'quote_lines' : 'invoice_lines', function (Blueprint $table) use ($doc) {
                $table->id();
                $table->foreignId($doc === 'quotes' ? 'quote_id' : 'invoice_id')->constrained($doc)->cascadeOnDelete();
                $table->unsignedSmallInteger('position')->default(0);
                $table->foreignId('item_id')->nullable()->constrained()->nullOnDelete();
                $table->string('description');
                $table->string('hsn_sac', 10)->nullable();
                $table->string('unit', 20)->nullable();
                $table->bigInteger('quantity_milli');                 // 1.5 units = 1500
                $table->bigInteger('unit_price_minor');
                $table->decimal('discount_percent', 5, 2)->default(0);
                $table->decimal('tax_rate', 6, 3)->default(0);
                $table->bigInteger('gross_minor');                    // qty * price
                $table->bigInteger('discount_minor')->default(0);
                $table->bigInteger('taxable_minor');                  // gross - discount
                $table->bigInteger('tax_minor')->default(0);
                $table->bigInteger('total_minor');                    // taxable + tax
                $table->timestamps();
            });
        }

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->bigInteger('amount_minor');
            $table->date('paid_at');
            $table->string('method', 20);
            $table->string('reference', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();
            $table->timestamps();
            $table->index(['workspace_id', 'invoice_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoice_lines');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('quote_lines');
        Schema::dropIfExists('quotes');
        Schema::dropIfExists('items');
    }
};
