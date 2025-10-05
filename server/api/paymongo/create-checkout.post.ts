// /server/api/paymongo/create-checkout.post.ts
import { createError, defineEventHandler, readBody } from "h3";
import { useStrapiUser } from "#strapi"; // ✅ Nuxt Strapi plugin helper

// --- Server-side source of truth for pricing ---
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
  // ✅ 1. Get the currently authenticated Strapi user via Nuxt Strapi plugin
  const loggedInUser = await useStrapiUser(event);

  if (!loggedInUser) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized. You must be logged in to go premium.",
    });
  }

  // ✅ 2. Parse and validate plan
  const { plan } = await readBody<{ plan: keyof typeof PLANS }>(event);
  const selectedPlan = PLANS[plan];

  if (!selectedPlan) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid subscription plan selected.",
    });
  }

  // ✅ 3. Get runtime config
  const config = useRuntimeConfig();
  const paymongoSecretKey = config.paymongoSecretKey;

  if (!paymongoSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "PayMongo secret key is not configured on the server.",
    });
  }

  // ✅ 4. Prepare PayMongo request
  const base64ApiKey = Buffer.from(paymongoSecretKey).toString("base64");
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Basic ${base64ApiKey}`,
  };

  try {
    // ✅ 5. Create checkout session with PayMongo
    const response = await $fetch<{ data: any }>("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers,
      body: {
        data: {
          attributes: {
            billing: {
              email: loggedInUser.email,
              name: loggedInUser.username || loggedInUser.displayName || loggedInUser.email,
            },
            send_email_receipt: true,
            show_description: false,
            show_line_items: true,
            line_items: [
              {
                currency: selectedPlan.currency,
                amount: selectedPlan.amount,
                name: selectedPlan.name,
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
            success_url: `${config.publicSiteUrl}/premium/success`,
            cancel_url: `${config.publicSiteUrl}/premium/cancelled`,
            metadata: {
              strapiUserId: loggedInUser.id,
              plan,
            },
          },
        },
      },
    });

    const checkoutSession = response.data;
    const checkoutUrl = checkoutSession?.attributes?.checkout_url;
    const checkoutSessionId = checkoutSession?.id;

    if (!checkoutUrl || !checkoutSessionId) {
      throw new Error("Failed to retrieve checkout URL or Session ID from PayMongo.");
    }

    // ✅ 6. Return checkout URL and session ID
    return {
      checkoutUrl,
      checkoutSessionId,
    };
  } catch (e: any) {
    console.error("PayMongo Checkout Error:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.errors?.[0]?.detail || "Could not create a payment session.",
    });
  }
});
