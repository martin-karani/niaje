// Types for leases domain

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  depositAmount: number;
  status: string; // active, expired, terminated
  paymentDay: number;
  paymentFrequency: string; // monthly, weekly, etc.
  includesWater: boolean;
  includesElectricity: boolean;
  includesGas: boolean;
  includesInternet: boolean;
  waterBillingType: string;
  electricityBillingType: string;
  gasBillingType: string;
  internetBillingType: string;
  waterFixedAmount: number | null;
  electricityFixedAmount: number | null;
  gasFixedAmount: number | null;
  internetFixedAmount: number | null;
  createdBy: string | null;
  documentUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaseWithRelations extends Lease {
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  unit?: {
    id: string;
    name: string;
    type: string;
    property?: {
      id: string;
      name: string;
      address: string;
    };
  };
  creator?: {
    id: string;
    name: string;
  };
  transactions?: {
    id: string;
    amount: number;
    type: string;
    status: string;
    paymentDate: Date;
    dueDate: Date | null;
  }[];
  utilityBills?: {
    id: string;
    utilityType: string;
    amount: number;
    dueDate: Date;
    isPaid: boolean;
  }[];
}

export interface LeaseSummary {
  id: string;
  tenantName: string;
  unitName: string;
  propertyName: string;
  rentAmount: number;
  startDate: Date;
  endDate: Date;
  status: string;
}

export interface LeaseStats {
  totalLeases: number;
  activeLeases: number;
  expiringNext30Days: number;
  leasesByStatus: {
    status: string;
    count: number;
  }[];
  averageRent: number;
  totalMonthlyRent: number;
}

export interface LeaseRenewalTemplate {
  id: string;
  name: string;
  renewalTerm: number; // In months
  rentIncrease: number; // Percentage
  automatedReminders: boolean;
  reminderDays: number[];
  content: string;
}
