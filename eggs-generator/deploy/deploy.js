import { exec } from 'child_process';
import { promisify } from 'util';

const execute = promisify(exec);

async function deploy() {
  try {
    await execute('./scripts/mongodb.sh backup');
    await execute('git pull origin main');
    await execute('pnpm install');
    await execute('pnpm build');
    await execute('./scripts/mongodb.sh restart');
    await execute('pm2 reload all');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy();
