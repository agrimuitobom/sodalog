"use client";

import { useState } from "react";
import { fetchAiAdvice } from "@/lib/ai";
import { GrowthRecord } from "@/types/record";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

interface Props {
  record: GrowthRecord;
  allRecords: GrowthRecord[];
}

export default function AiAdvicePanel({ record, allRecords }: Props) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const sameRecords = allRecords.filter((r) => r.crop === record.crop);
      const text = await fetchAiAdvice(sameRecords, record.crop, record.variety);
      setAdvice(text);
    } catch (err) {
      console.error("AI advice failed:", err);
      setError("AIアドバイスの取得に失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (advice) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
        <h3 className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          AI栽培アドバイス
        </h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{advice}</p>
        <button
          onClick={handleGetAdvice}
          disabled={loading}
          className="mt-3 text-xs text-purple-600 hover:text-purple-800 underline"
        >
          再取得
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleGetAdvice}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            AIが分析中...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            AI栽培アドバイスを取得
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
