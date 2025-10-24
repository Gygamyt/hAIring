import { useRoutes } from 'react-router-dom';
import { appRoutes } from "@/routes";

function App() {
    return useRoutes(appRoutes);
}

export default App;
