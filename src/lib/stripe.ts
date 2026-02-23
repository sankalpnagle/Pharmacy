// lib/stripe.ts
import Stripe from "stripe";

// Initialize Stripe only if API key is available
// Stripe is no longer used for new payments - using custom payment page instead
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil",
    })
  : (null as any);
