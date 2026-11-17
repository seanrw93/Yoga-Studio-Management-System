import { isAxiosError } from "axios";

export const getErrorMessage = (err: unknown, fallback: string): string =>
  isAxiosError(err) ? (err.response?.data?.message ?? fallback) : fallback;
