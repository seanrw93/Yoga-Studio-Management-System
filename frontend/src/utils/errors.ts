import { isAxiosError } from "axios";

export const getErrorMessage = (err: unknown, fallback: string): string =>
  isAxiosError(err) ? (err.response?.data?.message ?? fallback) : fallback;

type ValidationProperties = Record<
  string,
  {
    errors?: unknown[];
  }
>;

export const getServerFieldErrors = (data: unknown): Record<string, string> => {
  if (typeof data !== "object" || data === null) {
    return {};
  }

  const errors = (data as { errors?: unknown }).errors;

  if (typeof errors !== "object" || errors === null) {
    return {};
  }

  const properties = (errors as { properties?: unknown }).properties;

  if (typeof properties !== "object" || properties === null) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  for (const [field, value] of Object.entries(
    properties as ValidationProperties,
  )) {
    const message = value?.errors?.find(
      (error): error is string => typeof error === "string",
    );

    if (message) {
      fieldErrors[field] = message;
    }
  }

  return fieldErrors;
};
