import { useQuery } from '@tanstack/react-query';
import { JobStatusResponse } from '@/types/results.types';

const fetchJobStatus = async (
    jobId: string,
): Promise<JobStatusResponse> => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const res = await fetch(`${API_BASE_URL}/api/results/status/${jobId}`);

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Ошибка опроса статуса задачи');
    }
    return res.json();
};

export const usePollAnalysis = (jobId: string | null) => {
    return useQuery({
        queryKey: ['analysisJob', jobId],
        queryFn: () => fetchJobStatus(jobId!),
        enabled: !!jobId,

        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        // Логика остановки опроса:
        // Мы передаем функцию в refetchInterval.
        // Она будет вызвана ПОСЛЕ каждого успешного запроса.
        refetchInterval: (query) => {
            // 1. Получаем данные из query state
            const data = query.state.data as JobStatusResponse | undefined;
            if (!data) return 5000; // Данных еще нет, продолжаем опрос

            // 2. Проверяем статус в нижнем регистре
            const status = data.status.toLowerCase();
            if (status === 'completed' || status === 'failed') {
                return false; // ОСТАНОВИТЬ ОПРОС
            }

            // 3. Во всех остальных случаях - продолжаем
            return 5000;
        },
        refetchIntervalInBackground: true,
        // (Старый queryFnData убран, т.к. это синтаксис v4, а refetchInterval-функция - v5)
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
    });
};
