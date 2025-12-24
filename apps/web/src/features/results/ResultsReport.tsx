import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronRight, Copy, Check } from 'lucide-react';
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface ResultsReportProps { report: FullReport; }

export const ResultsReport = ({ report }: ResultsReportProps) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    let sectionCounter = 1;

    const getRecommendationClass = (rec: string) => {
        const r = rec.toLowerCase();
        if (r.includes('strong hire')) return 'bg-green-600 hover:bg-green-700 text-white border-none';
        if (r.includes('no hire')) return 'bg-red-600 hover:bg-red-700 text-white border-none';
        if (r.includes('consider')) return 'bg-yellow-500 hover:bg-yellow-600 text-white border-none';
        return 'bg-blue-600 hover:bg-blue-700 text-white border-none';
    };

    const getGradeClass = (grade: string) => {
        const g = grade.toLowerCase();
        if (g === 'excellent') return 'bg-green-100 text-green-800 border-green-200';
        if (g === 'good') return 'bg-blue-100 text-blue-800 border-blue-200';
        if (g === 'moderate') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (g === 'weak') return 'bg-red-100 text-red-800 border-red-200';
        return '';
    };

    const getMatchClass = (match: string) => {
        const m = match.toLowerCase();
        if (m === 'high') return 'bg-green-500 hover:bg-green-600 text-white border-none';
        if (m === 'medium') return 'bg-yellow-500 hover:bg-yellow-600 text-white border-none';
        if (m === 'low') return 'bg-red-500 hover:bg-red-600 text-white border-none';
        return '';
    };

    const handleCopyId = async () => {
        if (!report.interviewId) return;
        try {
            await navigator.clipboard.writeText(report.interviewId);
            setIsCopied(true);
            toast.success('ID скопирован в буфер обмена');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) { toast.error('Не удалось скопировать ID'); }
    };

    const handleExport = async () => {
        setIsExporting(true);

        toast.promise(exportResultsPdf(report), {
            loading: 'Генерация PDF...',
            success: () => {
                setIsExporting(false);
                return 'PDF успешно загружен';
            },
            error: (err) => {
                setIsExporting(false);
                return `Ошибка экспорта: ${err.message}`;
            },
        });
    };

    return (
        <Card className="mt-6 border-border overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">
                        {report.cvSummary ? `Фидбек на кандидата: ${report.cvSummary.fullName}` : 'Фидбек на кандидата'}
                    </CardTitle>
                    <div className="flex items-center gap-4">
                        {report.interviewId && (
                            <button
                                onClick={handleCopyId}
                                className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors outline-none"
                                title="Нажмите, чтобы скопировать ID"
                            >
                                <span className="font-medium">Job ID</span>
                                {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </button>
                        )}
                        <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm">
                            {isExporting ? 'Экспорт...' : <><Download className="w-4 h-4 mr-2" /> Скачать PDF</>}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Accordion type="multiple" defaultValue={['item-conclusion', 'item-ai-summary']} className="w-full">
                    <AccordionItem value="item-ai-summary" className="border-b px-6">
                        <AccordionTrigger className="hover:no-underline py-4">
                            <span className="text-lg font-bold">AI Summary</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2 text-sm">
                            <p className="text-muted-foreground mb-4 leading-relaxed">{report.aiSummary.overallSummary}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
                                <div className="space-y-2">
                                    <p className="font-semibold text-foreground flex items-center">
                                        <ChevronRight className="w-4 h-4 text-green-500 mr-1" /> Сильные стороны
                                    </p>
                                    <ul className="space-y-1 ml-5 text-muted-foreground list-disc">
                                        {report.aiSummary.keyStrengths.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-semibold text-foreground flex items-center">
                                        <ChevronRight className="w-4 h-4 text-amber-500 mr-1" /> Зоны роста
                                    </p>
                                    <ul className="space-y-1 ml-5 text-muted-foreground list-disc">
                                        {report.aiSummary.keyWeaknesses.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {report.cvSummary && (
                        <AccordionItem value="item-cv" className="border-b px-6">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <span className="text-lg font-bold">{sectionCounter++}. Информация из CV</span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 pt-2 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-muted-foreground pl-2">
                                    <p>• <b>Имя:</b> {report.cvSummary.fullName}</p>
                                    <p>• <b>Опыт:</b> {report.cvSummary.yearsOfExperience} лет</p>
                                    <p>• <b>Локация:</b> {report.cvSummary.location || 'Не указана'}</p>
                                    <p className="sm:col-span-2">• <b>Навыки:</b> {report.cvSummary.skills.join(', ')}</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    <AccordionItem value="item-tech" className="border-b px-6">
                        <AccordionTrigger className="hover:no-underline py-4">
                            <span className="text-lg font-bold">{sectionCounter++}. Техническая оценка</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2 text-sm">
                            <p className="text-muted-foreground mb-4 italic pl-2 leading-relaxed">{report.technicalAssessment.summary}</p>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[200px]">Тема</TableHead>
                                            <TableHead className="w-[120px]">Оценка</TableHead>
                                            <TableHead>Комментарий ИИ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.technicalAssessment.topicAssessments.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{item.topic}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`font-normal ${getGradeClass(item.grade)}`}>
                                                        {item.grade}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{item.summary}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {report.languageAssessment && (
                        <AccordionItem value="item-lang" className="border-b px-6">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <span className="text-lg font-bold">{sectionCounter++}. Оценка языка</span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 pt-2 text-sm">
                                {report.languageAssessment.assessmentSkipped ? (
                                    <p className="text-muted-foreground pl-2 italic">Анализ языка пропущен: {report.languageAssessment.reason || 'Нет данных'}</p>
                                ) : (
                                    <div className="space-y-4 pl-2">
                                        <p className="text-muted-foreground">{report.languageAssessment.summary}</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Уровень', value: report.languageAssessment.overallLevel, primary: true },
                                                { label: 'Беглость', value: report.languageAssessment.fluency },
                                                { label: 'Словарь', value: report.languageAssessment.vocabulary },
                                                { label: 'Произношение', value: report.languageAssessment.pronunciation }
                                            ].map((box, i) => (
                                                <div key={i} className="p-3 border rounded-md bg-muted/20">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold mb-1 opacity-70">{box.label}</p>
                                                    <p className={`font-semibold ${box.primary ? 'text-primary' : ''}`}>{box.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    <AccordionItem value="item-values" className="border-b px-6">
                        <AccordionTrigger className="hover:no-underline py-4">
                            <span className="text-lg font-bold">{sectionCounter++}. Соответствие ценностям</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2 text-sm">
                            <p className="text-muted-foreground mb-4 pl-2">{report.valuesFit.overallSummary}</p>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[30%]">Ценность</TableHead>
                                            <TableHead className="w-[15%] text-center">Соответствие</TableHead>
                                            <TableHead>Доказательства / Цитаты</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.valuesFit.assessedValues.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{item.value}</TableCell>
                                                <TableCell className="text-center capitalize">
                                                    <Badge className={`font-normal ${getMatchClass(item.match)}`}>
                                                        {item.match}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground italic text-xs leading-relaxed">"{item.evidence}"</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-conclusion" className="border-none px-6">
                        <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-4">
                                <span className="text-lg font-bold">{sectionCounter++}. Финальное заключение</span>
                                <Badge className={getRecommendationClass(report.overallConclusion.recommendation)}>
                                    {report.overallConclusion.recommendation}
                                </Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-8 pt-2 text-sm">
                            <div className="pl-2 space-y-6">
                                <div className="p-4 bg-muted/30 rounded-lg border border-primary/10">
                                    <h4 className="font-bold mb-2">Обоснование:</h4>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.overallConclusion.finalJustification}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <p className="font-bold text-green-600 flex items-center"><ChevronRight className="w-4 h-4 mr-1" /> Плюсы кандидата</p>
                                        <ul className="space-y-2 ml-4 text-muted-foreground list-disc">
                                            {report.overallConclusion.keyPositives.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="font-bold text-destructive flex items-center"><ChevronRight className="w-4 h-4 mr-1" /> Риски и опасения</p>
                                        <ul className="space-y-2 ml-4 text-muted-foreground list-disc">
                                            {report.overallConclusion.keyConcerns.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
};
