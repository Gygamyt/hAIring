// src/layouts/AuthLayout.tsx
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
            <Outlet /> {/* Здесь будет рендериться Home.tsx (будущий Login.tsx) */}
        </div>
    );
}
