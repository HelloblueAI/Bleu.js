import { Logger } from '../utils/logger';
import { Subscription, SubscriptionPlan, SUBSCRIPTION_PLANS } from '../types/subscription';
import Stripe from 'stripe';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export class SubscriptionService {
  private logger: Logger;
  private stripe: Stripe;
  private initialized: boolean = false;
  private rateLimiter: RateLimiterMemory;

  constructor(logger: Logger) {
    this.logger = logger;
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
    // Rate limit: 100 requests per minute per user
    this.rateLimiter = new RateLimiterMemory({
      points: 100,
      duration: 60
    });
  }

  private async checkRateLimit(userId: string): Promise<void> {
    try {
      await this.rateLimiter.consume(userId);
    } catch (error) {
      this.logger.warn(`Rate limit exceeded for user ${userId}`);
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  async initialize(): Promise<void> {
    try {
      // Validate Stripe configuration
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe secret key not configured');
      }

      this.initialized = true;
      this.logger.info('Subscription service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize subscription service', error);
      throw error;
    }
  }

  async createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<Subscription> {
    if (!this.initialized) {
      throw new Error('Subscription service not initialized');
    }

    try {
      await this.checkRateLimit(userId);
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      // Create Stripe customer if not exists
      const customer = await this.getOrCreateCustomer(userId);

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      });

      // Set as default payment method
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: planId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      });

      // Create subscription record
      const newSubscription: Subscription = {
        id: subscription.id,
        userId,
        planId,
        status: 'pending',
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        autoRenew: subscription.cancel_at_period_end === false,
        paymentMethod: {
          type: 'credit_card',
          last4: subscription.default_payment_method?.card?.last4,
          expiryDate: `${subscription.default_payment_method?.card?.exp_month}/${subscription.default_payment_method?.card?.exp_year}`
        },
        usage: {
          apiCalls: 0,
          models: 0,
          storage: 0,
          lastReset: new Date()
        }
      };

      this.logger.info(`Created subscription for user ${userId}`);
      return newSubscription;
    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
    if (!this.initialized) {
      throw new Error('Subscription service not initialized');
    }

    try {
      await this.checkRateLimit(updates.userId || '');

      // Validate updates
      if (updates.usage) {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.items.data[0].price.id);
        
        if (!plan) {
          throw new Error('Plan not found');
        }

        // Validate usage against plan limits
        if (updates.usage.apiCalls && updates.usage.apiCalls > plan.limits.maxApiCalls) {
          throw new Error(`API calls exceed plan limit of ${plan.limits.maxApiCalls}`);
        }
        if (updates.usage.models && updates.usage.models > plan.limits.maxModels && plan.limits.maxModels !== -1) {
          throw new Error(`Models exceed plan limit of ${plan.limits.maxModels}`);
        }
        if (updates.usage.storage && updates.usage.storage > plan.limits.maxStorage) {
          throw new Error(`Storage exceed plan limit of ${plan.limits.maxStorage}GB`);
        }
      }

      // Update Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: !updates.autoRenew
      });

      // Update subscription record
      const updatedSubscription: Subscription = {
        ...updates,
        id: subscriptionId,
        status: stripeSubscription.status as Subscription['status'],
        endDate: new Date(stripeSubscription.current_period_end * 1000)
      };

      this.logger.info(`Updated subscription ${subscriptionId}`);
      return updatedSubscription;
    } catch (error) {
      this.logger.error('Failed to update subscription', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Subscription service not initialized');
    }

    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      this.logger.info(`Cancelled subscription ${subscriptionId}`);
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw error;
    }
  }

  async trackUsage(subscriptionId: string, usage: Partial<Subscription['usage']>): Promise<void> {
    if (!this.initialized) {
      throw new Error('Subscription service not initialized');
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.items.data[0].price.id);

      if (!plan) {
        throw new Error('Plan not found');
      }

      // Check if usage needs to be reset (monthly reset)
      const currentUsage = await this.stripe.subscriptionItems.listUsageRecordSummaries(
        subscription.items.data[0].id
      );

      const lastReset = new Date(currentUsage.data[0]?.timestamp || 0);
      const now = new Date();
      const monthDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                       (now.getMonth() - lastReset.getMonth());

      if (monthDiff >= 1) {
        // Reset usage for new billing period
        await this.stripe.subscriptionItems.updateUsageRecord(
          subscription.items.data[0].id,
          {
            quantity: 0,
            timestamp: 'now',
            action: 'set'
          }
        );
        this.logger.info(`Reset usage for subscription ${subscriptionId}`);
      }

      // Track API calls
      if (usage.apiCalls) {
        await this.stripe.subscriptionItems.updateUsageRecord(
          subscription.items.data[0].id,
          {
            quantity: usage.apiCalls,
            timestamp: 'now',
            action: 'increment'
          }
        );
      }

      this.logger.info(`Tracked usage for subscription ${subscriptionId}`);
    } catch (error) {
      this.logger.error('Failed to track usage', error);
      throw error;
    }
  }

  async checkApiCallLimit(subscriptionId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Subscription service not initialized');
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.items.data[0].price.id);

      if (!plan) {
        throw new Error('Plan not found');
      }

      const usage = await this.stripe.subscriptionItems.listUsageRecordSummaries(
        subscription.items.data[0].id
      );

      const currentUsage = usage.data[0]?.total_usage || 0;
      return currentUsage < plan.limits.maxApiCalls;
    } catch (error) {
      this.logger.error('Failed to check API call limit', error);
      throw error;
    }
  }

  private async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      // Search for existing customer
      const customers = await this.stripe.customers.list({
        email: userId,
        limit: 1
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Create new customer
      return await this.stripe.customers.create({
        email: userId
      });
    } catch (error) {
      this.logger.error('Failed to get or create customer', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.initialized = false;
      this.logger.info('Subscription service cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup subscription service', error);
      throw error;
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    if (!this.initialized) {
      throw new Error('Subscription service not initialized');
    }

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription;
          this.logger.info(`Subscription ${subscription.id} updated: ${subscription.status}`);
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          this.logger.info(`Subscription ${deletedSubscription.id} deleted`);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          this.logger.info(`Payment succeeded for subscription ${invoice.subscription}`);
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          this.logger.warn(`Payment failed for subscription ${failedInvoice.subscription}`);
          break;

        default:
          this.logger.debug(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Failed to handle webhook', error);
      throw error;
    }
  }
} 