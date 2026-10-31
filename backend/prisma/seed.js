import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Brightloop Software database seeding...');

  // Ensure dev passwords meet strength rules (>8 chars, uppercase, lowercase, special char)
  const defaultAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'BrightAdmin@2026!';
  const defaultStaffPassword = process.env.SEED_STAFF_PASSWORD || 'BrightStaff@2026!';
  const defaultCustomerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'BrightCustomer@2026!';

  const adminHash = await argon2.hash(defaultAdminPassword, { type: argon2.argon2id });
  const staffHash = await argon2.hash(defaultStaffPassword, { type: argon2.argon2id });
  const customerHash = await argon2.hash(defaultCustomerPassword, { type: argon2.argon2id });

  // 1. Seed Initial Administrator
  const admin = await prisma.user.upsert({
    where: { email: 'admin@brightloopsoftware.com' },
    update: {},
    create: {
      fullName: 'System Administrator',
      email: 'admin@brightloopsoftware.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true
    }
  });
  console.log(`✅ Administrator ready: ${admin.email} (Role: ${admin.role})`);

  // 2. Seed Sample Staff Member
  const staff = await prisma.user.upsert({
    where: { email: 'operations@brightloopsoftware.com' },
    update: {},
    create: {
      fullName: 'Alex Operations',
      email: 'operations@brightloopsoftware.com',
      passwordHash: staffHash,
      role: 'STAFF',
      isActive: true,
      emailVerified: true
    }
  });
  console.log(`✅ Staff member ready: ${staff.email} (Role: ${staff.role})`);

  // 3. Seed Sample Customer with Profile
  const customer = await prisma.user.upsert({
    where: { email: 'customer@acmecorp.com' },
    update: {},
    create: {
      fullName: 'John Enterprise',
      email: 'customer@acmecorp.com',
      passwordHash: customerHash,
      role: 'CUSTOMER',
      isActive: true,
      emailVerified: true,
      customerProfile: {
        create: {
          companyName: 'Acme Corporation Ltd',
          phone: '+91 98765 43210',
          taxId: 'GSTIN27AABCU9603R1ZM',
          billingAddress: {
            street: '104 Tech Park Boulevard',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560100',
            country: 'India'
          },
          shippingAddress: {
            street: '104 Tech Park Boulevard',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560100',
            country: 'India'
          }
        }
      }
    }
  });
  console.log(`✅ Customer ready: ${customer.email} (Role: ${customer.role})`);

  // 4. Seed Standard Taxes
  const standardGst = await prisma.tax.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'GST 18%',
      rate: '18.0000',
      taxType: 'GST',
      calculationMethod: 'EXCLUSIVE',
      applicableTo: 'ALL',
      isActive: true
    }
  });
  console.log(`✅ Tax rule ready: ${standardGst.name} (${standardGst.rate}%)`);

  // 5. Seed Core Products & Variants
  const erpProduct = await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Brightloop ERP Core Suite',
      description: 'Comprehensive enterprise resource planning core software suite',
      productType: 'SOFTWARE',
      salePrice: '1000.00',
      costPrice: '200.00',
      isActive: true,
      variants: {
        create: [
          {
            name: 'Standard Edition',
            description: 'Baseline functionality with standard compute allocation',
            priceAdjustment: '0.00',
            sku: 'BL-ERP-STD',
            isActive: true
          },
          {
            name: 'Premium Edition',
            description: 'Advanced analytics, unlimited automations and prioritized compute',
            priceAdjustment: '560.00',
            sku: 'BL-ERP-PREM',
            isActive: true
          }
        ]
      },
      productTaxes: {
        create: {
          taxId: standardGst.id
        }
      }
    }
  });
  console.log(`✅ Core Product ready: ${erpProduct.name} (Base Price: ₹${erpProduct.salePrice})`);

  // 6. Seed Add-on Product
  const backupProduct = await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Dedicated Cloud Backup Add-on',
      description: 'Automated geo-replicated hourly backup snapshot service',
      productType: 'ADD_ON',
      salePrice: '350.00',
      costPrice: '50.00',
      isActive: true,
      productTaxes: {
        create: {
          taxId: standardGst.id
        }
      }
    }
  });
  console.log(`✅ Add-on Product ready: ${backupProduct.name}`);

  // 7. Seed Subscription Plans
  const monthlyPlan = await prisma.subscriptionPlan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Business Pro Monthly',
      description: 'Standard monthly recurring subscription plan with full operational features',
      price: '2000.00',
      billingInterval: 'MONTHLY',
      billingIntervalCount: 1,
      minimumQuantity: 1,
      autoCloseEnabled: false,
      allowEarlyClose: true,
      allowPause: true,
      allowRenewal: true,
      isActive: true,
      planTaxes: {
        create: {
          taxId: standardGst.id
        }
      }
    }
  });
  console.log(`✅ Monthly Plan ready: ${monthlyPlan.name} (₹${monthlyPlan.price}/month)`);

  const annualPlan = await prisma.subscriptionPlan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Enterprise Annual Saver',
      description: 'Annual recurring subscription plan with 2 months free equivalent discount',
      price: '20000.00',
      billingInterval: 'YEARLY',
      billingIntervalCount: 1,
      minimumQuantity: 1,
      autoCloseEnabled: false,
      allowEarlyClose: true,
      allowPause: true,
      allowRenewal: true,
      isActive: true,
      planTaxes: {
        create: {
          taxId: standardGst.id
        }
      }
    }
  });
  console.log(`✅ Annual Plan ready: ${annualPlan.name} (₹${annualPlan.price}/year)`);

  // 8. Initial Audit Log
  await prisma.systemAuditLog.create({
    data: {
      action: 'SYSTEM_SEEDED',
      entity: 'System',
      actorId: admin.id,
      metadata: {
        admin: admin.email,
        staff: staff.email,
        customer: customer.email,
        products: [erpProduct.name, backupProduct.name],
        plans: [monthlyPlan.name, annualPlan.name],
        timestamp: new Date().toISOString()
      }
    }
  });

  console.log('✨ Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
