import { useEffect, useState } from "react";
import { Box, Stack } from "@mui/material";
import { getDays } from "../../api/requests";
import type { DaySummary } from "../../model/day";
import DayCard from "../DayCard/DayCard";

export default function AllDaysView() {
    const [days, setDays] = useState<DaySummary[]>([]);

    useEffect(() => {
        getDays().then(setDays);
    }, []);

    return (
        <Box>
            <Stack spacing={1}>
                {days.map((d) => (
                    <DayCard key={d.date} day={d} basePath="/days" />
                ))}
            </Stack>
        </Box>
    );
}
