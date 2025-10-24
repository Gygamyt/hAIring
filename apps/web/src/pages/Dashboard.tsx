import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Панель управления</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>Вы успешно вошли в приложение!</p>
                <p>Здесь будет основная логика (анализ, подготовка и т.д.).</p>
                <Button asChild variant="outline">
                    <Link to="/">Выйти (на Home)</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
