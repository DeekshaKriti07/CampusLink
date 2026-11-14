import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import '@fontsource/dm-mono/latin-400.css';
import '@fontsource/dm-mono/latin-500.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);