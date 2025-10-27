import { useAnalyzePreparation } from '@/api/useAnalyzePreparation';
import { PreparationForm } from './PreparationForm';
import { PreparationResults } from './PreparationResults';
import { Loader2 } from 'lucide-react';

export const PreparationTab = () => {
    const { mutate, data, isPending, reset } = useAnalyzePreparation();

    const handleSubmit = (formData: {
        cvFile: File;
        feedbackText: string;
        requirementsLink: string;
    }) => {
        if (data) {
            reset();
        }
        mutate(formData);
    };

    return (
        <div className="container mx-auto p-4">
            {!data && !isPending && (
                <PreparationForm
                    onSubmit={handleSubmit}
                    isLoading={isPending}
                />
            )}

            {isPending && (
                <div className="text-center py-20 flex flex-col items-center justify-center min-h-[40vh]">
                    <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
                    <p className="text-lg font-semibold mb-2 text-foreground">
                        Идет анализ CV...
                    </p>
                    <p className="text-muted-foreground">
                        Это займет около 30 секунд.
                    </p>
                </div>
            )}

            {data && !isPending && (
                <PreparationResults report={data.report} />
            )}
        </div>
    );
};
