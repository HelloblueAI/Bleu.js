//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import { Egg } from '../types/egg';
import { EventEmitter } from 'events';

interface Event {
  id: string;
  type: EventType;
  userId: string;
  timestamp: Date;
  data: any;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
}

type EventType =
  | 'egg_generated'
  | 'egg_evolved'
  | 'egg_hatched'
  | 'egg_traded'
  | 'achievement_unlocked'
  | 'market_listing'
  | 'special_event'
  | 'system_notification';

interface Notification {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  isRead: boolean;
  action?: {
    type: string;
    data: any;
  };
}

interface EventSubscription {
  userId: string;
  eventTypes: EventType[];
  channels: NotificationChannel[];
  filters?: {
    priority?: ('low' | 'medium' | 'high')[];
    rarity?: string[];
    element?: string[];
  };
}

type NotificationChannel = 'in_app' | 'email' | 'push' | 'webhook';

export class EggEventService extends EventEmitter {
  private events: Map<string, Event>;
  private notifications: Map<string, Notification>;
  private subscriptions: Map<string, EventSubscription>;
  private readonly EVENT_RETENTION_DAYS = 30;

  constructor() {
    super();
    this.events = new Map();
    this.notifications = new Map();
    this.subscriptions = new Map();
  }

  public async createEvent(
    type: EventType,
    userId: string,
    data: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<Event> {
    const event: Event = {
      id: `event_${Date.now()}`,
      type,
      userId,
      timestamp: new Date(),
      data,
      priority,
      isRead: false
    };

    this.events.set(event.id, event);
    await this.processEvent(event);
    return event;
  }

  private async processEvent(event: Event): Promise<void> {
    // Create notifications for subscribed users
    const subscribers = this.getSubscribersForEvent(event);
    for (const subscriber of subscribers) {
      await this.createNotification(event, subscriber);
    }

    // Emit event for internal processing
    this.emit('eventProcessed', { event });

    // Schedule event cleanup
    this.scheduleEventCleanup(event);
  }

  private getSubscribersForEvent(event: Event): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(subscription =>
      this.matchesSubscription(subscription, event)
    );
  }

  private matchesSubscription(subscription: EventSubscription, event: Event): boolean {
    // Check event type
    if (!subscription.eventTypes.includes(event.type)) {
      return false;
    }

    // Check priority filter
    if (subscription.filters?.priority && !subscription.filters.priority.includes(event.priority)) {
      return false;
    }

    // Check rarity filter for egg-related events
    if (subscription.filters?.rarity && event.data?.egg) {
      const egg = event.data.egg as Egg;
      if (!subscription.filters.rarity.includes(egg.rarity)) {
        return false;
      }
    }

    // Check element filter for egg-related events
    if (subscription.filters?.element && event.data?.egg) {
      const egg = event.data.egg as Egg;
      if (!subscription.filters.element.includes(egg.element)) {
        return false;
      }
    }

    return true;
  }

  private async createNotification(event: Event, subscription: EventSubscription): Promise<void> {
    const notification: Notification = {
      id: `notification_${Date.now()}`,
      eventId: event.id,
      userId: subscription.userId,
      title: this.generateNotificationTitle(event),
      message: this.generateNotificationMessage(event),
      type: this.determineNotificationType(event),
      timestamp: new Date(),
      isRead: false,
      action: this.generateNotificationAction(event)
    };

    this.notifications.set(notification.id, notification);

    // Send notification through subscribed channels
    await this.sendNotification(notification, subscription.channels);

    this.emit('notificationCreated', { notification });
  }

  private generateNotificationTitle(event: Event): string {
    const titles: Record<EventType, string> = {
      egg_generated: 'New Egg Generated!',
      egg_evolved: 'Egg Evolution Success!',
      egg_hatched: 'Egg Hatched!',
      egg_traded: 'Egg Trade Completed',
      achievement_unlocked: 'Achievement Unlocked!',
      market_listing: 'New Market Listing',
      special_event: 'Special Event',
      system_notification: 'System Notification'
    };

    return titles[event.type];
  }

  private generateNotificationMessage(event: Event): string {
    switch (event.type) {
      case 'egg_generated':
        return `Congratulations! You've generated a new ${event.data.egg.rarity} egg!`;
      case 'egg_evolved':
        return `Your egg has evolved to ${event.data.egg.rarity} rarity!`;
      case 'egg_hatched':
        return 'Your egg has hatched into a magnificent creature!';
      case 'egg_traded':
        return `Successfully traded egg for ${event.data.price} ${event.data.currency}`;
      case 'achievement_unlocked':
        return `You've unlocked the "${event.data.achievement.name}" achievement!`;
      case 'market_listing':
        return `Your egg has been listed on the marketplace for ${event.data.price} ${event.data.currency}`;
      case 'special_event':
        return event.data.message;
      case 'system_notification':
        return event.data.message;
    }
  }

  private determineNotificationType(event: Event): Notification['type'] {
    switch (event.type) {
      case 'achievement_unlocked':
        return 'success';
      case 'system_notification':
        return 'warning';
      case 'egg_evolved':
      case 'egg_hatched':
        return 'success';
      case 'egg_traded':
      case 'market_listing':
        return 'info';
      default:
        return 'info';
    }
  }

  private generateNotificationAction(event: Event): Notification['action'] {
    switch (event.type) {
      case 'egg_generated':
      case 'egg_evolved':
      case 'egg_hatched':
        return {
          type: 'view_egg',
          data: { eggId: event.data.egg.id }
        };
      case 'market_listing':
        return {
          type: 'view_listing',
          data: { listingId: event.data.listingId }
        };
      case 'achievement_unlocked':
        return {
          type: 'view_achievement',
          data: { achievementId: event.data.achievement.id }
        };
      default:
        return undefined;
    }
  }

  private async sendNotification(notification: Notification, channels: NotificationChannel[]): Promise<void> {
    for (const channel of channels) {
      switch (channel) {
        case 'in_app':
          // Handle in-app notification
          break;
        case 'email':
          await this.sendEmailNotification(notification);
          break;
        case 'push':
          await this.sendPushNotification(notification);
          break;
        case 'webhook':
          await this.sendWebhookNotification(notification);
          break;
      }
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    // Implement email sending logic
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // Implement push notification logic
  }

  private async sendWebhookNotification(notification: Notification): Promise<void> {
    // Implement webhook notification logic
  }

  private scheduleEventCleanup(event: Event): void {
    setTimeout(() => {
      this.events.delete(event.id);
    }, this.EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  }

  public async subscribeToEvents(subscription: EventSubscription): Promise<void> {
    this.subscriptions.set(subscription.userId, subscription);
    this.emit('subscriptionCreated', { subscription });
  }

  public async unsubscribeFromEvents(userId: string): Promise<void> {
    this.subscriptions.delete(userId);
    this.emit('subscriptionRemoved', { userId });
  }

  public async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead);
  }

  public async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      this.emit('notificationRead', { notification });
    }
  }

  public async getEventHistory(userId: string): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async getEventStats(userId: string): Promise<{
    totalEvents: number;
    unreadEvents: number;
    eventTypes: Record<EventType, number>;
  }> {
    const userEvents = Array.from(this.events.values())
      .filter(event => event.userId === userId);

    const eventTypes = userEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<EventType, number>);

    return {
      totalEvents: userEvents.length,
      unreadEvents: userEvents.filter(event => !event.isRead).length,
      eventTypes
    };
  }
} 