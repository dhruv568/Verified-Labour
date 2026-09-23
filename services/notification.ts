import prisma from '@/lib/db';

export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'SUCCESS'
  | 'JOB'
  | 'VERIFICATION'
  | 'PAYMENT';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  linkUrl?: string;
}

export class NotificationService {
  /**
   * Creates an in-app notification and logs dispatch
   */
  static async send(params: CreateNotificationParams) {
    const { userId, title, message, type, linkUrl } = params;

    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          linkUrl,
          isRead: false,
        },
      });

      // In production, integrate Webhook / SMS provider / WhatsApp here
      return notification;
    } catch (err) {
      console.error('Failed to create notification:', err);
      return null;
    }
  }

  /**
   * Helper for job-related notifications to both parties
   */
  static async notifyJobEvent(event: {
    customerId: string;
    workerId: string;
    jobId: string;
    eventType: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'ON_THE_WAY' | 'ARRIVED' | 'COMPLETED' | 'PAID';
    serviceName: string;
  }) {
    const { customerId, workerId, jobId, eventType, serviceName } = event;

    switch (eventType) {
      case 'REQUESTED':
        await this.send({
          userId: workerId,
          title: 'New Job Request Received',
          message: `You have a new request for ${serviceName}. Please review and accept.`,
          type: 'JOB',
          linkUrl: `/worker/jobs/${jobId}`,
        });
        break;

      case 'ACCEPTED':
        await this.send({
          userId: customerId,
          title: 'Job Request Accepted!',
          message: `The worker has accepted your request for ${serviceName}.`,
          type: 'SUCCESS',
          linkUrl: `/customer/jobs/${jobId}`,
        });
        break;

      case 'REJECTED':
        await this.send({
          userId: customerId,
          title: 'Worker Unavailable',
          message: `The worker could not take this request for ${serviceName}. You can search for other verified workers nearby.`,
          type: 'WARNING',
          linkUrl: `/search?category=${encodeURIComponent(serviceName)}`,
        });
        break;

      case 'ON_THE_WAY':
        await this.send({
          userId: customerId,
          title: 'Worker is On The Way',
          message: `Your professional has departed and is on the way to your location.`,
          type: 'JOB',
          linkUrl: `/customer/jobs/${jobId}`,
        });
        break;

      case 'ARRIVED':
        await this.send({
          userId: customerId,
          title: 'Worker Has Arrived',
          message: `Your professional has reached your address.`,
          type: 'JOB',
          linkUrl: `/customer/jobs/${jobId}`,
        });
        break;

      case 'COMPLETED':
        await this.send({
          userId: customerId,
          title: 'Work Completed — Please Complete Payment',
          message: `Work for ${serviceName} is marked complete. Please verify and pay securely.`,
          type: 'PAYMENT',
          linkUrl: `/customer/jobs/${jobId}`,
        });
        break;

      case 'PAID':
        await this.send({
          userId: workerId,
          title: 'Payment Received!',
          message: `Payment for ${serviceName} has been captured and added to your earnings balance.`,
          type: 'SUCCESS',
          linkUrl: `/worker/earnings`,
        });
        break;
    }
  }
}

export default NotificationService;
