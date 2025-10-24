import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Upload } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
    requirementsLink: z.string().url('Неверная ссылка на Google-таблицу'),
    feedbackText: z.string().min(1, 'Фидбэк не может быть пустым'),
    cvFile: z.instanceof(File, { message: 'Необходимо загрузить CV' }),
});

type PreparationFormValues = z.infer<typeof formSchema>;

interface PreparationFormProps {
    onSubmit: (data: PreparationFormValues) => void;
    isLoading: boolean;
}

export const PreparationForm = ({ onSubmit, isLoading }: PreparationFormProps) => {
    const [isDragging, setIsDragging] = useState(false);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<PreparationFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            requirementsLink: 'https://docs.google.com/spreadsheets/d/1JOYzYmAtaPzHHuN2CvdrCXn_L30bBNlikJ5K0mRt-HE/edit?usp=drive_link',
            feedbackText: '',
            cvFile: undefined,
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
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>Оценка кандидата</CardTitle>
                    <CardDescription>
                        Загрузите CV, добавьте текст от рекрутера и при необходимости
                        измените ссылку на требования для генерации отчета.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="cv-file">CV кандидата (.txt, .pdf, .docx)</Label>
                        <div
                            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mt-1.5 ${
                                isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                            } ${errors.cvFile ? 'border-destructive' : ''}`}
                        >
                            <Controller
                                name="cvFile"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="cv-file" type="file"
                                        accept=".txt,.pdf,.docx"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                )}
                            />
                            <label htmlFor="cv-file" className="cursor-pointer">
                                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    {cvFile ? cvFile.name : 'Нажмите или перетащите файл'}
                                </p>
                                {errors.cvFile && <p className="text-destructive text-sm mt-1">{errors.cvFile.message}</p>}
                            </label>
                        </div>
                    </div>

                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="feedback-text">Фидбек от рекрутера</Label>
                        <Controller
                            name="feedbackText"
                            control={control}
                            render={({ field }) => (
                                <Textarea
                                    id="feedback-text"
                                    placeholder="Скопируйте и вставьте сюда фидбэк..."
                                    {...field}
                                    className={errors.feedbackText ? 'border-destructive' : ''}
                                />
                            )}
                        />
                        {errors.feedbackText && <p className="text-destructive text-sm">{errors.feedbackText.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="requirements">Требования к кандидату</Label>
                        <Controller
                            name="requirementsLink"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="requirements"
                                    {...field}
                                    placeholder="Вставьте ссылку на Google-таблицу..."
                                    className={errors.requirementsLink ? 'border-destructive' : ''}
                                />
                            )}
                        />
                        {errors.requirementsLink && <p className="text-destructive text-sm">{errors.requirementsLink.message}</p>}
                    </div>
                    <CardDescription>
                        При изменении ссылки убедитесь, что документ является Google-таблицей...
                    </CardDescription>
                </CardContent>
            </Card>

            <div className="text-center pt-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg"
                    size="lg"
                >
                    {isLoading ? (
                        <> <Brain className="w-6 h-6 mr-3 animate-spin" /> <span>Обработка...</span> </>
                    ) : (
                        <> <Brain className="w-6 h-6 mr-3" /> <span>Запустить AI-анализ</span> </>
                    )}
                </Button>
            </div>
        </form>
    );
};
