"use client";

import { GrowthPhase, GROWTH_PHASES } from "@/types/record";

interface PhaseSelectorProps {
  value?: GrowthPhase;
  onChange: (phase: GrowthPhase | undefined) => void;
}

export default function PhaseSelector({ value, onChange }: PhaseSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">生育フェーズ</label>
      <div className="flex flex-wrap gap-1.5">
        {GROWTH_PHASES.map((phase) => {
          const isActive = value === phase.value;
          return (
            <button
              key={phase.value}
              type="button"
              onClick={() => onChange(isActive ? undefined : phase.value)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{phase.emoji}</span>
              <span>{phase.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
