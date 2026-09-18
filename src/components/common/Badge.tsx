import { titleCase } from '@/utils/formatters';

type BadgeTone = 'pending' | 'approved' | 'rejected' | 'review' | 'verified' | 'neutral';

const TONE_MAP: Record<string, BadgeTone> = {
  PENDING: 'pending',
  UNDER_REVIEW: 'review',
  APPROVED: 'approved',
  VERIFIED: 'approved',
  REJECTED: 'rejected',
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  review: 'bg-blue-50 text-blue-700 ring-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function Badge({ status }: { status: string }) {
  const tone = TONE_MAP[status] ?? 'neutral';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {titleCase(status)}
    </span>
  );
}
