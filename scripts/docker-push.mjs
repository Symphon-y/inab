#!/usr/bin/env node
import { execSync } from 'child_process';

const IMAGE_NAME = 'travisredden/inab';

function exec(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

console.log('🚀 Starting Docker build and push...\n');

// Build Docker image with 'latest' tag
console.log(`🔨 Building Docker image ${IMAGE_NAME}:latest`);
exec(`docker build -t ${IMAGE_NAME}:latest -f Dockerfile .`);
console.log('✅ Build complete\n');

// Push to Docker Hub
console.log(`📤 Pushing ${IMAGE_NAME}:latest to Docker Hub`);
exec(`docker push ${IMAGE_NAME}:latest`);
console.log('✅ Pushed successfully\n');

console.log('✅ Release complete! Latest version is now live.');
console.log('\n📝 Deploy to production with:');
console.log('   ssh your-server');
console.log('   cd /path/to/inab');
console.log('   docker compose -f docker-compose.production.yml pull');
console.log('   docker compose -f docker-compose.production.yml up -d');
