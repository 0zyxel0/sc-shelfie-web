// server/api/paymongo/create-checkout.post.ts (Full, Corrected Code)

import { createError, defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
    const loggedInUser = await $fetch('/api/auth/me', { headers: event.node.req.headers });
    if (!loggedInUser) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized. You must be logged in to go premium.' });
    }

    const config = useRuntimeConfig();
    const paymongoSecretKey = config.paymongoSecretKey;

    if (!paymongoSecretKey) {
        throw createError({ statusCode: 500, statusMessage: 'PayMongo secret key is not configured on the server.' });
    }

    const base64ApiKey = Buffer.from(paymongoSecretKey).toString('base64');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${base64ApiKey}`,
    };

    const premiumProductName = "Shelfie Premium Subscription";
    const premiumAmount = 200;
    const premiumCurrency = "PHP";

    try {
        const response = await $fetch<{ data: any }>('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers,
            body: {
                data: {
                    attributes: {
                        billing: { email: loggedInUser.email, name: loggedInUser.displayName || loggedInUser.username },
                        send_email_receipt: true,
                        show_description: false,
                        show_line_items: true,
                        line_items: [{
                            currency: premiumCurrency,
                            amount: premiumAmount * 100,
                            name: premiumProductName,
                            quantity: 1,
                        }],
                        payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
                        success_url: 'http://localhost:3000/premium/success',
                        cancel_url: 'http://localhost:3000/premium/cancelled',
                        metadata: { strapiUserId: loggedInUser.id }
                    }
                }
            }
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
            checkoutSessionId
        };

    } catch (e: any) {
        console.error("BFF - PayMongo Checkout Error:", e.response?._data || e.message);
        throw createError({
            statusCode: e.response?.status || 500,
            statusMessage: e.response?._data?.errors?.[0]?.detail || 'Could not create a payment session.',
        });
    }
});