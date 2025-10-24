// src/features/preparation/PreparationResults.tsx
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHead,
    TableRow,
} from '@/components/ui/table';
import { StatusIcon } from '@/components/shared/StatusIcon';
import { Report } from '@/types/preparation.types';
import { exportPreparationPdf } from '@/lib/preparationPdf';
import { toast } from 'sonner';

interface PreparationResultsProps {
    report: Report;
}

export const PreparationResults = ({ report }: PreparationResultsProps) => {

    const handleExport = async () => {
        toast.info('Генерация PDF...', {
            description: 'Это может занять несколько секунд...',
        });
        try {
            await exportPreparationPdf(report);
        } catch (error) {
            console.error('Ошибка генерации PDF:', error);
            toast.error('Ошибка генерации PDF', {
                description: (error as Error).message,
            });
        }
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Результаты анализа</CardTitle>
                    <Button onClick={handleExport} variant="outline">
                        Экспорт в PDF
                    </Button>
                </div>
                <CardDescription>
                    {`Профиль: ${report.candidate_profile} (${
                        report.first_name || ''
                    } ${report.last_name || ''})`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <h3 className="font-bold text-lg mb-2">
                    Соответствие ключевым критериям
                </h3>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Критерий</TableHead>
                                <TableHead className="w-[15%] text-center">
                                    Соответствие
                                </TableHead>
                                <TableHead>Пояснение</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {report.matching_table.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.criterion}</TableCell>
                                    <TableCell className="text-center">
                                        <StatusIcon status={item.match} />
                                    </TableCell>
                                    <TableCell>{item.comment}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Общий вывод */}
                <h3 className="font-bold text-lg mt-4 mb-2">Общий вывод</h3>
                <p className="text-sm text-foreground/90">
                    {report.conclusion.summary}
                </p>

                {/* Рекомендации */}
                <h3 className="font-bold text-lg mt-4 mb-2">
                    Рекомендации по развитию
                </h3>
                <p className="text-sm text-foreground/90">
                    {report.conclusion.recommendations}
                </p>

                {/* Темы для интервью */}
                <h3 className="font-bold text-lg mt-4 mb-2">
                    Темы для технического интервью
                </h3>
                <ul className="list-disc list-inside text-sm space-y-1 text-foreground/90">
                    {report.conclusion.interview_topics.map(
                        (topic, index) => (
                            <li key={index}>{topic}</li>
                        )
                    )}
                </ul>

                {/* Соответствие ценностям */}
                <h3 className="font-bold text-lg mt-4 mb-2">
                    Соответствие ценностям компании
                </h3>
                <p className="text-sm text-foreground/90">
                    {report.conclusion.values_assessment}
                </p>
            </CardContent>
        </Card>
    );
};
