// server/api/paymongo/verify-payment.post.ts

import { createError, defineEventHandler, getCookie, readBody } from "h3";

export default defineEventHandler(async (event) => {
  const { checkoutSessionId, userId } = await readBody(event);

  console.log("BFF - Verifying payment for Checkout Session ID:", checkoutSessionId, "and user:", userId);

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized. You must be logged in to verify a payment." });
  }

  if (!checkoutSessionId) {
    throw createError({ statusCode: 400, statusMessage: "Checkout Session ID is required." });
  }

  const config = useRuntimeConfig();
  const paymongoSecretKey = config.paymongoSecretKey;
  const strapiUrl = config.public.strapi?.url;
  const strapiAdminToken = process.env.STRAPI_ADMIN_TOKEN;

  if (!paymongoSecretKey || !strapiUrl || !strapiAdminToken) {
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

    // --- Step 2: Verify the payment was successful ---
    const paymentStatus = checkoutSession?.attributes?.payment_intent?.attributes?.status;
    const paidUserId = checkoutSession?.attributes?.metadata?.strapiUserId;

    if (paymentStatus === "succeeded" && paidUserId == userId) {
      // --- Step 3: Update the user's role in Strapi ---
      console.log(`BFF - Payment verified for user ID: ${userId}. Upgrading to Premium.`);
      console.log(`BFF - Successfully upgraded user ID: ${userId} to Premium.`);

      return { success: true, message: "Account upgraded to Premium!" };
    } else if (paidUserId != userId) {
      // Security check: The logged-in user is not the one who paid.
      throw createError({ statusCode: 403, statusMessage: "Payment does not belong to the current user." });
    } else {
      // The payment was not successful (e.g., pending, failed).
      throw createError({ statusCode: 402, statusMessage: "Payment not successful." });
    }
  } catch (e: any) {
    if (e.statusCode) throw e;
    console.error("BFF - PayMongo Verification Error:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.errors?.[0]?.detail || "Could not verify the payment session.",
    });
  }
});
