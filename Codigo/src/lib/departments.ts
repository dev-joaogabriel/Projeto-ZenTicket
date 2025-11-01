import { api } from "./api";

export type Department = { id: number; name: string };

export async function listDepartments(): Promise<Department[]> {
    const res = await api.get<{ message?: string; data: Department[] }>("/departments");
    return res.data.data;
}
