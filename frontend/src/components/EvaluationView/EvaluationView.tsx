import { useEffect, useState } from "react";
import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
} from "@mui/material";
import { getEvaluation } from "../../api/requests";
import type { EvaluationResponse } from "../../model/evaluation";

export default function EvaluationView() {
    const [data, setData] = useState<EvaluationResponse | null>(null);

    useEffect(() => {
        getEvaluation().then(setData);
    }, []);

    if (!data) return <LinearProgress />;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Model Performance
            </Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Room</TableCell>
                            <TableCell>Precision</TableCell>
                            <TableCell>Recall</TableCell>
                            <TableCell>F1-Score</TableCell>
                            <TableCell>TP</TableCell>
                            <TableCell>FP</TableCell>
                            <TableCell>FN</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(data).map(([room, m]) => (
                            <TableRow key={room}>
                                <TableCell>{room}</TableCell>
                                <TableCell>{m.precision}</TableCell>
                                <TableCell>{m.recall}</TableCell>
                                <TableCell>{m.f1_score}</TableCell>
                                <TableCell>{m.true_positives}</TableCell>
                                <TableCell>{m.false_positives}</TableCell>
                                <TableCell>{m.false_negatives}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
