"use client";

import { getWeatherEmoji } from "@/lib/weather";

interface RecordWeatherBadgeProps {
  weather: {
    temperature: number;
    humidity: number;
    weatherCode: number;
  };
}

export default function RecordWeatherBadge({ weather }: RecordWeatherBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
      <span>{getWeatherEmoji(weather.weatherCode)}</span>
      <span>{weather.temperature}°C</span>
      <span className="text-blue-400">/ {weather.humidity}%</span>
    </div>
  );
}
