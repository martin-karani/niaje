// Types for messaging domain

export interface Message {
  id: string;
  propertyId: string | null;
  senderId: string;
  type: string; // "sms" or "email"
  subject: string | null;
  content: string;
  status: string; // "sent", "failed", "pending"
  recipientCount: string;
  metadata: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecipient {
  id: string;
  messageId: string;
  tenantId: string;
  deliveryStatus: string; // "delivered", "failed", "pending"
  errorMessage: string | null;
  deliveredAt: Date | null;
  createdAt: Date;
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: string; // "sms" or "email"
  subject: string | null;
  content: string;
  createdBy: string;
  isGlobal: string;
  propertyId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageWithRecipients extends Message {
  sender?: {
    id: string;
    name: string;
    email: string;
  };
  property?: {
    id: string;
    name: string;
  };
  recipients: MessageRecipient[];
}

export interface TemplateWithUser extends MessageTemplate {
  creator?: {
    id: string;
    name: string;
  };
  property?: {
    id: string;
    name: string;
  };
}

export interface SendMessageResult {
  message: MessageWithRecipients;
  successCount: number;
  failedCount: number;
}

export interface MessageStats {
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  pendingMessages: number;
  messagesByType: {
    type: string;
    count: number;
  }[];
}
