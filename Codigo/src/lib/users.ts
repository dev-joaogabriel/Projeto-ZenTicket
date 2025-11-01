import { api, ApiResponse } from "./api";

export type UserType = "Customer" | "Agent" | "Admin" | string | number;

export type ApiUser = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    userType: UserType;
    isActive: boolean;
    lastLoginAt?: string | null;
    fullName: string;
    specialization?: string | null; // Agent
    level?: number | null; // Agent
    isAvailable?: boolean | null; // Agent
};

export type ApiListResponse<T> = {
    message?: string;
    data: { total: number; page: number; pageSize: number; items: T[] };
};

export async function listUsers(params?: { page?: number; pageSize?: number; q?: string }) {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 50;
    const q = params?.q ?? undefined;
    const res = await api.get<ApiListResponse<ApiUser>>("/users", { params: { page, pageSize, q } });
    return res.data.data;
}

export async function createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userType: "Customer" | "Agent" | "Admin";
    department?: string; // Customer
    specialization?: string; // Agent
    level?: number; // Agent
    isAvailable?: boolean; // Agent
    isActive?: boolean;
}) {
    const res = await api.post<ApiResponse<ApiUser>>("/users", input);
    return res.data.data;
}
