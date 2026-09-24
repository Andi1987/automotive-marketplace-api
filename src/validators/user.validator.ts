import { z } from "zod";

export const createUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name must not exceed 150 characters"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),

  role: z
    .enum(["buyer", "seller", "admin"])
    .optional()
    .default("buyer"),
});

export const updateUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name must not exceed 150 characters")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .optional(),

  role: z
    .enum(["buyer", "seller", "admin"])
    .optional(),

  is_active: z
    .boolean()
    .optional(),
});