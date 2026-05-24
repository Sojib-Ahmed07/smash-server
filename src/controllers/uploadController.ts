import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";

export const uploadAvatarController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No image file provided or invalid file format.",
      });
    }

    const imageUrl = req.file.path;

    return res.status(200).json({
      status: "success",
      message: "Image uploaded successfully to Cloudinary.",
      avatarUrl: imageUrl,
    });
  } catch (error) {
    console.error("Upload avatar pipeline crash:", error);
    return res.status(500).json({ message: "something went wrong" });
  }
};
