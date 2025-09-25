// server/api/profile/me.get.ts
import { createError, defineEventHandler, getCookie, getQuery } from "h3";
import qs from "qs";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: No authentication token found.",
    });
  }

  try {
    const clientQueryParams = getQuery(event);
    let paramsForStrapi = JSON.parse(JSON.stringify(clientQueryParams)); // Deep copy to avoid modifying original

    // --- Dynamic Populate Logic ---
    // This logic handles various ways the client might request populate and
    // ensures the Strapi-expected deep object structure for connections.
    if (typeof paramsForStrapi.populate === "string" && paramsForStrapi.populate.startsWith("{")) {
      // If populate came as a stringified JSON, parse it
      try {
        paramsForStrapi.populate = JSON.parse(paramsForStrapi.populate);
      } catch (e) {
        console.warn("BFF - Could not JSON.parse populate string:", paramsForStrapi.populate, e);
      }
    } else if (Array.isArray(paramsForStrapi.populate)) {
      // If populate is an array (e.g., ['profilePicture', 'followers', 'following'])
      // Convert it to the deep object structure Strapi expects for connections
      const newPopulate = {};
      if (paramsForStrapi.populate.includes("profilePicture")) {
        newPopulate.profilePicture = true;
      }
      if (paramsForStrapi.populate.includes("followers")) {
        newPopulate.followers = { populate: "profilePicture" }; // Deep populate for connections
      }
      if (paramsForStrapi.populate.includes("following")) {
        newPopulate.following = { populate: "profilePicture" }; // Deep populate for connections
      }
      paramsForStrapi.populate = newPopulate;
    } else if (typeof paramsForStrapi.populate === "object" && paramsForStrapi.populate !== null) {
      // If it's already a deep object, ensure nested populates are correct for connections
      if (paramsForStrapi.populate.followers === true) {
        paramsForStrapi.populate.followers = { populate: "profilePicture" };
      }
      if (paramsForStrapi.populate.following === true) {
        paramsForStrapi.populate.following = { populate: "profilePicture" };
      }
    } else {
      // Default populate if none is provided or recognized for a comprehensive user profile
      paramsForStrapi.populate = {
        profilePicture: true,
        followers: { populate: "profilePicture" }, // Ensure deep populate for picture in followers
        following: { populate: "profilePicture" }, // Ensure deep populate for picture in following
      };
    }

    // Do the same for 'filters' if it's potentially a stringified JSON
    if (typeof paramsForStrapi.filters === "string" && paramsForStrapi.filters.startsWith("{")) {
      try {
        paramsForStrapi.filters = JSON.parse(paramsForStrapi.filters);
      } catch (e) {
        console.warn("BFF - Could not JSON.parse filters string:", paramsForStrapi.filters, e);
      }
    }

    // Stringify the potentially parsed object into square-bracket notation for Strapi
    const query = qs.stringify(paramsForStrapi, { encodeValuesOnly: true });

    const config = useRuntimeConfig();
    const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_API_BASE;

    if (!strapiUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: "Server configuration error: Strapi URL not defined in runtimeConfig or environment.",
      });
    }

    console.log("BFF - Query string sent to Strapi for /users/me:", query);
    const response = await $fetch(`${strapiUrl}/api/users/me?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("BFF - Raw response from Strapi /users/me:", response);

    // --- Transform nested user objects (followers/following) for client-side consumption ---
    // Strapi returns profilePicture nested as `data.attributes.url`
    // We flatten it to `profilePicture.url` for easier use on the frontend in UserListItem
    const transformUserConnections = (userObj) => {
      if (!userObj) return null;
      return {
        id: userObj.id,
        username: userObj.username,
        displayName: userObj.displayName,
        email: userObj.email,
        // Flatten profilePicture structure
        profilePicture: userObj.profilePicture?.data?.url ? { url: userObj.profilePicture.data.url } : null,
        // Add any other user fields you want to expose to the client here
      };
    };

    return {
      ...response, // Include other top-level user details (like id, username, email, displayName, etc.)
      // Apply transformation to followers and following arrays
      following: response.following?.map(transformUserConnections) || [],
      followers: response.followers?.map(transformUserConnections) || [],
      // Ensure the *main* user's profile picture is also flattened if needed by global `user` state
      profilePicture: response.profilePicture?.data?.attributes?.url ? { url: response.profilePicture.data.attributes.url } : null,
    };
  } catch (e: any) {
    console.error("BFF - Error fetching user profile from Strapi:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to fetch user profile.",
    });
  }
});
