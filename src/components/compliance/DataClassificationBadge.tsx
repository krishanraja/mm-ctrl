import { cn } from '@/lib/utils';

type ClassificationLevel = 'public' | 'internal' | 'confidential' | 'restricted';

interface DataClassificationBadgeProps {
  level: ClassificationLevel;
  className?: string;
}

const config: Record<ClassificationLevel, { label: string; colors: string }> = {
  public: {
    label: 'Public',
    colors: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  internal: {
    label: 'Internal',
    colors: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  confidential: {
    label: 'Confidential',
    colors: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  restricted: {
    label: 'Restricted',
    colors: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
};

export function DataClassificationBadge({ level, className }: DataClassificationBadgeProps) {
  const { label, colors } = config[level];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border',
        colors,
        className
      )}
    >
      {label}
    </span>
  );
}
