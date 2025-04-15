// src/lib/payment.ts
import Flutterwave from "flutterwave-node-v3";
import { SUBSCRIPTION_PLANS } from "../subscription/constants";

// Initialize Flutterwave
const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

/**
 * Create a card payment link
 */
export async function createCardPaymentLink(
  customerId: string,
  planId: string,
  billingInterval: "month" | "year",
  organizationId: string,
  customerEmail: string,
  customerName: string
) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new Error("Invalid plan");

  const amount =
    billingInterval === "month" ? plan.monthlyPrice : plan.yearlyPrice;

  const payload = {
    tx_ref: `sub_${organizationId}_${Date.now()}`,
    amount,
    currency: "KES", // Or your preferred currency
    payment_options: "card",
    redirect_url: `${process.env.FRONTEND_URL}/organization/billing/success`,
    customer: {
      email: customerEmail,
      name: customerName,
    },
    customizations: {
      title: `${plan.name} Plan Subscription`,
      description: `${billingInterval}ly subscription to ${plan.name} plan`,
      logo: process.env.COMPANY_LOGO_URL,
    },
    meta: {
      organizationId,
      planId,
      billingInterval,
      customerId,
    },
  };

  const response = await flw.Charge.create(payload);

  if (response.status === "success") {
    return { url: response.data.link };
  } else {
    throw new Error("Failed to create payment link");
  }
}

/**
 * Create an Mpesa payment request
 */
export async function createMpesaPayment(
  planId: string,
  billingInterval: "month" | "year",
  organizationId: string,
  customerEmail: string,
  customerName: string,
  phoneNumber: string
) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new Error("Invalid plan");

  const amount =
    billingInterval === "month" ? plan.monthlyPrice : plan.yearlyPrice;

  const payload = {
    tx_ref: `sub_mpesa_${organizationId}_${Date.now()}`,
    amount,
    currency: "KES",
    payment_type: "mpesa",
    country: "KE",
    email: customerEmail,
    phone_number: phoneNumber,
    fullname: customerName,
    narration: `${plan.name} Plan Subscription`,
    meta: {
      organizationId,
      planId,
      billingInterval,
    },
  };

  const response = await flw.MobileMoney.mpesa(payload);

  if (response.status === "success") {
    return {
      transactionId: response.data.id,
      flwRef: response.data.flw_ref,
      status: "pending",
      message: "Please check your phone to complete the payment",
    };
  } else {
    throw new Error(response.message || "Failed to initiate Mpesa payment");
  }
}

/**
 * Verify a transaction
 */
export async function verifyTransaction(transactionId: string) {
  const response = await flw.Transaction.verify({ id: transactionId });

  if (response.status === "success") {
    return {
      status: response.data.status,
      amount: response.data.amount,
      currency: response.data.currency,
      customerId: response.data.customer.id,
      meta: response.data.meta,
    };
  } else {
    throw new Error("Failed to verify transaction");
  }
}

/**
 * Create Stripe customer for backward compatibility if needed
 */
export async function createStripeCustomer(
  email: string,
  name: string,
  metadata: any
) {
  // This is a placeholder that maps to Flutterwave's customer API if needed
  // For now, we'll just generate an ID that we'll use internally
  return { id: `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
}
