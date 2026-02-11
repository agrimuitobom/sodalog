"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getUserRecords } from "@/lib/records";
import { GrowthRecord } from "@/types/record";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ChartMetric = "greenRatio" | "r" | "g" | "b";

const metricLabels: Record<ChartMetric, string> = {
  greenRatio: "緑色面積率 (%)",
  r: "R値",
  g: "G値",
  b: "B値",
};

const metricColors: Record<ChartMetric, string> = {
  greenRatio: "#16a34a",
  r: "#dc2626",
  g: "#16a34a",
  b: "#2563eb",
};

export default function AnalysisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [selectedMetrics, setSelectedMetrics] = useState<Set<ChartMetric>>(
    new Set(["greenRatio"])
  );

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserRecords(user.uid).then((recs) => {
        setRecords(recs);
        setLoadingRecords(false);
      });
    }
  }, [user]);

  const crops = useMemo(() => {
    const set = new Set(records.filter((r) => r.colorAnalysis).map((r) => r.crop));
    return Array.from(set);
  }, [records]);

  const chartData = useMemo(() => {
    const filtered = records
      .filter((r) => r.colorAnalysis && (!selectedCrop || r.crop === selectedCrop))
      .sort(
        (a, b) =>
          (a.createdAt?.toDate?.()?.getTime() ?? 0) -
          (b.createdAt?.toDate?.()?.getTime() ?? 0)
      );

    return filtered.map((r) => {
      const date = r.createdAt?.toDate?.() ?? new Date();
      return {
        date: format(date, "M/d", { locale: ja }),
        fullDate: format(date, "yyyy/MM/dd HH:mm", { locale: ja }),
        greenRatio: r.colorAnalysis!.greenRatio,
        r: r.colorAnalysis!.r,
        g: r.colorAnalysis!.g,
        b: r.colorAnalysis!.b,
        crop: r.crop,
      };
    });
  }, [records, selectedCrop]);

  const toggleMetric = (metric: ChartMetric) => {
    const next = new Set(selectedMetrics);
    if (next.has(metric)) {
      if (next.size > 1) next.delete(metric);
    } else {
      next.add(metric);
    }
    setSelectedMetrics(next);
  };

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">分析</h1>
      </header>

      <div className="p-4 space-y-4">
        {loadingRecords ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">色解析データがありません</p>
            <p className="text-gray-500 text-sm mt-1">
              記録詳細画面で「色を解析する」を実行してください
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作物</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">すべて</option>
                {crops.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">指標</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(metricLabels) as ChartMetric[]).map((metric) => (
                  <button
                    key={metric}
                    onClick={() => toggleMetric(metric)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      selectedMetrics.has(metric)
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-500"
                    }`}
                  >
                    {metricLabels[metric]}
                  </button>
                ))}
              </div>
            </div>

            {/* Growth Curve Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">成長曲線</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    labelFormatter={(_, payload) => {
                      if (payload?.[0]?.payload?.fullDate) return payload[0].payload.fullDate;
                      return "";
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {Array.from(selectedMetrics).map((metric) => (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={metricColors[metric]}
                      name={metricLabels[metric]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <h3 className="text-sm font-medium text-gray-700 p-4 pb-2">データ一覧</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-4 py-2 text-gray-500">日付</th>
                      <th className="text-left px-4 py-2 text-gray-500">作物</th>
                      <th className="text-right px-4 py-2 text-red-500">R</th>
                      <th className="text-right px-4 py-2 text-green-500">G</th>
                      <th className="text-right px-4 py-2 text-blue-500">B</th>
                      <th className="text-right px-4 py-2 text-green-600">緑%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-4 py-2 text-gray-700">{row.date}</td>
                        <td className="px-4 py-2 text-gray-700">{row.crop}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{row.r}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{row.g}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{row.b}</td>
                        <td className="px-4 py-2 text-right font-medium text-green-700">
                          {row.greenRatio}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
