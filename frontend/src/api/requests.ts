import { fetchJson, setToken, setRole } from "./client";
import { LoginResponseSchema, type LoginResponse } from "../model/auth";
import { DaySummaryListSchema, DaySummarySchema, type DaySummary } from "../model/day";
import { EvaluationResponseSchema, type EvaluationResponse } from "../model/evaluation";
import { AuditLogSchema, type AuditEntry } from "../model/audit";
import { PredictResponseSchema, type PredictResponse } from "../model/predict";
import type { SensorEvent } from "../model/predict";

export async function login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetchJson<LoginResponse>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
    });
    const parsed = LoginResponseSchema.parse(res);
    setToken(parsed.access_token);
    setRole(parsed.role);
    return parsed;
}

export async function getDays(): Promise<DaySummary[]> {
    const res = await fetchJson<DaySummary[]>("/days");
    return DaySummaryListSchema.parse(res);
}

export async function getDayDetail(date: string): Promise<DaySummary> {
    const res = await fetchJson<DaySummary>(`/days/${date}`);
    return DaySummarySchema.parse(res);
}

export async function getAnomalies(): Promise<DaySummary[]> {
    const res = await fetchJson<DaySummary[]>("/anomalies");
    return DaySummaryListSchema.parse(res);
}

export async function getEvaluation(): Promise<EvaluationResponse> {
    const res = await fetchJson<EvaluationResponse>("/anomalies/evaluation");
    return EvaluationResponseSchema.parse(res);
}

export async function getAuditLog(): Promise<AuditEntry[]> {
    const res = await fetchJson<AuditEntry[]>("/audit");
    return AuditLogSchema.parse(res);
}

export async function postPredict(
    date: string,
    events: SensorEvent[],
): Promise<PredictResponse> {
    const res = await fetchJson<PredictResponse>("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, events }),
    });
    return PredictResponseSchema.parse(res);
}
