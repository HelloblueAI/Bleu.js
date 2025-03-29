export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxApiCalls: number;
    maxModels: number;
    maxStorage: number;
    maxConcurrentJobs: number;
    customTraining: boolean;
    prioritySupport: boolean;
    sla: number;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod: {
    type: 'credit_card' | 'bank_transfer';
    last4?: string;
    expiryDate?: string;
  };
  usage: {
    apiCalls: number;
    models: number;
    storage: number;
    lastReset: Date;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    billingPeriod: 'monthly',
    features: [
      '100 API calls/month',
      'Core AI model access',
      'REST API endpoints',
      'Basic documentation',
      'Community support',
      'Standard response time',
      '99.9% uptime'
    ],
    limits: {
      maxApiCalls: 100,
      maxModels: 1,
      maxStorage: 10,
      maxConcurrentJobs: 5,
      customTraining: false,
      prioritySupport: false,
      sla: 99.9
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    billingPeriod: 'monthly',
    features: [
      '5000 API calls/month',
      'Advanced AI models access',
      'Priority API endpoints',
      'Advanced documentation',
      'Dedicated support team',
      '24/7 priority support',
      '99.99% uptime SLA',
      'Custom model training',
      'API rate limit increase'
    ],
    limits: {
      maxApiCalls: 5000,
      maxModels: -1, // unlimited
      maxStorage: 1000,
      maxConcurrentJobs: 100,
      customTraining: true,
      prioritySupport: true,
      sla: 99.99
    }
  }
]; 