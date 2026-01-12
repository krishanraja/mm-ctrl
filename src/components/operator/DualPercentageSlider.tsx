import React, { useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { haptic } from '@/utils/haptic';

interface DualPercentageSliderProps {
  revenuePercentage: number;
  timePercentage: number;
  onRevenueChange: (value: number) => void;
  onTimeChange: (value: number) => void;
  className?: string;
}

export const DualPercentageSlider: React.FC<DualPercentageSliderProps> = ({
  revenuePercentage,
  timePercentage,
  onRevenueChange,
  onTimeChange,
  className = ''
}) => {
  // Ensure percentages sum to 100%
  useEffect(() => {
    const total = revenuePercentage + timePercentage;
    if (total !== 100) {
      // Auto-balance: adjust the one that wasn't just changed
      // This is a simple heuristic - in practice, we'll handle this in the parent
    }
  }, [revenuePercentage, timePercentage]);

  const handleRevenueChange = (value: number[]) => {
    const newRevenue = Math.round(value[0] / 5) * 5; // Snap to 5% increments
    const newTime = 100 - newRevenue;
    haptic.medium();
    onRevenueChange(newRevenue);
    onTimeChange(newTime);
  };

  const handleTimeChange = (value: number[]) => {
    const newTime = Math.round(value[0] / 5) * 5; // Snap to 5% increments
    const newRevenue = 100 - newTime;
    haptic.medium();
    onTimeChange(newTime);
    onRevenueChange(newRevenue);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Revenue Percentage */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Revenue %</Label>
          <span className="text-sm font-semibold text-primary">{revenuePercentage}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[revenuePercentage]}
          onValueChange={handleRevenueChange}
          className="w-full touch-none"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Time Percentage */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Time %</Label>
          <span className="text-sm font-semibold text-primary">{timePercentage}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[timePercentage]}
          onValueChange={handleTimeChange}
          className="w-full touch-none"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Summary */}
      <div className="pt-1 border-t">
        <div className="flex items-center justify-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Total:</span>
          <span className={`font-semibold ${revenuePercentage + timePercentage === 100 ? 'text-primary' : 'text-destructive'}`}>
            {revenuePercentage + timePercentage}%
          </span>
        </div>
      </div>
    </div>
  );
};
