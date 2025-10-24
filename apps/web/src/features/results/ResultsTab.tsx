import { useStartAnalysis, StartAnalysisParams } from '@/api/useStartAnalysis';
import { ResultsAnalysisResponse } from '@/types/results.types';
import { ResultsForm } from './ResultsForm';
import { ResultsReport } from './ResultsReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultsTabProps {
    isPolling: boolean;
    jobStatus?: string;
    analysisData?: ResultsAnalysisResponse;
    analysisError?: Error | null;
    onStartAnalysis: (jobId: string | null) => void;
}

export const ResultsTab = ({
                               isPolling,
                               jobStatus,
                               analysisData,
                               analysisError,
                               onStartAnalysis,
                           }: ResultsTabProps) => {

    const { mutate: startAnalysis, isPending: isStarting } = useStartAnalysis();

    const handleSubmit = (formData: StartAnalysisParams) => {
        if (analysisData || analysisError) {
            onStartAnalysis(null);
        }

        startAnalysis(formData, {
            onSuccess: (data) => {
                onStartAnalysis(data.job_id);
            },
        });
    };

    // Мы считаем, что джоба "запущена", если:
    // 1. Идет самый первый POST-запрос (isStarting)
    // 2. ИЛИ у нас есть статус, и он НЕ 'completed' и НЕ 'failed'
    const isJobRunning = isStarting || (jobStatus && jobStatus !== 'completed' && jobStatus !== 'failed');

    // --- 5. ГЛАВНЫЙ ФИКС (СПИННЕР) ---
    // Показываем главный спиннер, если джоба запущена
    if (isJobRunning) {
        return (
            <div className="text-center py-20 flex flex-col items-center justify-center min-h-[50vh]">
                {/* Вот крутящийся спиннер */}
                <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />

                <p className="text-lg font-semibold mb-2 text-foreground">
                    {isStarting ? 'Запуск задачи...' : `Идет анализ... (Статус: ${jobStatus})`}
                </p>
                <p className="text-muted-foreground">
                    Это может занять от 3 до 10 минут. Можно переключить вкладку.
                </p>
            </div>
        );
    }
    // --- КОНЕЦ ФИКСА ---

    // Показываем ошибку
    if (analysisError) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center text-destructive">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Ошибка анализа
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Не удалось завершить анализ задачи.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {analysisError.message}
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        // Сбрасываем jobId, чтобы начать заново
                        onClick={() => onStartAnalysis(null)}
                    >
                        Сбросить и попробовать снова
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Показываем результат
    if (analysisData) {
        // ВНИМАНИЕ: Это будет КРАШИТЬСЯ, если ты не исправил DTO в ResultsReport.tsx
        return <ResultsReport report={analysisData.report} />;
    }

    // По умолчанию показываем форму
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Анализ Результатов Интервью</h2>
            <ResultsForm
                onSubmit={handleSubmit}
                isLoading={isStarting} // Спиннер в кнопке 'Запустить'
            />
        </div>
    );
};
