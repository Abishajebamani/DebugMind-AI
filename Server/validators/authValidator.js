import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(30, "Password cannot exceed 30 characters"),

  role: z.enum([
    "Admin",
    "Project Manager",
    "Developer",
    "Tester",
  ]),
});

export const loginSchema = z.object({
  email: z.email("Please enter a valid email").trim().toLowerCase(),

  password: z.string().min(8, "Password must be at least 8 characters"),
});