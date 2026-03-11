import { exec } from 'child_process';
import { promisify } from 'util';
import { seedTestData } from './fixtures/seed-data';

const execAsync = promisify(exec);

/**
 * Global setup for Playwright tests
 * Runs before all tests to ensure database is ready and seeded with test data
 */
async function globalSetup() {
  console.log('\n🚀 Starting global test setup...\n');

  try {
    // 1. Ensure database container is running
    console.log('📦 Checking database container...');
    try {
      const { stdout: psOutput } = await execAsync('docker compose ps db');

      if (!psOutput.includes('running')) {
        console.log('🔄 Starting database container...');
        await execAsync('docker compose up db -d');
        console.log('✅ Database container started');

        // Wait for database to be ready
        console.log('⏳ Waiting for database to be ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('✅ Database container already running');
      }
    } catch (error) {
      console.log('🔄 Starting database container...');
      await execAsync('docker compose up db -d');
      console.log('✅ Database container started');

      // Wait for database to be ready
      console.log('⏳ Waiting for database to be ready...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // 2. Push database schema
    console.log('📋 Pushing database schema...');
    try {
      await execAsync('npm run db:push');
      console.log('✅ Database schema pushed');
    } catch (error) {
      console.error('⚠️  Schema push failed, but continuing (may already be up to date)');
    }

    // 3. Seed test data
    console.log('🌱 Seeding test data...');
    await seedTestData();
    console.log('✅ Test data seeded successfully');

    console.log('\n✨ Global setup complete! Running tests...\n');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;
