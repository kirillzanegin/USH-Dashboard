import { LABELS } from '@/config/labels';
import { OverviewContent } from './OverviewContent';

export default function OverviewPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">{LABELS.pages.overview}</h1>
      <OverviewContent />
    </div>
  );
}
