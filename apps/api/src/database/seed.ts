import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema/index';
import config from '../config';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const logger = new Logger('Seed');

async function seed() {
  let client: Client | null = null;

  try {
    logger.log('🌱 Starting database seeding...');

    if (!config.databaseURL) {
      throw new Error('Database URL not configured');
    }

    // Create database connection
    client = new Client({
      connectionString: config.databaseURL,
    });

    await client.connect();
    const db = drizzle(client, { schema });

    logger.log('Connected to database for seeding');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await db
      .insert(schema.users)
      .values({
        email: 'admin@church.org',
        firstName: 'System',
        lastName: 'Administrator',
        password: adminPassword,
        isActive: true,
      })
      .returning();

    logger.log(`✅ Created admin user: ${adminUser[0].email}`);

    // Create a sample manager user
    const managerPassword = await bcrypt.hash('manager123', 10);

    const managerUser = await db
      .insert(schema.users)
      .values({
        email: 'manager@church.org',
        firstName: 'John',
        lastName: 'Doe',
        password: managerPassword,
        isActive: true,
      })
      .returning();

    logger.log(`✅ Created manager user: ${managerUser[0].email}`);

    // Create a sample driver user
    const driverPassword = await bcrypt.hash('driver123', 10);

    const driverUser = await db
      .insert(schema.users)
      .values({
        email: 'driver@church.org',
        firstName: 'Michael',
        lastName: 'Johnson',
        password: driverPassword,
        isActive: true,
      })
      .returning();

    logger.log(`✅ Created driver user: ${driverUser[0].email}`);

    // Create sample customer
    const customerPassword = await bcrypt.hash('customer123', 10);

    const customerUser = await db
      .insert(schema.users)
      .values({
        email: 'customer@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: customerPassword,
        isActive: true,
      })
      .returning();

    logger.log(`✅ Created customer user: ${customerUser[0].email}`);

    // Create test user
    const testPassword = await bcrypt.hash('test123', 10);

    const testUser = await db
      .insert(schema.users)
      .values({
        email: 'test@church.org',
        firstName: 'Test',
        lastName: 'User',
        password: testPassword,
        isActive: true,
      })
      .returning();

    logger.log(`✅ Created test user: ${testUser[0].email}`);

    logger.log('🎉 Database seeding completed successfully!');
    logger.log('\n📋 Default Users Created:');
    logger.log('👤 Admin: admin@church.org / admin123');
    logger.log('👤 Manager: manager@church.org / manager123');
    logger.log('👤 Driver: driver@church.org / driver123');
    logger.log('👤 Customer: customer@example.com / customer123');
    logger.log('👤 Test: test@church.org / test123');
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch(error => {
    logger.error(error);
    process.exit(1);
  });
