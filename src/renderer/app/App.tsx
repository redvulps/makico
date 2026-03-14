import { AppProviders } from './providers/AppProviders';
import { EditorPage } from '@/pages/EditorPage';

export function App() {
  return (
    <AppProviders>
      <EditorPage />
    </AppProviders>
  );
}
