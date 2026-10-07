import { z } from "zod";

export const createCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment is required")
    .max(1000, "Comment cannot exceed 1000 characters"),
});