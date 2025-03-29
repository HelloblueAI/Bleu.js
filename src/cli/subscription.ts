#!/usr/bin/env node

import { Command } from 'commander';
import { createLogger } from '../utils/logger';
import { SubscriptionService } from '../services/subscriptionService';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import inquirer from 'inquirer';

const logger = createLogger();
const program = new Command();

program
  .name('bleu-subscription')
  .description('Manage Bleu.js subscriptions')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new subscription')
  .requiredOption('-u, --user <email>', 'User email')
  .action(async (options) => {
    try {
      const service = new SubscriptionService(logger);
      await service.initialize();

      // Show available plans
      console.log('\nAvailable Plans:');
      SUBSCRIPTION_PLANS.forEach(plan => {
        console.log(`\n${plan.name} (${plan.price}$/${plan.billingPeriod}):`);
        plan.features.forEach(feature => console.log(`- ${feature}`));
      });

      // Get plan selection
      const { planId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'planId',
          message: 'Select a plan:',
          choices: SUBSCRIPTION_PLANS.map(plan => ({
            name: `${plan.name} (${plan.price}$/${plan.billingPeriod})`,
            value: plan.id
          }))
        }
      ]);

      // Get payment method
      const { paymentMethodId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'paymentMethodId',
          message: 'Enter Stripe payment method ID:',
          validate: input => input.length > 0
        }
      ]);

      const subscription = await service.createSubscription(
        options.user,
        planId,
        paymentMethodId
      );

      console.log('\nSubscription created successfully:');
      console.log(`ID: ${subscription.id}`);
      console.log(`Plan: ${subscription.planId}`);
      console.log(`Status: ${subscription.status}`);
      console.log(`Start Date: ${subscription.startDate}`);
      console.log(`End Date: ${subscription.endDate}`);
    } catch (error) {
      console.error('Failed to create subscription:', error);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Update an existing subscription')
  .requiredOption('-i, --id <subscriptionId>', 'Subscription ID')
  .option('-a, --auto-renew <boolean>', 'Auto-renew subscription')
  .action(async (options) => {
    try {
      const service = new SubscriptionService(logger);
      await service.initialize();

      const updates: any = {};
      if (options.autoRenew !== undefined) {
        updates.autoRenew = options.autoRenew === 'true';
      }

      const subscription = await service.updateSubscription(options.id, updates);
      console.log('\nSubscription updated successfully:');
      console.log(`ID: ${subscription.id}`);
      console.log(`Status: ${subscription.status}`);
      console.log(`Auto-renew: ${subscription.autoRenew}`);
    } catch (error) {
      console.error('Failed to update subscription:', error);
      process.exit(1);
    }
  });

program
  .command('cancel')
  .description('Cancel a subscription')
  .requiredOption('-i, --id <subscriptionId>', 'Subscription ID')
  .action(async (options) => {
    try {
      const service = new SubscriptionService(logger);
      await service.initialize();

      await service.cancelSubscription(options.id);
      console.log('\nSubscription cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      process.exit(1);
    }
  });

program
  .command('track-usage')
  .description('Track subscription usage')
  .requiredOption('-i, --id <subscriptionId>', 'Subscription ID')
  .option('-a, --api-calls <number>', 'Number of API calls')
  .option('-m, --models <number>', 'Number of models')
  .option('-s, --storage <number>', 'Storage used (GB)')
  .action(async (options) => {
    try {
      const service = new SubscriptionService(logger);
      await service.initialize();

      const usage: any = {};
      if (options.apiCalls) usage.apiCalls = parseInt(options.apiCalls);
      if (options.models) usage.models = parseInt(options.models);
      if (options.storage) usage.storage = parseFloat(options.storage);

      await service.trackUsage(options.id, usage);
      console.log('\nUsage tracked successfully');
    } catch (error) {
      console.error('Failed to track usage:', error);
      process.exit(1);
    }
  });

program
  .command('check-limit')
  .description('Check API call limit')
  .requiredOption('-i, --id <subscriptionId>', 'Subscription ID')
  .action(async (options) => {
    try {
      const service = new SubscriptionService(logger);
      await service.initialize();

      const hasAvailableCalls = await service.checkApiCallLimit(options.id);
      console.log('\nAPI Call Limit Status:');
      console.log(`Has available calls: ${hasAvailableCalls}`);
    } catch (error) {
      console.error('Failed to check API call limit:', error);
      process.exit(1);
    }
  });

program.parse(); 