import { useNavigate } from "react-router-dom";
import { Card, CardActionArea, CardContent, Typography, Chip, Stack } from "@mui/material";
import type { DaySummary } from "../../model/day";
import "./DayCard.scss";

interface DayCardProps {
    day: DaySummary;
    basePath: string;
}

export default function DayCard({ day, basePath }: DayCardProps) {
    const navigate = useNavigate();
    const hasAnomaly = Object.values(day.rooms).some((r) => r.status === "anomaly");

    return (
        <Card
            className="day-card"
            sx={{ borderLeft: 4, borderColor: hasAnomaly ? "error.main" : "success.main" }}
        >
            <CardActionArea onClick={() => navigate(`${basePath}/${day.date}`)}>
                <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {day.date} {hasAnomaly ? "[ANOMALY]" : "[OK]"}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                        {Object.entries(day.rooms).map(([name, r]) => (
                            <Chip
                                key={name}
                                label={name.toLowerCase()}
                                size="small"
                                color={r.status === "anomaly" ? "error" : "success"}
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
