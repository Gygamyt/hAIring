import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Video, Upload, Brain, FileJson, FileText,
    Building, UserCheck, ClipboardList, BookUser, Settings2, FileCheck, X
} from 'lucide-react';
import { toast } from 'sonner';
import { StartAnalysisParams } from '@/api/useStartAnalysis';

const formSchema = z.object({
    videoLink: z.string().url('Неверная ссылка на видео'),
    cvFile: z.instanceof(File, { message: 'Необходимо загрузить CV кандидата' }),
    competencyMatrixLink: z.string().url('Неверная ссылка'),
    departmentValuesLink: z.string().url('Неверная ссылка'),
    employeePortraitLink: z.string().url('Неверная ссылка'),
    jobRequirementsLink: z.string().url('Неверная ссылка'),
});

type FormValues = z.infer<typeof formSchema>;

interface ResultsFormProps {
    onSubmit: (data: StartAnalysisParams) => void;
    isLoading: boolean;
}

export const ResultsForm = ({ onSubmit, isLoading }: ResultsFormProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [attachProgress, setAttachProgress] = useState(0);
    const [isAttaching, setIsAttaching] = useState(false);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            videoLink: '',
            cvFile: undefined as any,
            competencyMatrixLink: 'https://docs.google.com/spreadsheets/d/1VzwMPfgBn6xB0xKnJ-DD-0bkBQDOvbjihwuT6FKo8qY/edit?usp=drive_link',
            departmentValuesLink: 'https://docs.google.com/spreadsheets/d/1KX1ihfOTm7OGEI942cEii4dj9T8VvtmUhisE49WYAUo/edit?usp=drive_link',
            employeePortraitLink: 'https://docs.google.com/spreadsheets/d/1hIksOP9zcBy5fFZ12SyA_lc6xsL0EXHPC2Y86YykVPI/edit?usp=drive_link',
            jobRequirementsLink: 'https://docs.google.com/spreadsheets/d/1JOYzYmAtaPzHHuN2CvdrCXn_L30bBNlikJ5K0mRt-HE/edit?usp=drive_link',
        },
    });

    const cvFile = watch('cvFile');

    const simulateAttachment = (file: File) => {
        setIsAttaching(true);
        setAttachProgress(0);
        const interval = setInterval(() => {
            setAttachProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsAttaching(false);
                    setValue('cvFile', file, { shouldValidate: true });
                    return 100;
                }
                return prev + 20;
            });
        }, 40);
    };

    const handleFileAction = (file: File) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (file && allowedTypes.includes(file.type)) {
            simulateAttachment(file);
        } else {
            toast.error('Ошибка формата', { description: 'Разрешены только .pdf, .docx, .txt' });
        }
    };

    const removeFile = (e: React.MouseEvent) => {
        e.preventDefault();
        setValue('cvFile', undefined as any, { shouldValidate: true });
        setAttachProgress(0);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">

                <Card className={errors.cvFile ? 'border-destructive shadow-sm' : 'shadow-sm'}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-lg">
                            <div className="flex items-center space-x-2">
                                <BookUser className="w-5 h-5 text-primary" />
                                <span>CV кандидата <span className="text-destructive">*</span></span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!cvFile && !isAttaching ? (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files?.[0]) handleFileAction(e.dataTransfer.files[0]);
                                }}
                                className={`border-2 border-dashed rounded-lg p-9 text-center transition-all ${
                                    isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/40'
                                }`}
                            >
                                <Controller
                                    name="cvFile"
                                    control={control}
                                    render={() => (
                                        <Input
                                            id="cv-input" type="file" multiple={false}
                                            accept=".pdf,.docx,.txt" className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleFileAction(e.target.files[0])}
                                        />
                                    )}
                                />
                                <label htmlFor="cv-input" className="cursor-pointer block">
                                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                                    <p className="text-sm font-medium">Загрузить файл</p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX или TXT</p>
                                </label>
                            </div>
                        ) : (
                            <div className="border-2 border-primary/20 bg-primary/5 rounded-lg p-6 relative">
                                {isAttaching ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>Обработка файла...</span>
                                            <span>{attachProgress}%</span>
                                        </div>
                                        <Progress value={attachProgress} className="h-1.5" />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <div className="bg-primary/10 p-2 rounded-md">
                                                <FileCheck className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-semibold truncate">{cvFile?.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">
                                                    {(cvFile?.size / 1024).toFixed(0)} KB • Готов к анализу
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            onClick={removeFile} className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                        {errors.cvFile && <p className="text-destructive text-[11px] mt-2 font-medium">{errors.cvFile.message}</p>}
                    </CardContent>
                </Card>

                <Card className={errors.videoLink ? 'border-destructive shadow-sm' : 'shadow-sm'}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                            <Video className="w-5 h-5 text-primary" />
                            <span>Видео интервью <span className="text-destructive">*</span></span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="video-link" className="text-xs font-semibold text-muted-foreground uppercase">Ссылка Google Drive</Label>
                            <Controller
                                name="videoLink"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="video-link" type="url"
                                        placeholder="https://drive.google.com/file/d/..."
                                        {...field}
                                        className={errors.videoLink ? 'border-destructive' : ''}
                                    />
                                )}
                            />
                            {errors.videoLink && <p className="text-destructive text-[11px] font-medium">{errors.videoLink.message}</p>}
                        </div>
                        <div className="p-3 bg-muted/40 rounded border border-dashed text-[10px] text-muted-foreground flex gap-2">
                            <Settings2 className="w-3.5 h-3.5 shrink-0" />
                            <p>Видео не загружается напрямую. Укажите ссылку на файл, к которому у системы есть доступ.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2">
                    <Accordion type="single" collapsible className="w-full border rounded-lg bg-muted/5">
                        <AccordionItem value="additional" className="border-none">
                            <AccordionTrigger className="px-6 hover:no-underline py-3">
                                <div className="flex items-center space-x-2">
                                    <FileJson className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold">Справочные материалы (Только ссылки)</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-2">
                                <div className="grid md:grid-cols-2 gap-5">
                                    {[
                                        { id: 'm', label: 'Матрица компетенций', icon: FileText, name: 'competencyMatrixLink' },
                                        { id: 'v', label: 'Ценности департамента', icon: Building, name: 'departmentValuesLink' },
                                        { id: 'p', label: 'Портрет сотрудника', icon: UserCheck, name: 'employeePortraitLink' },
                                        { id: 'r', label: 'Требования к вакансии', icon: ClipboardList, name: 'jobRequirementsLink' }
                                    ].map((f) => (
                                        <div key={f.id} className="space-y-1.5">
                                            <Label htmlFor={f.id} className="text-[10px] font-bold uppercase opacity-60 flex items-center gap-1.5">
                                                <f.icon className="w-3 h-3" /> {f.label}
                                            </Label>
                                            <Controller name={f.name as any} control={control} render={({ field }) => <Input id={f.id} className="h-9 text-xs bg-background" {...field} />} />
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>

            <div className="text-center pt-2">
                <Button
                    type="submit"
                    disabled={isLoading || isAttaching}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-12 py-7 text-xl w-full md:w-auto shadow-xl group"
                >
                    {isLoading ? (
                        <><Brain className="w-7 h-7 mr-3 animate-spin" /> Анализ запущен...</>
                    ) : (
                        <><Brain className="w-7 h-7 mr-3 group-hover:rotate-12 transition-transform" /> Запустить AI-анализ</>
                    )}
                </Button>
            </div>
        </form>
    );
};
