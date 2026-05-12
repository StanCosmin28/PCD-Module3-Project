import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Stack } from "@mui/material";
import { getAnomalies } from "../../api/requests";
import type { DaySummary } from "../../model/day";
import DayCard from "../DayCard/DayCard";

export default function AnomaliesView() {
    const [anomalies, setAnomalies] = useState<DaySummary[]>([]);

    useEffect(() => {
        getAnomalies().then(setAnomalies);
    }, []);

    return (
        <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h4">{anomalies.length}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Anomalous Days
                        </Typography>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Typography variant="h4">4</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Rooms
                        </Typography>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Typography variant="h4">128</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Test Days
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>

            <Stack spacing={1}>
                {anomalies.map((d) => (
                    <DayCard key={d.date} day={d} basePath="/anomalies" />
                ))}
            </Stack>
        </Box>
    );
}
