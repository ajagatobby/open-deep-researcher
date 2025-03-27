import z from "zod";

export const feedbackSchema = z.object({
  questions: z.array(z.string()),
});
