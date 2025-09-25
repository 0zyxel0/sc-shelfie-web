// server/api/upload.post.ts
import { createError, defineEventHandler, getCookie, readMultipartFormData } from "h3";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: No authentication token found.",
    });
  }

  // Read multipart form data (the file upload)
  const formData = await readMultipartFormData(event);

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: No file data received.",
    });
  }

  // Re-construct FormData for the upstream Strapi request
  const strapiFormData = new FormData();
  formData.forEach((part) => {
    // `part` has `name`, `data` (Buffer), `filename`, `type`
    // Convert Buffer to Blob for FormData append if not already a Blob
    if (part.filename && part.data) {
      const blob = new Blob([part.data], { type: part.type });
      strapiFormData.append(part.name, blob, part.filename);
    } else {
      // Handle non-file parts if your upload endpoint expects them
      strapiFormData.append(part.name, part.data.toString());
    }
  });

  try {
    const config = useRuntimeConfig();
    const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_API_BASE;
    if (!strapiUrl) {
      throw createError({ statusCode: 500, statusMessage: "Server config error." });
    }

    // Make the actual upload request to Strapi
    const response = await $fetch(`${strapiUrl}/api/upload`, {
      method: "POST",
      headers: {
        // DO NOT set 'Content-Type': 'multipart/form-data' explicitly here.
        // $fetch (and underlying `ofetch`) will set it automatically with the correct boundary
        // when a FormData object is provided as `body`.
        Authorization: `Bearer ${token}`,
      },
      body: strapiFormData, // Send the FormData object
    });

    return response; // Strapi returns an array of uploaded files
  } catch (e: any) {
    console.error("BFF - Error uploading file to Strapi:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to upload file.",
    });
  }
});
