import { RouteObject } from 'react-router-dom';
import { AppLayout } from "@/layouts/AppLayout";
import DashboardPage from "@/pages/Dashboard";
import { AuthLayout } from "@/layouts/AuthLayout";
import HomePage from "@/pages/Home";

export const appRoutes: RouteObject[] = [
    {
        // Роуты "внутри" приложения (требуют логина в будущем)
        path: '/app',
        element: <AppLayout />,
        children: [
            {
                index: true,
                element: <DashboardPage />,
            },
            // Сюда пойдут другие страницы: /app/results, /app/preparation, etc.
        ],
    },
    {
        // Роуты "снаружи" (логин, регистрация)
        path: '/',
        element: <AuthLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
        ],
    },
    // TODO: Добавить 404 страницу
    // {
    //   path: '*',
    //   element: <NotFoundPage />,
    // }
];
