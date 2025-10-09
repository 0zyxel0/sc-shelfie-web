// composables/usePremiumStatus.ts

export const usePremiumStatus = () => {
  const user = useStrapiUser();

  const isPremium = computed(() => {
    // Log the user object to help debug
    // console.log("User data in usePremiumStatus:", user.value);

    // 1. Check if the user exists and if the 'subscription' object is present and not null.
    if (!user.value || !user.value.subscription) {
      return false;
    }

    // 2. Handle both flattened object and standard { data: { attributes: ... } } structure
    const sub = user.value.subscription.data || user.value.subscription;
    console.log("Subscription data in usePremiumStatus:", sub);
    const attributes = sub.attributes || sub;

    // 3. Check if the subscription object has the needed properties
    if (!attributes.subscriptionStatus || !attributes.expiresAt) {
      return false;
    }

    // 4. Perform the logic check on the single object
    const expiresAt = new Date(attributes.expiresAt);
    return attributes.subscriptionStatus === "active" && expiresAt > new Date();
  });

  return { isPremium };
};
