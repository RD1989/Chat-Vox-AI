import { useState } from 'react';

const API_URL = '/api';

export const useApi = () => {
    const [loading, setLoading] = useState(false);

    const call = async (endpoint: string, method = 'GET', body: any = null) => {
        setLoading(true);
        const headers: any = {
            'Content-Type': 'application/json',
        };

        const token = localStorage.getItem('local_auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error: any) {
            console.error(`[API Error] ${endpoint}:`, error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { call, loading };
};
