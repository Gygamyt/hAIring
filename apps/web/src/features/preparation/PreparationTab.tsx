import { useAnalyzePreparation } from '@/api/useAnalyzePreparation';
import { PreparationForm } from './PreparationForm';
import { PreparationResults } from './PreparationResults';
import { Progress } from '@/components/ui/progress';

export const PreparationTab = () => {
    // Наш кастомный хук React Query
    const { mutate, data, isPending, reset } = useAnalyzePreparation();

    const handleSubmit = (formData: {
        cvFile: File;
        feedbackText: string;
        requirementsLink: string;
    }) => {
        // Если уже есть старые данные, очищаем их перед новым запросом
        if (data) {
            reset();
        }
        mutate(formData);
    };

    return (
        <div className="container mx-auto p-4">
            {/* 1. Форма (передаем ей функцию 'handleSubmit' и статус загрузки) */}
            {!data && (
                <PreparationForm
                    onSubmit={handleSubmit}
                    isLoading={isPending}
                />
            )}

            {/* 2. Индикатор загрузки */}
            {isPending && (
                <div className="text-center py-10">
                    <p className="mb-4">Идет анализ... Это может занять несколько минут.</p>
                    {/* Прогресс-бар без 'value' будет анимироваться (indeterminate) */}
                    <Progress className="w-1/2 mx-auto" />
                </div>
            )}

            {/* 3. Результаты (показываем, когда загрузка завершена и есть данные) */}
            {data && !isPending && (
                <PreparationResults report={data.report} />
            )}
        </div>
    );
};
