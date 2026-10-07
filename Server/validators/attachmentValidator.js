import { z } from "zod";

export const attachmentSchema = z.object({
  bugId: z.string().uuid("Invalid Bug ID"),
});