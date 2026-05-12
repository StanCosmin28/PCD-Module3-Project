import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
} from "@mui/material";
import { login } from "../../api/requests";
import "./Login.scss";

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("caregiver");
    const [password, setPassword] = useState("care123");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await login(username, password);
            navigate("/anomalies");
        } catch {
            setError("Invalid credentials");
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Typography variant="h5" gutterBottom>
                            Caregiver Dashboard
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Explainable Activity Monitoring
                        </Typography>

                        <TextField
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            fullWidth
                            margin="normal"
                            size="small"
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                            size="small"
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            Login
                        </Button>

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 2, display: "block" }}
                        >
                            Users: caregiver/care123 or admin/admin123
                        </Typography>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
