// /server/api/paymongo/create-checkout.post.ts (Full, Corrected Code)

import { createError, defineEventHandler } from "h3";

// --- Server-side source of truth for pricing ---
// Prices are in the smallest currency unit (centavos for PHP).
const PLANS = {
  monthly: {
    name: "Shelfie Premium (Monthly)",
    amount: 20000, // 200.00 PHP
    currency: "PHP",
  },
  annually: {
    name: "Shelfie Premium (Annually)",
    amount: 220800, // (200 * 12) * 0.92 = 2208.00 PHP
    currency: "PHP",
  },
};

export default defineEventHandler(async (event) => {
  const loggedInUser = await $fetch("/api/auth/me", { headers: event.node.req.headers });
  if (!loggedInUser) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized. You must be logged in to go premium." });
  }

  // --- Read the plan selection from the request body ---
  const { plan } = await readBody(event);
  const selectedPlan = PLANS[plan];

  // --- Validate the selected plan ---
  if (!selectedPlan) {
    throw createError({ statusCode: 400, statusMessage: "Invalid subscription plan selected." });
  }

  const config = useRuntimeConfig();
  const paymongoSecretKey = config.paymongoSecretKey;
  if (!paymongoSecretKey) {
    throw createError({ statusCode: 500, statusMessage: "PayMongo secret key is not configured on the server." });
  }

  const base64ApiKey = Buffer.from(paymongoSecretKey).toString("base64");
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Basic ${base64ApiKey}`,
  };

  try {
    const response = await $fetch<{ data: any }>("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers,
      body: {
        data: {
          attributes: {
            billing: { email: loggedInUser.email, name: loggedInUser.displayName || loggedInUser.username },
            send_email_receipt: true,
            show_description: false,
            show_line_items: true,
            line_items: [
              {
                // --- Use the validated plan details ---
                currency: selectedPlan.currency,
                amount: selectedPlan.amount,
                name: selectedPlan.name,
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
            success_url: `${config.publicSiteUrl}/premium/success`,
            cancel_url: `${config.publicSiteUrl}/premium/cancelled`,
            metadata: { strapiUserId: loggedInUser.id, plan: plan },
          },
        },
      },
    });

    const checkoutSession = response.data;
    const checkoutUrl = checkoutSession?.attributes?.checkout_url;
    // --- FIX: Get the session ID ---
    const checkoutSessionId = checkoutSession?.id;

    if (!checkoutUrl || !checkoutSessionId) {
      throw new Error("Failed to retrieve checkout URL or Session ID from PayMongo.");
    }

    // --- FIX: Return BOTH the URL and the ID to the client ---
    return {
      checkoutUrl,
      checkoutSessionId,
    };
  } catch (e: any) {
    console.error("BFF - PayMongo Checkout Error:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.errors?.[0]?.detail || "Could not create a payment session.",
    });
  }
});
