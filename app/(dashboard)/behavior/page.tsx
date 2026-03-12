import { LABELS } from '@/config/labels';
import { BehaviorContent } from './BehaviorContent';

export default function BehaviorPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">{LABELS.pages.behavior}</h1>
      <BehaviorContent />
    </div>
  );
}
