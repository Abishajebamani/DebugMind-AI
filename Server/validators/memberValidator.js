import { z } from "zod";

export const memberSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum([
    "Developer",
    "Tester",
    "Project Manager",
  ]).default("Developer"),
});

export const createMemberInputSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["Developer", "Tester", "Project Manager"]).default("Developer"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["Developer", "Tester", "Project Manager"]).default("Developer"),
});