#!/usr/bin/env node

// postinstall 스크립트: DATABASE_URL이 없어도 prisma generate 실행
process.env.DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgres://dummy:dummy@localhost:5432/dummy';

import { execSync } from 'child_process';

try {
  console.log('Running prisma generate...');
  execSync('prisma generate', { stdio: 'inherit' });
  console.log('✅ prisma generate completed');
} catch (error) {
  console.warn('⚠️ prisma generate failed, but continuing...');
  console.warn('   This is normal if DATABASE_URL is not set.');
  console.warn('   You can run "prisma generate" manually after setting up your database.');
  process.exit(0); // 오류가 있어도 계속 진행
}

