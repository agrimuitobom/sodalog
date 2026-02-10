"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  getCurrentWeather,
  getWeatherForecast,
  getHistoricalWeather,
  reverseGeocode,
  getWeatherEmoji,
  getWeatherLabel,
  WeatherCurrent,
  WeatherDaily,
} from "@/lib/weather";
import WeatherDisplay from "@/components/WeatherDisplay";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, MapPin, Loader2, History, CloudSun } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type HistoryRange = "7d" | "30d" | "90d";

type LocationOption = { name: string; lat: number; lon: number };

const LOCATIONS: LocationOption[] = [
  { name: "現在地", lat: 0, lon: 0 },
  { name: "札幌", lat: 43.0621, lon: 141.3544 },
  { name: "仙台", lat: 38.2682, lon: 140.8694 },
  { name: "東京", lat: 35.6895, lon: 139.6917 },
  { name: "名古屋", lat: 35.1815, lon: 136.9066 },
  { name: "大阪", lat: 34.6937, lon: 135.5023 },
  { name: "広島", lat: 34.3853, lon: 132.4553 },
  { name: "高松", lat: 34.3401, lon: 134.0434 },
  { name: "福岡", lat: 33.5904, lon: 130.4017 },
  { name: "鹿児島", lat: 31.5602, lon: 130.5581 },
  { name: "那覇", lat: 26.2124, lon: 127.6809 },
];

// Default: Tokyo
const DEFAULT_LAT = 35.6895;
const DEFAULT_LON = 139.6917;

export default function WeatherPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lon, setLon] = useState(DEFAULT_LON);
  const [locationName, setLocationName] = useState("位置を取得中...");
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("現在地");

  const [current, setCurrent] = useState<WeatherCurrent | null>(null);
  const [forecast, setForecast] = useState<WeatherDaily[]>([]);
  const [historical, setHistorical] = useState<WeatherDaily[]>([]);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("30d");

  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  // Get user location
  const requestLocation = () => {
    setGeoLoading(true);
    setGeoError(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newLat = pos.coords.latitude;
          const newLon = pos.coords.longitude;
          setLat(newLat);
          setLon(newLon);
          // Reverse geocode to get city name
          const name = await reverseGeocode(newLat, newLon);
          setLocationName(name);
          setGeoError(false);
          setGeoLoading(false);
        },
        () => {
          setLocationName("東京（デフォルト）");
          setGeoError(true);
          setGeoLoading(false);
        },
        { timeout: 10000 }
      );
    } else {
      setLocationName("東京（デフォルト）");
      setGeoError(true);
      setGeoLoading(false);
    }
  };

  const selectLocation = (name: string) => {
    setSelectedLocation(name);
    if (name === "現在地") {
      requestLocation();
    } else {
      const loc = LOCATIONS.find((l) => l.name === name);
      if (loc) {
        setLat(loc.lat);
        setLon(loc.lon);
        setLocationName(loc.name);
        setGeoError(false);
        setGeoLoading(false);
      }
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch current + forecast when location is ready
  useEffect(() => {
    if (geoLoading) return;

    setLoadingCurrent(true);
    setLoadingForecast(true);

    getCurrentWeather(lat, lon)
      .then(setCurrent)
      .catch(console.error)
      .finally(() => setLoadingCurrent(false));

    getWeatherForecast(lat, lon, 7)
      .then(setForecast)
      .catch(console.error)
      .finally(() => setLoadingForecast(false));
  }, [lat, lon, geoLoading]);

  // Fetch historical on range change
  useEffect(() => {
    if (geoLoading) return;

    setLoadingHistory(true);
    const today = new Date();
    let startDate: Date;
    switch (historyRange) {
      case "7d":
        startDate = subDays(today, 7);
        break;
      case "30d":
        startDate = subDays(today, 30);
        break;
      case "90d":
        startDate = subMonths(today, 3);
        break;
    }

    const start = format(startDate, "yyyy-MM-dd");
    const end = format(subDays(today, 1), "yyyy-MM-dd");

    getHistoricalWeather(lat, lon, start, end)
      .then(setHistorical)
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [lat, lon, geoLoading, historyRange]);

  const chartData = useMemo(() => {
    return historical.map((d) => ({
      date: format(new Date(d.date), "M/d", { locale: ja }),
      最高気温: d.tempMax,
      最低気温: d.tempMin,
      降水量: d.precipitationSum,
      湿度: d.humidityMean,
    }));
  }, [historical]);

  if (loading || !user) return null;

  return (
    <div className="pb-20">
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <CloudSun className="w-5 h-5" />
        <h1 className="text-lg font-bold">環境データ</h1>
      </header>

      <div className="p-4 space-y-5">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <select
            value={selectedLocation}
            onChange={(e) => selectLocation(e.target.value)}
            className="bg-white border border-gray-200 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
          {selectedLocation === "現在地" && (
            <span className="text-xs text-gray-400">
              {geoLoading ? "" : locationName !== "位置を取得中..." ? `(${locationName})` : ""}
            </span>
          )}
          {geoLoading && <Loader2 className="w-3 h-3 animate-spin" />}
        </div>
        {geoError && selectedLocation === "現在地" && (
          <p className="text-xs text-gray-400">
            現在地を取得できませんでした。都市を選択するか、ブラウザの位置情報を許可してください
          </p>
        )}

        {/* Current Weather */}
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">現在の天気</h2>
          {loadingCurrent ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : current ? (
            <WeatherDisplay weather={current} />
          ) : (
            <p className="text-sm text-gray-400">取得できませんでした</p>
          )}
        </div>

        {/* 7-day Forecast */}
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">週間予報</h2>
          {loadingForecast ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <div className="flex min-w-max">
                {forecast.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 min-w-[80px] text-center py-3 px-2 border-r border-gray-100 last:border-r-0"
                  >
                    <p className="text-xs text-gray-500">
                      {format(new Date(day.date), "M/d(E)", { locale: ja })}
                    </p>
                    {day.weatherCode != null && (
                      <div className="mt-1">
                        <span className="text-lg">{getWeatherEmoji(day.weatherCode)}</span>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          {getWeatherLabel(day.weatherCode)}
                        </p>
                      </div>
                    )}
                    <p className="text-sm font-bold text-red-500 mt-1">{day.tempMax}°</p>
                    <p className="text-sm text-blue-500">{day.tempMin}°</p>
                    {day.precipitationSum > 0 && (
                      <p className="text-xs text-blue-400 mt-0.5">
                        {day.precipitationSum}mm
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Historical Data */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <History className="w-4 h-4" />
              過去の気象データ
            </h2>
            <div className="flex gap-1">
              {([
                ["7d", "1週間"],
                ["30d", "1ヶ月"],
                ["90d", "3ヶ月"],
              ] as [HistoryRange, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setHistoryRange(value)}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    historyRange === value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="space-y-4">
              {/* Temperature Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-xs font-medium text-gray-500 mb-3">気温推移</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      interval={historyRange === "90d" ? 6 : historyRange === "30d" ? 2 : 0}
                    />
                    <YAxis tick={{ fontSize: 10 }} unit="°C" />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="最高気温"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="最低気温"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Precipitation Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-xs font-medium text-gray-500 mb-3">降水量</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      interval={historyRange === "90d" ? 6 : historyRange === "30d" ? 2 : 0}
                    />
                    <YAxis tick={{ fontSize: 10 }} unit="mm" />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="降水量" fill="#60a5fa" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">データなし</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
