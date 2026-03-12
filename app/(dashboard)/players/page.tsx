import { LABELS } from '@/config/labels';
import { PlayersContent } from './PlayersContent';

export default function PlayersPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">{LABELS.pages.players}</h1>
      <PlayersContent />
    </div>
  );
}
