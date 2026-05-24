import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(3, { message: "Name must be at least 3 characters" }),
  email: z.string({ message: "Email is required" }).email("Invalid email"),
  password: z
    .string({ message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z
    .string({ message: "Confirm password is required" })
    .min(6, { message: "Confirm password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
