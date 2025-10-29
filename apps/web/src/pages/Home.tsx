import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

export default function HomePage() {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/app');
    };

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle className="text-center">Вход в InterviewAI</CardTitle>
            </CardHeader>
            <CardContent>
                <Button onClick={handleLogin} className="w-full">
                    Войти
                </Button>
            </CardContent>
        </Card>
    );
}
