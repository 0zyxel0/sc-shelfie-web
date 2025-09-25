// server/api/users/[username].get.ts
import { createError, defineEventHandler, getCookie } from "h3";
import qs from "qs";

const flattenAttributes = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    ...data,
  };
};

export default defineEventHandler(async (event) => {
  const { username } = event.context.params;
  const token = getCookie(event, "auth_token");
  const loggedInUser = event.context.user;

  if (!username) {
    throw createError({ statusCode: 400, statusMessage: "Username is required from the URL." });
  }

  const config = useRuntimeConfig();
  const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_API_BASE;
  if (!strapiUrl) {
    throw createError({ statusCode: 500, statusMessage: "Server configuration error." });
  }

  try {
    const userQuery = qs.stringify(
      {
        filters: { username: { $eqi: username } },
        populate: ["profilePicture", "followers", "following"],
      },
      { encodeValuesOnly: true }
    );

    // This call correctly gets a direct array: [userObject]
    const usersResponse = await $fetch<any[]>(`${strapiUrl}/api/users?${userQuery}`);

    if (!usersResponse || usersResponse.length === 0) {
      throw createError({ statusCode: 404, statusMessage: "User not found." });
    }

    const userProfile = usersResponse[0];
    console.log("Fetched user profile:", userProfile);
    console.log("Logged in user:", loggedInUser);

    // --- FIX: Correctly check the `isFollowing` status ---
    let isFollowing = false;
    if (loggedInUser && token) {
      // The `followers` property is a direct array, so we don't access `.data`
      const followerIds = (userProfile.followers || []).map((u) => u.id);
      isFollowing = followerIds.includes(loggedInUser.id);
    }

    const itemsQuery = qs.stringify(
      {
        filters: {
          user: { id: { $eq: userProfile.id } },
          isPrivate: { $eq: false },
        },
        populate: ["userImages", "manufacturer", "character", "series"],
        sort: "createdAt:desc",
        "pagination[pageSize]": 50,
      },
      { encodeValuesOnly: true }
    );

    const { data: itemsResponse } = await $fetch<{ data: any[] }>(`${strapiUrl}/api/items?${itemsQuery}`);

    // --- FIX: Correctly handle profile picture and counts ---
    // The profilePicture relation might also be direct, not nested under .data for this endpoint
    userProfile.profilePicture = userProfile.profilePicture
      ? { id: userProfile.profilePicture.id, url: userProfile.profilePicture.url }
      : null;
    userProfile.followersCount = userProfile.followers?.length || 0;
    userProfile.followingCount = userProfile.following?.length || 0;

    // Clean up large arrays we don't need to send to the client
    delete userProfile.followers;
    delete userProfile.following;
    delete userProfile.provider;
    delete userProfile.confirmed;
    delete userProfile.blocked;

    const userItems = (itemsResponse || []).map((item) => {
      const flatItem = flattenAttributes(item);
      flatItem.manufacturer = flatItem.manufacturer ? flattenAttributes(flatItem.manufacturer).name : null;
      flatItem.series = flatItem.series ? flattenAttributes(flatItem.series).name : null;
      flatItem.userImages = flatItem.userImages?.map(flattenAttributes) || [];
      return flatItem;
    });

    return {
      profile: userProfile,
      items: userItems,
      isFollowing: isFollowing, // This will now be correct on page load
    };
  } catch (e: any) {
    if (e.statusCode) throw e;
    console.error(`BFF - Error fetching profile for user "${username}":`, e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to fetch user profile.",
    });
  }
});
