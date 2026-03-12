import { LABELS } from '@/config/labels';
import { PrizesContent } from './PrizesContent';

export default function PrizesPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">{LABELS.pages.prizes}</h1>
      <PrizesContent />
    </div>
  );
}
