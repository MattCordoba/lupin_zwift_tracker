export type RuntimeEnv = "development" | "production" | "test";

export const runtimeEnv = (process.env.NODE_ENV as RuntimeEnv) || "development";

export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  (runtimeEnv === "production"
    ? "https://api.example.com"
    : "http://localhost:3000");
