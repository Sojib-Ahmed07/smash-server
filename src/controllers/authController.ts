import type { Request, Response } from "express";
import { registerSchema } from "../validations/authValidation.js";
import prisma from "../config/database.js";
import bcrypt from "bcryptjs";
import {v4 as uuidv4} from "uuid"


const registerController = async(req: Request, res: Response) => {
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
      where: {email},
      select: {id: true}
    });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return res.status(201).json({
      status: "success",
      message: "User created successfully.",
      data: newUser
    });

  } catch (error) {
    return res.status(500).json({ message: "something went wrong" });
  }
};

export { registerController };
