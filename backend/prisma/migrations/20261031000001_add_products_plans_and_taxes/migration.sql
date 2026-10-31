-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SOFTWARE', 'SERVICE', 'ADD_ON', 'OTHER');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('SALES_TAX', 'VAT', 'GST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaxCalculationMethod" AS ENUM ('EXCLUSIVE', 'INCLUSIVE');

-- CreateEnum
CREATE TYPE "TaxApplicability" AS ENUM ('ALL', 'PRODUCTS_ONLY', 'PLANS_ONLY');

-- CreateTable products
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "product_type" "ProductType" NOT NULL DEFAULT 'SOFTWARE',
    "sale_price" DECIMAL(12,2) NOT NULL,
    "cost_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_variants
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_adjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sku" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable subscription_plans
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "billing_interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "billing_interval_count" INTEGER NOT NULL DEFAULT 1,
    "minimum_quantity" INTEGER NOT NULL DEFAULT 1,
    "available_from" TIMESTAMP(3),
    "available_until" TIMESTAMP(3),
    "auto_close_enabled" BOOLEAN NOT NULL DEFAULT false,
    "allow_early_close" BOOLEAN NOT NULL DEFAULT true,
    "allow_pause" BOOLEAN NOT NULL DEFAULT true,
    "allow_renewal" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable taxes
CREATE TABLE "taxes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(6,4) NOT NULL,
    "tax_type" "TaxType" NOT NULL DEFAULT 'GST',
    "calculation_method" "TaxCalculationMethod" NOT NULL DEFAULT 'EXCLUSIVE',
    "applicable_to" "TaxApplicability" NOT NULL DEFAULT 'ALL',
    "effective_from" TIMESTAMP(3),
    "effective_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_taxes
CREATE TABLE "product_taxes" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tax_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable plan_taxes
CREATE TABLE "plan_taxes" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "tax_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");
CREATE INDEX "products_product_type_idx" ON "products"("product_type");
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");
CREATE INDEX "product_variants_is_active_idx" ON "product_variants"("is_active");
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "subscription_plans_billing_interval_idx" ON "subscription_plans"("billing_interval");
CREATE INDEX "subscription_plans_is_active_idx" ON "subscription_plans"("is_active");
CREATE INDEX "subscription_plans_available_from_available_until_idx" ON "subscription_plans"("available_from", "available_until");

-- CreateIndex
CREATE INDEX "taxes_is_active_idx" ON "taxes"("is_active");
CREATE INDEX "taxes_tax_type_idx" ON "taxes"("tax_type");
CREATE INDEX "taxes_calculation_method_idx" ON "taxes"("calculation_method");

-- CreateIndex
CREATE UNIQUE INDEX "product_taxes_product_id_tax_id_key" ON "product_taxes"("product_id", "tax_id");
CREATE INDEX "product_taxes_product_id_idx" ON "product_taxes"("product_id");
CREATE INDEX "product_taxes_tax_id_idx" ON "product_taxes"("tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_taxes_plan_id_tax_id_key" ON "plan_taxes"("plan_id", "tax_id");
CREATE INDEX "plan_taxes_plan_id_idx" ON "plan_taxes"("plan_id");
CREATE INDEX "plan_taxes_tax_id_idx" ON "plan_taxes"("tax_id");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_taxes" ADD CONSTRAINT "product_taxes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_taxes" ADD CONSTRAINT "product_taxes_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_taxes" ADD CONSTRAINT "plan_taxes_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_taxes" ADD CONSTRAINT "plan_taxes_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
