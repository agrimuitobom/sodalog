"use client";

import { ColorAnalysisResult } from "@/lib/colorAnalysis";

interface ColorAnalysisDisplayProps {
  analysis: ColorAnalysisResult;
}

export default function ColorAnalysisDisplay({ analysis }: ColorAnalysisDisplayProps) {
  const avgColor = `rgb(${analysis.r}, ${analysis.g}, ${analysis.b})`;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-3">色解析</h3>
      <div className="flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-lg border border-gray-200 flex-shrink-0"
          style={{ backgroundColor: avgColor }}
        />
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-red-50 rounded-md p-2">
              <div className="text-xs text-red-500 font-medium">R</div>
              <div className="text-sm font-bold text-red-700">{analysis.r}</div>
            </div>
            <div className="bg-green-50 rounded-md p-2">
              <div className="text-xs text-green-500 font-medium">G</div>
              <div className="text-sm font-bold text-green-700">{analysis.g}</div>
            </div>
            <div className="bg-blue-50 rounded-md p-2">
              <div className="text-xs text-blue-500 font-medium">B</div>
              <div className="text-sm font-bold text-blue-700">{analysis.b}</div>
            </div>
          </div>
          <div className="bg-green-50 rounded-md p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600">緑色面積率</span>
              <span className="text-sm font-bold text-green-700">{analysis.greenRatio}%</span>
            </div>
            <div className="mt-1 bg-green-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(analysis.greenRatio, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
