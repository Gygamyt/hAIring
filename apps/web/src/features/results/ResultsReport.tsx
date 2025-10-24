import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { FullReport } from '@/types/results.types';
import { exportResultsPdf } from '@/lib/resultsPdf';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
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

interface ResultsReportProps {
    report: FullReport;
}


export const ResultsReport = ({ report }: ResultsReportProps) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        toast.info('Генерация PDF...', {
            description: 'Это может занять несколько секунд...',
        });
        try {
            await exportResultsPdf(report);
        } catch (error) {
            console.error('Ошибка генерации PDF:', error);
            toast.error('Ошибка генерации PDF', {
                description: (error as Error).message,
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card className="mt-6 border-border">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">
                        Фидбек на кандидата {report.cvSummary.fullName}
                    </CardTitle>
                    <Button onClick={handleExport} disabled={isExporting} variant="outline">
                        {isExporting ? (
                            'Экспорт...'
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" /> Скачать PDF
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 text-sm">
                <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        AI Summary
                    </h3>
                    <p className="text-muted-foreground mb-3">
                        {report.aiSummary.overallSummary}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                        <div>
                            <p className="font-semibold text-foreground/90">Сильные стороны:</p>
                            <ul className="list-disc list-inside ml-4 text-muted-foreground">
                                {report.aiSummary.keyStrengths.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground/90">Зоны роста:</p>
                            <ul className="list-disc list-inside ml-4 text-muted-foreground">
                                {report.aiSummary.keyWeaknesses.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        1. Информация о кандидате (из CV)
                    </h3>
                    <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>
                            • <b>Имя:</b> {report.cvSummary.fullName}
                        </p>
                        <p>
                            • <b>Опыт:</b> {report.cvSummary.yearsOfExperience} лет
                        </p>
                        <p>
                            • <b>Локация:</b> {report.cvSummary.location}
                        </p>
                        <p>
                            • <b>Навыки:</b> {report.cvSummary.skills.join(', ')}
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        2. Техническая оценка
                    </h3>
                    <p className="text-muted-foreground mb-3">
                        {report.technicalAssessment.summary}
                    </p>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Тема</TableHead>
                                    <TableHead>Оценка</TableHead>
                                    <TableHead>Комментарий</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.technicalAssessment.topicAssessments.map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{item.topic}</TableCell>
                                        <TableCell>{item.grade}</TableCell>
                                        <TableCell>{item.summary}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        3. Оценка языка
                    </h3>
                    <p className="text-muted-foreground mb-2">
                        {report.languageAssessment.summary}
                    </p>
                    <div className="pl-4 space-y-1 text-muted-foreground">
                        <p>
                            • <b>Уровень:</b> {report.languageAssessment.overallLevel}
                        </p>
                        <p>
                            • <b>Беглость:</b> {report.languageAssessment.fluency}
                        </p>
                        <p>
                            • <b>Словарь:</b> {report.languageAssessment.vocabulary}
                        </p>
                    </div>
                </div>

                {/* --- Values Fit --- */}
                <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        4. Соответствие ценностям
                    </h3>
                    <p className="text-muted-foreground mb-3">
                        {report.valuesFit.overallSummary}
                    </p>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30%]">Ценность</TableHead>
                                    <TableHead className="w-[15%]">Соответствие</TableHead>
                                    <TableHead>Комментарий</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.valuesFit.assessedValues.map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{item.value}</TableCell>
                                        <TableCell>{item.match}</TableCell>
                                        <TableCell>{item.evidence}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* --- Overall Conclusion --- */}
                <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        5. Заключение
                    </h3>
                    <div className="pl-4 space-y-3">
                        <p className="text-lg text-foreground">
                            <b>Рекомендация: {report.overallConclusion.recommendation}</b>
                        </p>
                        <p className="text-muted-foreground">
                            {report.overallConclusion.finalJustification}
                        </p>

                        <div>
                            <p className="font-semibold text-foreground/90">
                                Ключевые позитивные моменты:
                            </p>
                            <ul className="list-disc list-inside ml-4 text-muted-foreground">
                                {report.overallConclusion.keyPositives.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="font-semibold text-foreground/90">
                                Ключевые опасения:
                            </p>
                            <ul className="list-disc list-inside ml-4 text-muted-foreground">
                                {report.overallConclusion.keyConcerns.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
