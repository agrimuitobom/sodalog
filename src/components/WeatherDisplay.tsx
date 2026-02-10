"use client";

import { WeatherCurrent, getWeatherLabel, getWeatherEmoji } from "@/lib/weather";
import { Thermometer, Droplets, Wind } from "lucide-react";

interface WeatherDisplayProps {
  weather: WeatherCurrent;
  compact?: boolean;
}

export default function WeatherDisplay({ weather, compact = false }: WeatherDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{getWeatherEmoji(weather.weatherCode)}</span>
        <span className="text-gray-700">{weather.temperature}°C</span>
        <span className="text-gray-400">|</span>
        <span className="text-blue-500">{weather.humidity}%</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-4 border border-blue-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getWeatherEmoji(weather.weatherCode)}</span>
          <span className="text-sm font-medium text-gray-700">
            {getWeatherLabel(weather.weatherCode)}
          </span>
        </div>
        <span className="text-2xl font-bold text-gray-900">{weather.temperature}°C</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">湿度</p>
            <p className="text-sm font-medium text-gray-700">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-orange-500" />
          <div>
            <p className="text-xs text-gray-500">降水量</p>
            <p className="text-sm font-medium text-gray-700">{weather.precipitation}mm</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-teal-500" />
          <div>
            <p className="text-xs text-gray-500">風速</p>
            <p className="text-sm font-medium text-gray-700">{weather.windSpeed}m/s</p>
          </div>
        </div>
      </div>
    </div>
  );
}
