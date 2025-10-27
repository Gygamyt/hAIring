import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PreparationAnalysisResponse } from '@/types/preparation.types';

export interface AnalyzePreparationParams {
    cvFile: File;
    feedbackText: string;
    requirementsLink: string;
}

const analyzePreparation = async ({
                                      cvFile,
                                      feedbackText,
                                      requirementsLink,
                                  }: AnalyzePreparationParams): Promise<PreparationAnalysisResponse> => {

    const formData = new FormData();
    formData.append('cv_file', cvFile);
    formData.append('feedback_text', feedbackText);
    formData.append('requirements_link', requirementsLink);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const endpoint = `${API_BASE_URL}/api/prep/`;

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
    });

    const rawResponseText = await response.text();

    if (!response.ok) {
        try {
            const errorData = JSON.parse(rawResponseText);
            throw new Error(errorData.detail || 'Analyze failed');
        } catch {
            throw new Error(
                rawResponseText || `Server returned status ${response.status}`
            );
        }
    }

    return JSON.parse(rawResponseText);
};

export const useAnalyzePreparation = () => {
    return useMutation({
        mutationFn: analyzePreparation,
        onSuccess: (data) => {
            toast.success(data.message || 'Анализ успешно завершен.');
        },
        onError: (error: Error) => {
            console.error('Сырой ответ от сервера (Raw response):', error);
            toast.error('Ошибка анализа', {
                description: error.message,
            });
        },
    });
};
