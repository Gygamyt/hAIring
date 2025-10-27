import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

export default function HomePage() {
    const navigate = useNavigate();

    const handleLogin = () => {
        // В будущем здесь будет логика входа
        // А пока просто переходим на /app
        navigate('/app');
    };

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Вход в InterviewAI</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-muted-foreground">
                    Это будущая страница входа.
                </p>
                <Button onClick={handleLogin} className="w-full">
                    Войти (Перейти в /app)
                </Button>
            </CardContent>
        </Card>
    );
}
