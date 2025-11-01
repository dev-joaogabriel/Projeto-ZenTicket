import { api, ApiResponse } from "./api";

export type AiAnalyzeRequest = {
    title: string;
    description: string;
    doneActions?: string[];
    rejectedActions?: string[];
    priorSuggestions?: string[];
};

export type AiAnalyzeResponse = {
    suggestions: string[];
    predictedDepartmentId?: number | null;
    predictedDepartmentName?: string | null;
    confidence?: number | null;
    priorityHint?: string | null;
    rationale?: string | null;
    source?: string | null;
    nextAction?: string | null;
    followUpQuestions?: string[];
};

export async function analyzeTicket(req: AiAnalyzeRequest): Promise<AiAnalyzeResponse> {
    const res = await api.post<ApiResponse<AiAnalyzeResponse>>("/ai/analyze", req);
    return res.data.data;
}
