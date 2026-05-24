import type { Request, Response } from "express";
import { registerSchema } from "../validations/authValidation.js";
import prisma from "../config/database.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";
import { emailQueue, emailQueueName } from "../jobs/EmailJob.js";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registerController = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const payload = registerSchema.safeParse(body);

    if (!payload.success) {
      return res.status(422).json({
        status: "error",
        message: "Validation failed.",
        errors: payload.error.flatten().fieldErrors,
      });
    }

    const { name, email, password } = payload.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const emailVerificationToken = uuidv4();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        email_verify_token: emailVerificationToken,
        email_token_expires: tokenExpiry,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const actionUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${emailVerificationToken}`;

    console.log("🔥 THE GENERATED URL IS:", actionUrl);

    const templatePath = path.join(
      __dirname,
      "../views/email/email-verify.ejs",
    );

    const htmlContent = await ejs.renderFile(templatePath, {
      user: { name: newUser.name },
      actionUrl: actionUrl,
    });

    await emailQueue.add(emailQueueName, {
      to: newUser.email,
      subject: "Verify your email address - SMASH Arena",
      htmlContent: htmlContent,
    });

    return res.status(201).json({
      status: "success",
      message: "User created successfully.",
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "something went wrong" });
  }
};

const verifyEmailController = async (req: Request, res: Response) => {
  // Resolve the frontend URL base path from your environment variables
  const clientAppUrl = process.env.CLIENT_APP_URL || "http://localhost:3000";
  const loginRedirectUrl = `${clientAppUrl}/login`;

  try {
    const { token } = req.query;

    // 1. Validate token existence and type
    if (!token || typeof token !== "string") {
      return res.redirect(
        `${loginRedirectUrl}?status=error&message=invalid_token`,
      );
    }

    // 2. Locate the user with this token
    const user = await prisma.user.findFirst({
      where: { email_verify_token: token },
      select: {
        id: true,
        email_token_expires: true,
        email_verified_at: true,
      },
    });

    // 3. Token not found or invalid
    if (!user) {
      return res.redirect(
        `${loginRedirectUrl}?status=error&message=token_not_found`,
      );
    }

    // 4. User is already verified
    if (user.email_verified_at) {
      return res.redirect(
        `${loginRedirectUrl}?status=info&message=already_verified`,
      );
    }

    // 5. Token expiration boundary check
    if (user.email_token_expires && new Date() > user.email_token_expires) {
      return res.redirect(
        `${loginRedirectUrl}?status=error&message=link_expired`,
      );
    }

    // 6. Update database record: Set verified timestamp and clear tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified_at: new Date(),
        email_verify_token: null,
        email_token_expires: null,
      },
    });

    // 7. 🎉 SUCCESS REDIRECT: Send the user directly to the frontend login page
    return res.redirect(
      `${loginRedirectUrl}?status=success&message=email_verified`,
    );
  } catch (error) {
    console.error("Email verification pipeline error:", error);
    // Safe fallback to frontend login in case of system/database crash
    return res.redirect(
      `${loginRedirectUrl}?status=error&message=server_error`,
    );
  }
};

const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide both email and password.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password.",
      });
    }

    if (!user.email_verified_at) {
      return res.status(403).json({
        status: "error",
        message: "Please verify your email address before logging in.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "smash_arena_fallback_secret_key",
      { expiresIn: "1d" }, // Token remains valid for 24 hours
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: "success",
      message: "Logged in successfully.",
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login endpoint crash:", error);
    return res.status(500).json({ message: "something went wrong" });
  }
};

const logoutController = async (req: Request, res: Response) => {
  try {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout pipeline crash:", error);
    return res.status(500).json({ message: "something went wrong" });
  }
};

const checkSessionController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized context.",
      });
    }

    const userIdAsNumber = parseInt(req.user.userId, 10);

    if (isNaN(userIdAsNumber)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user identification format.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdAsNumber },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User context no longer exists.",
      });
    }

    return res.status(200).json({
      status: "success",
      user,
    });
  } catch (error) {
    console.error("Check session pipeline crash:", error);
    return res.status(500).json({ message: "something went wrong" });
  }
};

export {
  registerController,
  verifyEmailController,
  loginController,
  logoutController,
  checkSessionController,
};
