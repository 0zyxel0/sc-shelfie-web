// /server/api/paymongo/create-checkout.post.ts
import { createError, defineEventHandler, readBody } from "h3";

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

// Define the shape of the user data we expect in the body
interface UserData {
  id: number;
  username?: string | undefined;
  email?: string | undefined;
  provider?: string | undefined;
  confirmed?: boolean | undefined;
  blocked?: boolean | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export default defineEventHandler(async (event) => {
  // ✅ 1. Get user data and plan from the request body
  // MODIFIED: Instead of using a Strapi plugin, we now read both 'plan' and 'user' from the body.
  const { plan, user } = await readBody<{ plan: keyof typeof PLANS; user: UserData }>(event);

  // MODIFIED: Validate the user data received from the body.
  if (!user || !user.id || !user.email || !user.username) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request. User data (id, email, name) is required in the body.",
    });
  }

  // ✅ 2. Parse and validate plan
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
            // MODIFIED: Use the 'user' object from the body instead of 'loggedInUser'.
            billing: {
              email: user.email,
              name: user.username, // The name is now required in the body
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
              // MODIFIED: Use the user ID from the body.
              // Note: You might want to rename 'strapiUserId' to a more generic 'userId'
              // if you are no longer exclusively using Strapi.
              strapiUserId: user.id,
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
