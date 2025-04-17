// src/domains/billing/services/payment-gateway.service.ts
import { SUBSCRIPTION_PLANS } from "@shared/constants/subscription-plans";
import axios from "axios";

/**
 * Payment Gateway Service
 * Handles communication with payment providers (Kora)
 */
export class PaymentGatewayService {
  private koraAPI;

  constructor() {
    // Create an axios instance for Kora
    this.koraAPI = axios.create({
      baseURL: "https://api.korapay.com/merchant/api/v1",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
      },
    });
  }

  /**
   * Create a card payment link using Kora Checkout Redirect
   */
  async createCardPaymentLink(
    customerId: string,
    planId: keyof typeof SUBSCRIPTION_PLANS,
    billingInterval: "month" | "year",
    organizationId: string,
    customerEmail: string,
    customerName: string
  ) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) throw new Error("Invalid plan");

    const amount =
      billingInterval === "month" ? plan.monthlyPrice : plan.yearlyPrice;

    // Generate a unique reference for the transaction
    const tx_ref = `sub_${organizationId}_${Date.now()}`;

    // Prepare the payload according to Kora's initialize charge endpoint
    const payload = {
      reference: tx_ref,
      amount,
      currency: "KES", // Adjust currency if needed
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
      // Kora supports meta fields to pass additional data
      meta: {
        organizationId,
        planId,
        billingInterval,
        customerId,
      },
      // Specify payment options if needed, e.g., ["card"]
      channels: ["card"],
    };

    // Call Kora's initialize charge endpoint
    const response = await this.koraAPI.post("/charges/initialize", payload);

    // Expect that a successful response includes a checkout_url
    if (response.data.status === true) {
      return { url: response.data.data.checkout_url };
    } else {
      throw new Error("Failed to create payment link");
    }
  }

  /**
   * Create an Mpesa payment request using Kora's Mobile Money charge endpoint
   */
  async createMpesaPayment(
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
    const tx_ref = `sub_mpesa_${organizationId}_${Date.now()}`;

    // Prepare payload for mobile money charge
    const payload = {
      reference: tx_ref,
      amount,
      currency: "KES", // KES for Mpesa
      // Specify mobile money details in a dedicated object
      mobile_money: {
        number: phoneNumber,
      },
      // Optionally include a redirect URL if you want the customer to be redirected
      redirect_url: `${process.env.FRONTEND_URL}/organization/billing/success`,
      customer: {
        email: customerEmail,
        name: customerName,
      },
      meta: {
        organizationId,
        planId,
        billingInterval,
      },
      // Specify the channel for mobile money payments (if required by your integration)
      channels: ["mobile_money"],
    };

    // Send request to Kora's mobile money charge endpoint
    const response = await this.koraAPI.post("/charges/mobile-money", payload);

    if (response.data.status === true) {
      return {
        transactionId: response.data.data.transaction_reference,
        koraRef: response.data.data.reference, // or another field that uniquely identifies the transaction
        status: "pending",
        message: "Please check your phone to complete the payment",
      };
    } else {
      throw new Error(
        response.data.message || "Failed to initiate Mpesa payment"
      );
    }
  }

  /**
   * Verify a transaction using Kora's verify charge endpoint
   */
  async verifyTransaction(transactionReference: string) {
    // Kora's API uses GET /charges/:reference to verify a transaction
    const response = await this.koraAPI.get(`/charges/${transactionReference}`);

    if (response.data.status === true) {
      return {
        status: response.data.data.status,
        amount: response.data.data.amount,
        currency: response.data.data.currency,
        customerId: response.data.data.customer?.id,
        meta: response.data.data.meta,
      };
    } else {
      throw new Error("Failed to verify transaction");
    }
  }

  /**
   * Create a customer ID (used to be Stripe, now internal)
   */
  async createCustomerId(
    email: string,
    name: string,
    metadata: Record<string, any>
  ) {
    // As a placeholder, generate an internal customer ID.
    return { id: `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
  }
}

// Export singleton instance
export const paymentGatewayService = new PaymentGatewayService();
