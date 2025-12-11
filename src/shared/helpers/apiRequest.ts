import axios, { type AxiosRequestConfig, type Method } from "axios";

interface ApiRequestParams<TBody = unknown, TFallback = unknown> {
  url: string;
  method?: Method;
  data?: TBody | null;
  config?: AxiosRequestConfig;
  fallback?: TFallback;
}

export async function apiRequest<
  TResponse = unknown,
  TBody = unknown,
  TFallback = unknown
>({
  url,
  method = "GET",
  data = null,
  config = {},
  fallback,
}: ApiRequestParams<TBody, TFallback>): Promise<TResponse | TFallback> {
  try {
    const response = await axios({
      url,
      method,
      data,
      ...config,
    });
    let result = response.data;

    if (typeof result === "string" && result.includes("<!doctype html")) {
      console.warn("⚠️ El api no existe");
      return fallback as TFallback;
    }
    console.log("response", result);

    return result;
  } catch (err) {
    console.error("⚠️ Error del api", err);
    return err;
  }
}
