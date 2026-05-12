import { z } from "zod/v4";

export const LoginResponseSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
    role: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
