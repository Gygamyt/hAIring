import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PreparationTab } from '@/features/preparation/PreparationTab';
import { ResultsTab } from '@/features/results/ResultsTab';
import { usePollAnalysis } from '@/api/usePollAnalysis';
import { ResultsAnalysisResponse } from '@/types/results.types';
import { RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function DashboardPage() {
    const queryClient = useQueryClient();

    const [jobId, setJobId] = useState<string | null>(() => {
        return localStorage.getItem('hAIring_active_job_id');
    });

    const [persistedReport, setPersistedReport] = useState<ResultsAnalysisResponse | undefined>(() => {
        const saved = localStorage.getItem('hAIring_last_report');
        return saved ? JSON.parse(saved) : undefined;
    });

    const {
        data: jobData,
        isFetching: isPolling,
        error: pollError
    } = usePollAnalysis(jobId);

    const status = jobData?.status?.toLowerCase();

    useEffect(() => {
        if (jobId) {
            localStorage.setItem('hAIring_active_job_id', jobId);
        }
    }, [jobId]);

    useEffect(() => {
        if (status === 'completed' && jobData?.result) {
            setPersistedReport(jobData.result);
            localStorage.setItem('hAIring_last_report', JSON.stringify(jobData.result));
        }
    }, [status, jobData]);

    const analysisReport = (status === 'completed' && jobData?.result)
        ? jobData.result
        : persistedReport;

    const analysisError =
        status === 'failed'
            ? new Error(jobData?.error || 'Неизвестная ошибка бэкенда')
            : pollError;

    const handleReset = () => {
        if (window.confirm('Вы уверены, что хотите очистить результаты и начать новый анализ?')) {
            localStorage.removeItem('hAIring_active_job_id');
            localStorage.removeItem('hAIring_last_report');
            setJobId(null);
            setPersistedReport(undefined);
            queryClient.removeQueries({ queryKey: ['analysisJob'] });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">Панель управления</h1>
                    <p className="text-sm text-muted-foreground">
                        Управляйте подготовкой и анализом интервью в одном месте.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {(jobId || persistedReport) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Очистить всё
                        </Button>
                    )}
                    <Button asChild variant="outline" size="sm">
                        <Link to="/">Выйти</Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="results" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preparation">
                        Подготовка (CV + Фидбек)
                    </TabsTrigger>
                    <TabsTrigger value="results">
                        Анализ (Видео-интервью)
                    </TabsTrigger>
                </TabsList>

                {/* Вкладка 1: Подготовка */}
                <TabsContent
                    value="preparation"
                    className="mt-4 data-[state=inactive]:hidden"
                    forceMount
                >
                    <PreparationTab />
                </TabsContent>

                {/* Вкладка 2: Анализ */}
                <TabsContent
                    value="results"
                    className="mt-4 data-[state=inactive]:hidden"
                    forceMount
                >
                    <ResultsTab
                        isPolling={isPolling}
                        jobStatus={status}
                        analysisData={analysisReport}
                        analysisError={analysisError}
                        onStartAnalysis={setJobId}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
