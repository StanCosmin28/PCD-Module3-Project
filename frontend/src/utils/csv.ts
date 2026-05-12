import type { SensorEvent } from "../model/predict";

export interface ParsedSensorCsv {
    date: string;
    events: SensorEvent[];
    errors: string[];
    skippedLines: number;
}

const TIME_PATTERN = /^\d{1,2}:\d{2}/;

export function parseSensorCsv(text: string): ParsedSensorCsv {
    const lines = text.trim().split("\n").filter((l) => l.trim());
    const events: SensorEvent[] = [];
    const errors: string[] = [];
    let date = "";
    let skippedLines = 0;

    if (lines.length === 0) {
        errors.push("File is empty.");
        return { date: "", events: [], errors, skippedLines: 0 };
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(",").map((p) => p.trim());

        if (parts.length >= 4) {
            // Format: date,time,sensor,state
            const [d, time, sensor, state] = parts;
            if (!date) date = d;

            if (!TIME_PATTERN.test(time)) {
                skippedLines++;
                continue;
            }
            if (!sensor || !state) {
                skippedLines++;
                continue;
            }

            events.push({ time, sensor, state });
        } else if (parts.length === 3) {
            // Format: time,sensor,state
            const [time, sensor, state] = parts;

            if (!TIME_PATTERN.test(time)) {
                skippedLines++;
                continue;
            }
            if (!sensor || !state) {
                skippedLines++;
                continue;
            }

            events.push({ time, sensor, state });
        } else {
            skippedLines++;
        }
    }

    if (events.length === 0) {
        errors.push(
            "No valid sensor events found. Expected CSV format: date,time,sensor,state or time,sensor,state",
        );
    }

    if (skippedLines > 0 && events.length > 0) {
        errors.push(
            `${skippedLines} line${skippedLines > 1 ? "s were" : " was"} skipped due to invalid format.`,
        );
    }

    if (!date) date = "2024-01-01";

    return { date, events, errors, skippedLines };
}
