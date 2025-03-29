#!/usr/bin/env node

import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger } from '../utils/logger';

const execAsync = promisify(exec);
const logger = createLogger();

const program = new Command();

program
  .name('connect-ec2')
  .description('Connect to an EC2 instance using AWS SSO')
  .version('1.0.0')
  .requiredOption('-i, --instance-id <instanceId>', 'EC2 instance ID')
  .option('-p, --profile <profile>', 'AWS SSO profile name', 'Bleujs-SSO')
  .option('-r, --region <region>', 'AWS region', 'us-west-2')
  .option('-d, --debug', 'Enable debug logging', false);

program.parse();

const options = program.opts();

async function connectToEC2() {
  try {
    // Check if AWS CLI is installed
    await execAsync('aws --version');
    
    // Check if SSO is logged in
    try {
      await execAsync(`aws sts get-caller-identity --profile ${options.profile}`);
    } catch (error) {
      logger.info('SSO session expired. Logging in...');
      await execAsync(`aws sso login --profile ${options.profile}`);
    }

    // Connect to EC2 instance using SSM
    logger.info(`Connecting to EC2 instance ${options.instanceId}...`);
    await execAsync(`aws ssm start-session --target ${options.instanceId} --profile ${options.profile} --region ${options.region}`);
    
    logger.info('Successfully connected to EC2 instance');
  } catch (error) {
    logger.error('Failed to connect to EC2 instance:', error);
    process.exit(1);
  }
}

connectToEC2(); 