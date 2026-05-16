// Set at build time via Vite (--build-arg VITE_API_BASE_URL=... in Docker).
// Falls back to localhost so `npm run dev` keeps working without any env file.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

let token = localStorage.getItem("token") ?? "";

export function getToken(): string {
    return token;
}

export function setToken(t: string): void {
    token = t;
    localStorage.setItem("token", t);
}

export function clearToken(): void {
    token = "";
    localStorage.removeItem("token");
    localStorage.removeItem("role");
}

export function getRole(): string {
    return localStorage.getItem("role") ?? "";
}

export function setRole(r: string): void {
    localStorage.setItem("role", r);
}

export async function fetchJson<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        clearToken();
        window.location.reload();
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
}
