import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StartAnalysisResponse } from '@/types/results.types';

export interface StartAnalysisParams {
    cvFile?: File | null;
    videoLink: string;
    competencyMatrixLink: string;
    departmentValuesLink: string;
    employeePortraitLink: string;
    jobRequirementsLink: string;
}

const startAnalysis = async (
    params: StartAnalysisParams,
): Promise<StartAnalysisResponse> => {
    const form = new FormData();
    if (params.cvFile) {
        form.append('cv_file', params.cvFile);
    }
    form.append('video_link', params.videoLink);
    form.append('competency_matrix_link', params.competencyMatrixLink);
    form.append('department_values_link', params.departmentValuesLink);
    form.append('employee_portrait_link', params.employeePortraitLink);
    form.append('job_requirements_link', params.jobRequirementsLink);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const res = await fetch(`${API_BASE_URL}/api/results/`, {
        method: 'POST',
        body: form,
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Не удалось запустить анализ');
    }

    return res.json();
};

export const useStartAnalysis = () => {
    return useMutation({
        mutationFn: startAnalysis,
        onSuccess: () => {
            toast.success('Задача принята', {
                description: 'Анализ запущен в фоновом режиме. Результат появится автоматически.',
            });
        },
        onError: (err: Error) => {
            toast.error('Ошибка', {
                description: `Не удалось запустить анализ: ${err.message}`,
            });
        },
    });
};
