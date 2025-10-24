import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PreparationTab } from '@/features/preparation/PreparationTab';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function ResultsTabPlaceholder() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Анализ результатов (Видео)</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Здесь будет логика анализа видео-интервью.</p>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
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
                <TabsContent value="preparation" className="mt-4">
                    <PreparationTab />
                </TabsContent>

                {/* Вкладка 2: Анализ */}
                <TabsContent value="results" className="mt-4">
                    <ResultsTabPlaceholder />
                </TabsContent>
            </Tabs>
        </div>
    );
}
