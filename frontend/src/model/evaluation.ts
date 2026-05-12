import { z } from "zod/v4";

export const EvalMetricsSchema = z.object({
    precision: z.number(),
    recall: z.number(),
    f1_score: z.number(),
    true_positives: z.number(),
    false_positives: z.number(),
    false_negatives: z.number(),
});

export type EvalMetrics = z.infer<typeof EvalMetricsSchema>;

export const EvaluationResponseSchema = z.record(z.string(), EvalMetricsSchema);

export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>;
