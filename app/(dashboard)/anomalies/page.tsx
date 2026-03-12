import { LABELS } from '@/config/labels';
import { AnomaliesContent } from './AnomaliesContent';

export default function AnomaliesPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">{LABELS.pages.anomalies}</h1>
      <AnomaliesContent />
    </div>
  );
}
