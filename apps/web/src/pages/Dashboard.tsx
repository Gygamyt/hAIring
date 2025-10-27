import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PreparationTab } from '@/features/preparation/PreparationTab';
import { ResultsTab } from '@/features/results/ResultsTab';
import { usePollAnalysis } from '@/api/usePollAnalysis';

export default function DashboardPage() {
    const [jobId, setJobId] = useState<string | null>(null);
    const {
        data: jobData,
        isFetching: isPolling,
        error: pollError // Это ошибка самого useQuery (e.g. сеть)
    } = usePollAnalysis(jobId);

    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    const status = jobData?.status?.toLowerCase(); // 'downloading', 'processing', 'completed', etc.

    const analysisReport =
        status === 'completed' && jobData?.result
            ? jobData.result
            : undefined;

    const analysisError =
        status === 'failed'
            ? new Error(jobData?.error || 'Неизвестная ошибка бэкенда')
            : pollError;
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Панель управления</h1>
                <Button asChild variant="outline">
                    <Link to="/">Выйти (на Home)</Link>
                </Button>
            </div>

            <Tabs defaultValue="preparation" className="w-full">
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
                        analysisData={analysisReport} // <-- Передаем 'result'
                        analysisError={analysisError}
                        onStartAnalysis={setJobId}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
