// src/components/onboarding/ProgressBar.tsx
interface ProgressBarProps {
  progress: number
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-900 h-1">
      <div
        className="h-full bg-[#00D9B6] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
