"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createRecord, getUserCropOptions, getUserPlotOptions, getLastRecordDefaults } from "@/lib/records";
import { CultivationAction } from "@/types/record";
import { getCurrentWeather, WeatherCurrent, getWeatherLabel, getWeatherEmoji } from "@/lib/weather";
import BottomNav from "@/components/BottomNav";
import CameraCapture from "@/components/CameraCapture";
import ActionInput from "@/components/ActionInput";
import { ArrowLeft, Save, Loader2, CloudSun, Calendar } from "lucide-react";

export default function NewRecordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Format current date for date input
  const now = new Date();
  const formatDateForInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const [recordDate, setRecordDate] = useState(formatDateForInput(now));
  const [crop, setCrop] = useState("");
  const [variety, setVariety] = useState("");
  const [cropOptions, setCropOptions] = useState<{ crop: string; variety: string }[]>([]);
  const [plotId, setPlotId] = useState("");
  const [memo, setMemo] = useState("");
  const [actions, setActions] = useState<CultivationAction[]>([]);
  const [plotOptions, setPlotOptions] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Weather auto-capture
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [weatherCoords, setWeatherCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  // Load past crop/variety/plot options and defaults
  useEffect(() => {
    if (user) {
      getUserCropOptions(user.uid).then(setCropOptions).catch(console.error);
      getUserPlotOptions(user.uid).then(setPlotOptions).catch(console.error);
      getLastRecordDefaults(user.uid).then((defaults) => {
        if (defaults?.plotId) setPlotId(defaults.plotId);
      }).catch(console.error);
    }
  }, [user]);

  // Auto-fetch weather on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setWeatherCoords({ lat, lon });
          try {
            const w = await getCurrentWeather(lat, lon);
            setWeather(w);
          } catch (err) {
            console.error("Weather fetch failed:", err);
          } finally {
            setWeatherLoading(false);
          }
        },
        () => setWeatherLoading(false),
        { timeout: 5000 }
      );
    } else {
      setWeatherLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !crop) return;

    setSaving(true);
    try {
      const weatherData =
        weather && weatherCoords
          ? {
              temperature: weather.temperature,
              humidity: weather.humidity,
              precipitation: weather.precipitation,
              windSpeed: weather.windSpeed,
              weatherCode: weather.weatherCode,
              latitude: weatherCoords.lat,
              longitude: weatherCoords.lon,
            }
          : undefined;

      await createRecord(user.uid, {
        crop,
        variety,
        plotId,
        memo,
        actions,
        imageFile,
        weather: weatherData,
        createdAt: new Date(recordDate + "T12:00:00"),
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to create record:", error);
      alert("記録の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">新しい記録</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Auto-captured weather */}
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <CloudSun className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-700">現在の天気（自動取得）</span>
          </div>
          {weatherLoading ? (
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              取得中...
            </div>
          ) : weather ? (
            <div className="flex items-center gap-3 text-sm">
              <span>{getWeatherEmoji(weather.weatherCode)}</span>
              <span className="text-gray-700 font-medium">{weather.temperature}°C</span>
              <span className="text-blue-500">{weather.humidity}%</span>
              <span className="text-gray-500 text-xs">{getWeatherLabel(weather.weatherCode)}</span>
            </div>
          ) : (
            <p className="text-xs text-gray-500">位置情報が取得できませんでした</p>
          )}
        </div>

        {/* Record date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              記録日
            </span>
          </label>
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">過去の日付で記録を入力できます</p>
        </div>

        <CameraCapture
          onCapture={setImageFile}
          onClear={() => setImageFile(null)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            作物名 <span className="text-red-500">*</span>
          </label>
          {cropOptions.length > 0 ? (
            <div className="space-y-2">
              <select
                value={cropOptions.some((o) => o.crop === crop) ? `${crop}||${variety}` : "__new__"}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setCrop("");
                    setVariety("");
                  } else {
                    const [c, v] = e.target.value.split("||");
                    setCrop(c);
                    setVariety(v);
                  }
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="__new__">新しい作物を入力</option>
                {cropOptions.map((o) => (
                  <option key={`${o.crop}||${o.variety}`} value={`${o.crop}||${o.variety}`}>
                    {o.crop}{o.variety ? ` (${o.variety})` : ""}
                  </option>
                ))}
              </select>
              {!cropOptions.some((o) => o.crop === crop && o.variety === variety) && (
                <>
                  <input
                    type="text"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    placeholder="例：トマト、イネ、キュウリ"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="品種名（例：桃太郎、コシヒカリ）"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </>
              )}
            </div>
          ) : (
            <>
              <input
                type="text"
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                placeholder="例：トマト、イネ、キュウリ"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">品種</label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="例：桃太郎、コシヒカリ"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">圃場・区画</label>
          {plotOptions.length > 0 ? (
            <div className="space-y-2">
              <select
                value={plotOptions.includes(plotId) ? plotId : "__new__"}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setPlotId("");
                  } else {
                    setPlotId(e.target.value);
                  }
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                {plotOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                <option value="__new__">新しい圃場を入力</option>
              </select>
              {!plotOptions.includes(plotId) && (
                <input
                  type="text"
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                  placeholder="例：A棟1号ハウス、露地3番"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              )}
            </div>
          ) : (
            <input
              type="text"
              value={plotId}
              onChange={(e) => setPlotId(e.target.value)}
              placeholder="例：A棟1号ハウス、露地3番"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="観察内容や気づいたことを記録..."
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          />
        </div>

        <ActionInput actions={actions} onChange={setActions} />

        <button
          type="submit"
          disabled={saving || !crop}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              記録を保存
            </>
          )}
        </button>
      </form>

      <BottomNav />
    </div>
  );
}
