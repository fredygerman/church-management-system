import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../../../../packages/db';
import config from '../config';
import { Logger } from '@nestjs/common';

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

    // Create super admin user
    const adminUser = await db
      .insert(schema.users)
      .values({
        email: 'admin@church.org',
        name: 'System Administrator',
        role: 'super_admin',
      })
      .returning();

    logger.log(`✅ Created super admin user: ${adminUser[0].email}`);

    // Create a sample admin (IT admin) user
    const itAdminUser = await db
      .insert(schema.users)
      .values({
        email: 'itadmin@church.org',
        name: 'IT Administrator',
        role: 'admin',
      })
      .returning();

    logger.log(`✅ Created admin (IT) user: ${itAdminUser[0].email}`);

    // Create a sample branch admin user
    const branchAdminUser = await db
      .insert(schema.users)
      .values({
        email: 'branch@church.org',
        name: 'Branch Administrator',
        role: 'branch_admin',
      })
      .returning();

    logger.log(`✅ Created branch admin user: ${branchAdminUser[0].email}`);

    // Create a sample zone leader user
    const zoneLeaderUser = await db
      .insert(schema.users)
      .values({
        email: 'zoneleader@church.org',
        name: 'Zone Leader',
        role: 'zone_leader',
      })
      .returning();

    logger.log(`✅ Created zone leader user: ${zoneLeaderUser[0].email}`);

    // Create a sample member user
    const memberUser = await db
      .insert(schema.users)
      .values({
        email: 'member@church.org',
        name: 'Regular Member',
        role: 'member',
      })
      .returning();

    logger.log(`✅ Created member user: ${memberUser[0].email}`);

    logger.log('🎉 Database seeding completed successfully!');
    logger.log('\n📋 Default Users Created:');
    logger.log('👤 Super Admin: admin@church.org');
    logger.log('👤 IT Admin: itadmin@church.org');
    logger.log('👤 Branch Admin: branch@church.org');
    logger.log('👤 Zone Leader: zoneleader@church.org');
    logger.log('👤 Member: member@church.org');
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
