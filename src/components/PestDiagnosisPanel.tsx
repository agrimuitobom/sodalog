"use client";

import { useState } from "react";
import { fetchPestDiagnosis } from "@/lib/ai";
import { Bug, Loader2, AlertCircle, ShieldCheck, ShieldAlert } from "lucide-react";

interface Props {
  imageUrl: string;
  crop: string;
  variety?: string;
  memo?: string;
}

interface DiagnosisResult {
  result: string;
  confidence: number;
  details: string;
  treatment: string;
  prevention: string;
}

export default function PestDiagnosisPanel({ imageUrl, crop, variety, memo }: Props) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPestDiagnosis(imageUrl, crop, variety, memo);
      setDiagnosis(result);
    } catch (err) {
      console.error("Pest diagnosis failed:", err);
      setError("病害虫診断に失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = diagnosis?.result === "健康";
  const confidencePercent = diagnosis ? Math.round(diagnosis.confidence * 100) : 0;

  if (diagnosis) {
    return (
      <div className={`rounded-lg p-4 border ${isHealthy ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
        <h3 className={`text-sm font-medium mb-3 flex items-center gap-1.5 ${isHealthy ? "text-green-700" : "text-orange-700"}`}>
          {isHealthy ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          病害虫診断結果
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`font-bold text-lg ${isHealthy ? "text-green-800" : "text-orange-800"}`}>
              {diagnosis.result}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              confidencePercent >= 70
                ? "bg-green-100 text-green-700"
                : confidencePercent >= 40
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              信頼度 {confidencePercent}%
            </span>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">詳細</h4>
            <p className="text-sm text-gray-700">{diagnosis.details}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">対処法</h4>
            <p className="text-sm text-gray-700">{diagnosis.treatment}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">予防策</h4>
            <p className="text-sm text-gray-700">{diagnosis.prevention}</p>
          </div>
        </div>

        <button
          onClick={handleDiagnose}
          disabled={loading}
          className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
        >
          再診断
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleDiagnose}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            AIが画像を分析中...
          </>
        ) : (
          <>
            <Bug className="w-5 h-5" />
            病害虫をAI診断
          </>
        )}
      </button>
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
