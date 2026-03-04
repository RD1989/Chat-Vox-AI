import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/api";

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

export const useApi = () => {
    const [loading, setLoading] = useState(false);

    const request = useCallback(async <T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> => {
        setLoading(true);
        let data: T | null = null;
        let error: string | null = null;

        try {
            const url = `${API_URL}/${endpoint.replace(/^\//, "")}`;

            const response = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            });

            const contentType = response.headers.get("content-type");
            let result;

            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            } else {
                result = await response.text();
            }

            if (!response.ok) {
                throw new Error(
                    typeof result === "string" ? result : result.error || "Erro na requisição"
                );
            }

            data = result;
        } catch (err: any) {
            error = err.message;
            console.error(`[API Error] ${endpoint}:`, err);
            toast({
                title: "Erro na API",
                description: error,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }

        return { data, error, loading: false };
    }, []);

    return { request, loading };
};
