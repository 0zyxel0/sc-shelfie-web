// server/api/paymongo/verify-payment.post.ts

import { createError, defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
  // We only need the checkoutSessionId from the client now.
  // The userId will be confirmed against the session's metadata.
  const { checkoutSessionId } = await readBody(event);
  const config = useRuntimeConfig();
  const paymongoSecretKey = config.paymongoSecretKey;

  // Basic validation and config checks
  if (!checkoutSessionId) {
    throw createError({ statusCode: 400, statusMessage: "Checkout Session ID is required." });
  }
  if (!paymongoSecretKey) {
    throw createError({ statusCode: 500, statusMessage: "Server configuration error." });
  }

  const base64ApiKey = Buffer.from(paymongoSecretKey).toString("base64");
  const paymongoHeaders = {
    Accept: "application/json",
    Authorization: `Basic ${base64ApiKey}`,
  };

  try {
    // --- Step 1: Retrieve the Checkout Session from PayMongo ---
    const { data: checkoutSession } = await $fetch<{ data: any }>(`https://api.paymongo.com/v1/checkout_sessions/${checkoutSessionId}`, {
      headers: paymongoHeaders,
    });

    // --- Step 2: Extract and Verify Payment Details ---
    const paymentStatus = checkoutSession?.attributes?.payment_intent?.attributes?.status;
    const metadata = checkoutSession?.attributes?.metadata;

    // The subscription is usually created and attached to the checkout session for recurring payments
    const providerSubscriptionId = checkoutSession?.attributes?.subscription_id;

    // Extract crucial metadata stored during checkout creation
    const paidUserId = metadata?.strapiUserId;
    const plan = metadata?.plan; // 'monthly' or 'annually'

    // --- Step 3: Validate the data ---
    if (!paidUserId || !plan) {
      throw createError({ statusCode: 400, statusMessage: "Payment session is missing required metadata (user ID or plan)." });
    }

    if (paymentStatus === "succeeded") {
      console.log(`BFF - Payment verified for user ID: ${paidUserId} for plan: ${plan}.`);

      // --- Step 4: Return all necessary data to the frontend ---
      return {
        success: true,
        message: "Payment verified successfully.",
        plan: plan,
        providerSubscriptionId: providerSubscriptionId || null, // Send the subscription ID if it exists
      };
    } else {
      // The payment was not successful (e.g., pending, failed).
      throw createError({ statusCode: 402, statusMessage: `Payment not successful. Status: ${paymentStatus}` });
    }
  } catch (e: any) {
    // Re-throw framework errors, handle others
    if (e.statusCode) throw e;

    console.error("BFF - PayMongo Verification Error:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.errors?.[0]?.detail || "Could not verify the payment session with PayMongo.",
    });
  }
});
