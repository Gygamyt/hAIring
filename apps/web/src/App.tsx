import { useRoutes } from 'react-router-dom';
import { appRoutes } from './routes';
import { Toaster } from '@/components/ui/sonner';

function App() {
    const element = useRoutes(appRoutes);

    return (
        <>
            {element}
            <Toaster richColors closeButton />
        </>
    );
}

export default App;
