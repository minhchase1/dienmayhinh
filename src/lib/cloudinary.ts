import "server-only";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

function configuredCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary chưa được cấu hình đầy đủ trên máy chủ.");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

export async function uploadProductImage(buffer: Buffer, publicId: string) {
  const client = configuredCloudinary();
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream({
      resource_type: "image",
      folder: "dienmayhinh/products",
      public_id: publicId,
      unique_filename: false,
      overwrite: false,
    }, (error, uploaded) => {
      if (error || !uploaded) reject(error ?? new Error("Cloudinary không trả về kết quả upload."));
      else resolve(uploaded);
    });
    stream.end(buffer);
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export function cloudinaryPublicId(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const marker = "/image/upload/";
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    const assetPath = pathname.slice(markerIndex + marker.length).replace(/^v\d+\//, "");
    return decodeURIComponent(assetPath.replace(/\.[^/.]+$/, ""));
  } catch {
    return null;
  }
}

export async function deleteProductImages(urls: string[]) {
  const publicIds = [...new Set(urls.map(cloudinaryPublicId).filter((id): id is string => Boolean(id)))];
  if (!publicIds.length) return;
  const client = configuredCloudinary();
  await Promise.all(publicIds.map(publicId => client.uploader.destroy(publicId, { resource_type: "image", invalidate: true })));
}
