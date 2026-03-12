import { LABELS } from '@/config/labels';
import { DiagnosticsContent } from './DiagnosticsContent';

export default function DiagnosticsPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">{LABELS.pages.diagnostics}</h1>
      <DiagnosticsContent />
    </div>
  );
}
