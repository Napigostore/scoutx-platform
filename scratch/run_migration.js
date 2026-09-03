
const fs = require('fs');
const { execSync } = require('child_process');

let envFile = '';
if (fs.existsSync('apps/web/.env.prod')) envFile = fs.readFileSync('apps/web/.env.prod', 'utf8');
else if (fs.existsSync('apps/web/.env.local')) envFile = fs.readFileSync('apps/web/.env.local', 'utf8');
else envFile = fs.readFileSync('apps/web/.env', 'utf8');

const dbUrlMatch = envFile.match(/DATABASE_URL=[\"']?([^\"'\n]+)[\"']?/);
if (dbUrlMatch) {
  const dbUrl = dbUrlMatch[1];
  console.log('Found DATABASE_URL, running migration...');
  execSync('npx prisma migrate deploy', { 
    cwd: 'apps/web', 
    stdio: 'inherit',
    env: Object.assign({}, process.env, { DATABASE_URL: dbUrl })
  });
} else {
  console.error('DATABASE_URL not found');
}

