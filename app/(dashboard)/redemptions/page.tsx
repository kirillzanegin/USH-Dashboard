import { LABELS } from '@/config/labels';
import { RedemptionsContent } from './RedemptionsContent';

export default function RedemptionsPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">{LABELS.pages.redemptions}</h1>
      <RedemptionsContent />
    </div>
  );
}
