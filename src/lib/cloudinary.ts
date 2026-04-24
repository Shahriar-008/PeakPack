import { v2 as cloudinary } from "cloudinary";
import { readRequiredEnv } from "@/lib/env";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: readRequiredEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: readRequiredEnv("CLOUDINARY_API_KEY"),
      api_secret: readRequiredEnv("CLOUDINARY_API_SECRET"),
      secure: true
    });
    configured = true;
  }

  return cloudinary;
}
