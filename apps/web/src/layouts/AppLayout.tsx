import { Outlet } from 'react-router-dom';

export function AppLayout() {
    return (
        <div className="min-h-screen bg-background">
            {/* TODO: Добавить Header/Sidebar */}
            <main className="container mx-auto p-4">
                <Outlet />
            </main>
        </div>
    );
}
