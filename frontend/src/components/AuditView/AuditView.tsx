import { useEffect, useState } from "react";
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
} from "@mui/material";
import { getAuditLog } from "../../api/requests";
import type { AuditEntry } from "../../model/audit";

export default function AuditView() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAuditLog()
            .then(setEntries)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LinearProgress />;

    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {entries.slice(0, 50).map((entry, i) => (
                        <TableRow key={i}>
                            <TableCell>{entry.timestamp?.slice(11, 19)}</TableCell>
                            <TableCell>{entry.user}</TableCell>
                            <TableCell>
                                {entry.action ?? `${entry.method} ${entry.path}`}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
