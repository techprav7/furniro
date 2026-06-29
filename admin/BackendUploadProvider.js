import { BaseProvider } from "@adminjs/upload";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

/**
 * Extracts Cloudinary public_id from a full secure URL.
 * Example: https://res.cloudinary.com/cloud-name/image/upload/v12345/furnio/products/filename.jpg
 * Returns: furnio/products/filename
 */
function getPublicIdFromUrl(url) {
  if (!url) return null;
  if (!url.startsWith("http")) {
    // If it's already a relative path/key, just strip extension
    const dotIndex = url.lastIndexOf(".");
    return dotIndex !== -1 ? url.substring(0, dotIndex) : url;
  }

  const parts = url.split("/image/upload/");
  if (parts.length < 2) return null;

  let afterUpload = parts[1];
  // Match version prefix (e.g., v1570975202/)
  const versionMatch = afterUpload.match(/^v\d+\//);
  if (versionMatch) {
    afterUpload = afterUpload.substring(versionMatch[0].length);
  }

  // Strip file extension
  const dotIndex = afterUpload.lastIndexOf(".");
  if (dotIndex !== -1) {
    afterUpload = afterUpload.substring(0, dotIndex);
  }
  return afterUpload;
}

export class BackendUploadProvider extends BaseProvider {
  constructor() {
    // Pass a dummy bucket name to super
    super("cloudinary");
  }

  /**
   * Upload the file by posting it to the backend upload API
   */
  async upload(file, key) {
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(file.path), file.name);

      // Construct a clean public_id (strip extension from key)
      const dotIndex = key.lastIndexOf(".");
      const publicId = dotIndex !== -1 ? key.substring(0, dotIndex) : key;
      formData.append("public_id", publicId);

      const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:3001";
      
      console.log(`📡 Uploading to backend upload API: ${backendUrl}/api/upload with public_id: ${publicId}`);

      const response = await axios.post(`${backendUrl}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      console.log("✅ Backend upload success:", response.data);
      // We don't return anything as BaseProvider.upload returns Promise<void>
    } catch (error) {
      console.error("❌ BackendUploadProvider.upload failed:", error.response?.data || error.message);
      throw new Error(`Upload to Cloudinary via backend failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete the file from Cloudinary by calling the backend delete API
   */
  async delete(key, bucket) {
    try {
      const publicId = getPublicIdFromUrl(key);
      if (!publicId) {
        console.warn(`⚠️ Warning: Could not parse public_id from key: ${key}. Skipping deletion.`);
        return;
      }

      const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:3001";
      
      console.log(`📡 Sending delete request for public_id: ${publicId}`);

      const response = await axios.delete(`${backendUrl}/api/upload`, {
        data: { public_id: publicId },
      });

      console.log("✅ Backend delete success:", response.data);
    } catch (error) {
      console.error("❌ BackendUploadProvider.delete failed:", error.response?.data || error.message);
      // Don't throw error to avoid crashing the admin save/delete request if delete fails
    }
  }

  /**
   * Return the public path of the file
   */
  path(key, bucket) {
    if (!key) return "";
    // If the database has stored the absolute URL, return it directly
    if (key.startsWith("http")) {
      return key;
    }
    // Fallback: construct URL using local environment if it's a relative key
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${key}`;
  }
}
