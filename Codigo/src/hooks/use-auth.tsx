import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiResponse, getToken, setToken } from "@/lib/api";
import { AuthContext, AuthUser } from "./auth-context";

const STORAGE_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // On boot, try to hydrate user from localStorage and, if token exists, validate via /auth/profile
        const boot = async () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as AuthUser | null;
                    if (parsed?.email) setUser(parsed);
                }
                const token = getToken();
                if (token) {
                    try {
                        const res = await api.get<ApiResponse<AuthUser>>("/auth/profile");
                        if (res.data?.data) {
                            const u = res.data.data;
                            const mapped: AuthUser = { ...u, name: u.fullName || u.email.split("@")[0] };
                            setUser(mapped);
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
                        }
                    } catch {
                        // token invalid; clear
                        setToken(null);
                        localStorage.removeItem(STORAGE_KEY);
                        setUser(null);
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        void boot();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        if (!email || !password) return false;
        try {
            const res = await api.post<ApiResponse<{ token: string; refreshToken: string; expiresAt: string; user: AuthUser }>>(
                "/auth/login",
                { email, password }
            );
            const payload = res.data?.data;
            if (!payload?.token || !payload?.user) return false;
            setToken(payload.token);
            const mapped: AuthUser = { ...payload.user, name: payload.user.fullName || payload.user.email.split("@")[0] };
            setUser(mapped);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
            return true;
        } catch (e) {
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
    }), [user, loading, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Note: useAuth hook is defined in use-auth-hook.ts to keep this file export clean for Fast Refresh.
