import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "./firebase";
import { GrowthRecord } from "@/types/record";

interface AiAdviceResponse {
  advice: string;
}

interface PestDiagnosisResponse {
  result: string;
  confidence: number;
  details: string;
  treatment: string;
  prevention: string;
}

export async function fetchAiAdvice(
  records: GrowthRecord[],
  crop: string,
  variety: string
): Promise<string> {
  const fn = httpsCallable<unknown, AiAdviceResponse>(
    getFirebaseFunctions(),
    "getAiAdvice"
  );

  const recordsData = records.map((r) => ({
    crop: r.crop,
    variety: r.variety,
    memo: r.memo,
    actions: r.actions,
    colorAnalysis: r.colorAnalysis,
    weather: r.weather
      ? {
          temperature: r.weather.temperature,
          humidity: r.weather.humidity,
          precipitation: r.weather.precipitation,
          windSpeed: r.weather.windSpeed,
          weatherCode: r.weather.weatherCode,
        }
      : undefined,
    createdAt: r.createdAt?.toDate?.()?.toISOString() ?? "",
  }));

  const result = await fn({ records: recordsData, crop, variety });
  return result.data.advice;
}

export async function fetchPestDiagnosis(
  imageUrl: string,
  crop: string,
  variety?: string,
  memo?: string
): Promise<PestDiagnosisResponse> {
  const fn = httpsCallable<unknown, PestDiagnosisResponse>(
    getFirebaseFunctions(),
    "diagnosePest"
  );

  const result = await fn({ imageUrl, crop, variety, memo });
  return result.data;
}
