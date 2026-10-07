import { z } from "zod";

export const createBugSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters"),

  description: z.string().optional(),

  priority: z.enum([
    "Low",
    "Medium",
    "High",
    "Critical",
  ]),

  project_id: z.string().uuid("Invalid Project ID"),

  assigned_to: z
    .string()
    .uuid("Invalid User ID")
    .nullable()
    .optional(),
});

export const updateBugSchema = z.object({
  title: z.string().min(3),

  description: z.string().min(5),

  priority: z.enum([
    "Low",
    "Medium",
    "High",
    "Critical",
  ]),

  status: z.enum([
    "Open",
    "In Progress",
    "Resolved",
  ]),

  project_id: z.string().uuid(),
});

export const assignBugSchema = z.object({
  assigned_to: z
    .string()
    .uuid("Invalid User ID"),
});