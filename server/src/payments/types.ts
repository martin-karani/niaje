// Types for payments domain

export interface Transaction {
  id: string;
  leaseId: string;
  utilityBillId?: string | null;
  amount: number;
  type: string; // rent, deposit, utility, fee, refund
  category?: string | null; // water, electricity, gas, internet, late_fee, etc.
  status: string; // pending, completed, failed, cancelled
  paymentMethod?: string | null; // cash, bank transfer, card, etc.
  paymentDate: Date;
  dueDate?: Date | null;
  recordedBy?: string | null; // User ID of who recorded payment
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithRelations extends Transaction {
  lease?: {
    id: string;
    unitId: string;
    tenantId: string;
    unit?: {
      name: string;
      property?: {
        id: string;
        name: string;
      };
    };
    tenant?: {
      id: string;
      name: string;
      email: string;
    };
  };
  utilityBill?: {
    id: string;
    utilityType: string;
  };
  recorder?: {
    id: string;
    name: string;
  };
}

export interface UtilityBill {
  id: string;
  leaseId: string;
  utilityType: string; // water, electricity, gas, internet
  billDate: Date;
  dueDate: Date;
  amount: number;
  tenantResponsibilityPercent: number;
  tenantAmount: number;
  landlordAmount: number;
  isPaid: boolean;
  paidDate?: Date | null;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UtilityBillWithRelations extends UtilityBill {
  lease?: {
    id: string;
    unitId: string;
    tenantId: string;
    unit?: {
      name: string;
      property?: {
        id: string;
        name: string;
      };
    };
    tenant?: {
      id: string;
      name: string;
      email: string;
    };
  };
  relatedTransaction?: Transaction;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  outstandingRent: number;
  outstandingUtilities: number;
  revenueByType: {
    type: string;
    amount: number;
  }[];
  revenueByProperty: {
    propertyId: string;
    propertyName: string;
    amount: number;
  }[];
  revenueByMonth: {
    month: string;
    amount: number;
  }[];
}

export interface FinancialReport {
  dateRange: {
    from: Date;
    to: Date;
  };
  summary: FinancialSummary;
  transactions?: TransactionWithRelations[];
  groupedResults?: any; // Depends on groupBy parameter
  generatedBy: string;
  generatedAt: Date;
}
