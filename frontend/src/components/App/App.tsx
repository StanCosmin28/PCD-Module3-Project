import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import ProtectedRoute from "../../routes/ProtectedRoute";
import DashboardLayout from "../../layouts/DashboardLayout";
import Login from "../Login/Login";
import AnomaliesView from "../AnomaliesView/AnomaliesView";
import AllDaysView from "../AllDaysView/AllDaysView";
import DayDetail from "../DayDetail/DayDetail";
import SimulateView from "../SimulateView/SimulateView";
import EvaluationView from "../EvaluationView/EvaluationView";
import AuditView from "../AuditView/AuditView";

const theme = createTheme({
    palette: {
        mode: "dark",
    },
});

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<ProtectedRoute />}>
                        <Route element={<DashboardLayout />}>
                            <Route index element={<Navigate to="/anomalies" replace />} />
                            <Route path="anomalies" element={<AnomaliesView />} />
                            <Route path="anomalies/:date" element={<DayDetail />} />
                            <Route path="days" element={<AllDaysView />} />
                            <Route path="days/:date" element={<DayDetail />} />
                            <Route path="simulate" element={<SimulateView />} />
                            <Route path="evaluation" element={<EvaluationView />} />
                            <Route path="audit" element={<AuditView />} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}
