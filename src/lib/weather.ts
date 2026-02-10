export interface WeatherCurrent {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
}

export interface WeatherDaily {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  humidityMean: number;
  windSpeedMax: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  current?: WeatherCurrent;
  daily: WeatherDaily[];
}

// WMO Weather interpretation codes
const weatherCodeLabels: Record<number, string> = {
  0: "快晴",
  1: "晴れ",
  2: "一部曇り",
  3: "曇り",
  45: "霧",
  48: "着氷霧",
  51: "弱い霧雨",
  53: "霧雨",
  55: "強い霧雨",
  61: "弱い雨",
  63: "雨",
  65: "強い雨",
  71: "弱い雪",
  73: "雪",
  75: "強い雪",
  80: "にわか雨(弱)",
  81: "にわか雨",
  82: "にわか雨(強)",
  95: "雷雨",
  96: "雷雨(雹)",
  99: "雷雨(強い雹)",
};

export function getWeatherLabel(code: number): string {
  return weatherCodeLabels[code] || `天気コード ${code}`;
}

export function getWeatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 65) return "🌧️";
  if (code <= 75) return "🌨️";
  if (code <= 82) return "🌧️";
  return "⛈️";
}

const FORECAST_API = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_API = "https://archive-api.open-meteo.com/v1/archive";

export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<WeatherCurrent> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code",
    timezone: "Asia/Tokyo",
  });

  const res = await fetch(`${FORECAST_API}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch current weather");
  const data = await res.json();

  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    weatherCode: data.current.weather_code,
  };
}

export async function getWeatherForecast(
  lat: number,
  lon: number,
  days: number = 7
): Promise<WeatherDaily[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
    timezone: "Asia/Tokyo",
    forecast_days: days.toString(),
  });

  const res = await fetch(`${FORECAST_API}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  const data = await res.json();

  return data.daily.time.map((date: string, i: number) => ({
    date,
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    precipitationSum: data.daily.precipitation_sum[i],
    humidityMean: 0,
    windSpeedMax: data.daily.wind_speed_10m_max[i],
  }));
}

export async function getHistoricalWeather(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<WeatherDaily[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    start_date: startDate,
    end_date: endDate,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max",
    timezone: "Asia/Tokyo",
  });

  const res = await fetch(`${ARCHIVE_API}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch historical weather");
  const data = await res.json();

  return data.daily.time.map((date: string, i: number) => ({
    date,
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    precipitationSum: data.daily.precipitation_sum[i],
    humidityMean: data.daily.relative_humidity_2m_mean?.[i] ?? 0,
    windSpeedMax: data.daily.wind_speed_10m_max[i],
  }));
}
