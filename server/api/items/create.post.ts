// server/api/items/create.post.ts
import { createError, defineEventHandler, getCookie, readMultipartFormData } from "h3";
import qs from "qs";

// Helper function to find or create a related entity in Strapi
// This encapsulates the logic previously on the client-side
const findOrCreate = async (endpoint, name, strapiUrl, token) => {
  if (!name?.trim()) return null;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const query = qs.stringify(
    {
      filters: { name: { $eqi: name.trim() } },
      fields: ["id"], // Only need the ID
    },
    { encodeValuesOnly: true }
  );

  try {
    const { data: existing } = await $fetch(`${strapiUrl}/api/${endpoint}?${query}`, { headers });

    if (existing?.[0]?.id) {
      return existing[0].id;
    }

    // If not found, create it
    const { data: created } = await $fetch(`${strapiUrl}/api/${endpoint}`, {
      method: "POST",
      headers,
      body: { data: { name: name.trim() } },
    });
    return created?.id;
  } catch (e) {
    console.error(`BFF - Error in findOrCreate for ${endpoint} with name "${name}":`, e);
    // Depending on desired behavior, you could throw or return null
    return null;
  }
};

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");
  const userId = event.context.user?.id; // From our auth middleware
  const { $strapi } = event.context;

  if (!token || !userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const config = useRuntimeConfig();
  const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_API_BASE;
  if (!strapiUrl) {
    throw createError({ statusCode: 500, statusMessage: "Server configuration error." });
  }

  // Read multipart form data which includes both files and text fields
  const formDataParts = await readMultipartFormData(event);

  const form = {};
  const filesToUpload = [];

  // Separate form fields and files from the multipart data
  formDataParts.forEach((part) => {
    if (part.filename) {
      // This is a file
      filesToUpload.push(part);
    } else {
      // This is a text field
      form[part.name] = part.data.toString();
    }
  });

  try {
    // Step 1: Upload images if they exist
    let imageIds = [];
    if (filesToUpload.length > 0) {
      const strapiUploadFormData = new FormData();
      filesToUpload.forEach((file) => {
        const blob = new Blob([file.data], { type: file.type });
        strapiUploadFormData.append("files", blob, file.filename);
      });

      const uploadedFiles = await $strapi.client(`/upload`, {
        method: "POST",
        body: strapiUploadFormData,
      });
      imageIds = uploadedFiles.map((file) => file.id);
    }

    // Step 2: Find or create all related entities (Manufacturer, etc.)
    const manufacturerId = await findOrCreate("manufacturers", form.manufacturer, strapiUrl, token);
    const characterId = await findOrCreate("characters", form.character, strapiUrl, token);
    const seriesId = await findOrCreate("serieses", form.series, strapiUrl, token);

    // Categories and Tags are sent as comma-separated strings
    const categoryNames = form.categories ? form.categories.split(",").filter(Boolean) : [];
    const tagNames = form.tags ? form.tags.split(",").filter(Boolean) : [];

    const categoryIds = await Promise.all(categoryNames.map((name) => findOrCreate("categories", name, strapiUrl, token)));
    const tagIds = await Promise.all(tagNames.map((name) => findOrCreate("itags", name, strapiUrl, token)));

    // Step 3: Construct the final payload to create the item in Strapi
    const payload = {
      data: {
        name: form.name,
        user: userId, // Use the user ID from the secure server context
        itemStatus: form.itemStatus,
        description: form.description,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
        purchaseDate: form.purchaseDate || null,
        isPrivate: form.isPrivate === "true", // Convert string from form to boolean
        userImages: imageIds,
        manufacturer: manufacturerId,
        character: characterId,
        series: seriesId,
        categories: categoryIds.filter((id) => id),
        itags: tagIds.filter((id) => id),
      },
    };

    // Step 4: Create the final item
    const { data: createdItem } = await $strapi.client(`/items`, {
      method: "POST",
      body: payload,
    });

    // Return the newly created item's ID (or the full item) to the client
    return {
      id: createdItem.id,
      ...createdItem,
    };
  } catch (e: any) {
    console.error("BFF - Error creating item:", e.response?._data || e);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to create item.",
    });
  }
});
