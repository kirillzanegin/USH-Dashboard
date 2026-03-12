import { LABELS } from '@/config/labels';
import { PlayerDetailContent } from './PlayerDetailContent';

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">{LABELS.pages.players}</h1>
      <PlayerDetailContent id={id} />
    </div>
  );
}
