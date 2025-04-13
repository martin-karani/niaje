// Types for notifications domain

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string; // payment_due, payment_received, maintenance, lease, utility_bill, system
  relatedId?: string | null; // ID of related entity
  relatedType?: string | null; // Type of related entity
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationWithUser extends Notification {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyPaymentDue: boolean;
  notifyPaymentReceived: boolean;
  notifyMaintenance: boolean;
  notifyLease: boolean;
  notifyUtilityBill: boolean;
  notifySystem: boolean;
}

export interface NotificationSummary {
  totalUnread: number;
  byType: {
    type: string;
    count: number;
  }[];
}
