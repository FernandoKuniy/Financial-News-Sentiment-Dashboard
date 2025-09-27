import { z } from "zod";

export const SentimentReq = z.object({
  headlines: z.array(z.string().min(1).trim()).min(1).max(64),
});

export type SentimentReqType = z.infer<typeof SentimentReq>;
