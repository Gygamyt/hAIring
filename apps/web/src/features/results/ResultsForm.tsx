import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Video, Upload, Brain, FileJson, FileText,
    Building, UserCheck, ClipboardList, BookUser
} from 'lucide-react';
import { toast } from 'sonner';
import { StartAnalysisParams } from '@/api/useStartAnalysis';

const formSchema = z.object({
    videoLink: z.string().url('Неверная ссылка на видео'),
    cvFile: z.instanceof(File).optional().nullable(),
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
            cvFile: null,
            competencyMatrixLink: 'https://docs.google.com/spreadsheets/d/1VzwMPfgBn6xB0xKnJ-DD-0bkBQDOvbjihwuT6FKo8qY/edit?usp=drive_link',
            departmentValuesLink: 'https://docs.google.com/spreadsheets/d/1KX1ihfOTm7OGEI942cEii4dj9T8VvtmUhisE49WYAUo/edit?usp=drive_link',
            employeePortraitLink: 'https://docs.google.com/spreadsheets/d/1hIksOP9zcBy5fFZ12SyA_lc6xsL0EXHPC2Y86YykVPI/edit?usp=drive_link',
            jobRequirementsLink: 'https://docs.google.com/spreadsheets/d/1JOYzYmAtaPzHHuN2CvdrCXn_L30bBNlikJ5K0mRt-HE/edit?usp=drive_link',
        },
    });

    const cvFile = watch('cvFile');

    const handleFileDrop = (file: File) => {
        if (
            file &&
            (file.type === 'application/pdf' ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'text/plain')
        ) {
            setValue('cvFile', file, { shouldValidate: true });
        } else {
            toast.error('Неверный тип файла', { description: 'Загрузите .txt, .pdf или .docx' });
        }
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFileDrop(e.target.files[0]);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BookUser className="w-5 h-5 text-primary" />
                            <span>CV кандидата (опционально)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                            } ${errors.cvFile ? 'border-destructive' : ''}`}
                        >
                            <Controller
                                name="cvFile"
                                control={control}
                                render={() => (
                                    <Input
                                        id="cv-upload-results" type="file"
                                        accept=".txt,.pdf,.docx" className="hidden"
                                        onChange={handleFileChange}
                                    />
                                )}
                            />
                            <label htmlFor="cv-upload-results" className="cursor-pointer">
                                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground mb-2">
                                    {cvFile ? cvFile.name : 'Нажмите или перетащите файл'}
                                </p>
                            </label>
                        </div>
                        {cvFile && <Badge variant="secondary" className="mt-3">✓ {cvFile.name} загружен</Badge>}
                        {errors.cvFile && <p className="text-destructive text-sm mt-1">{errors.cvFile.message}</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Video className="w-5 h-5 text-primary" />
                            <span>Видеозапись собеседования</span>
                        </CardTitle>
                        <CardDescription>
                            Файл с видеозаписью должен находиться в папке InterviewsRecords.
                            Путь: QA Common / QAHiringToInnowise / InterviewsRecords.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Label htmlFor="video-link">Ссылка на видео</Label>
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
                        {errors.videoLink && <p className="text-destructive text-sm">{errors.videoLink.message}</p>}
                    </CardContent>
                </Card>


                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FileJson className="w-5 h-5 text-accent" />
                            <span>Дополнительные материалы (Google Drive)</span>
                        </CardTitle>
                        <CardDescription>
                            Убедитесь, что у сервисного аккаунта есть доступ к этим файлам.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">

                        <div className="space-y-2">
                            <Label htmlFor="competency-matrix-link" className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>Матрица компетенций</span>
                            </Label>
                            <Controller
                                name="competencyMatrixLink"
                                control={control}
                                render={({ field }) => <Input id="competency-matrix-link" type="url" {...field} />}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department-values-link" className="flex items-center space-x-2">
                                <Building className="w-4 h-4" />
                                <span>Ценности департамента</span>
                            </Label>
                            <Controller
                                name="departmentValuesLink"
                                control={control}
                                render={({ field }) => <Input id="department-values-link" type="url" {...field} />}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employee-portrait-link" className="flex items-center space-x-2">
                                <UserCheck className="w-4 h-4" />
                                <span>Портрет сотрудника</span>
                            </Label>
                            <Controller
                                name="employeePortraitLink"
                                control={control}
                                render={({ field }) => <Input id="employee-portrait-link" type="url" {...field} />}
                            />
                        </div>
                        {/* Job Requirements */}
                        <div className="space-y-2">
                            <Label htmlFor="job-requirements-link" className="flex items-center space-x-2">
                                <ClipboardList className="w-4 h-4" />
                                <span>Требования к вакансии</span>
                            </Label>
                            <Controller
                                name="jobRequirementsLink"
                                control={control}
                                render={({ field }) => <Input id="job-requirements-link" type="url" {...field} />}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center pt-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg"
                    size="lg"
                >
                    {isLoading ? (
                        <><Brain className="w-6 h-6 mr-3 animate-spin" /> <span>Запуск...</span></>
                    ) : (
                        <><Brain className="w-6 h-6 mr-3" /> <span>Запустить AI-анализ</span></>
                    )}
                </Button>
            </div>
        </form>
    );
};
