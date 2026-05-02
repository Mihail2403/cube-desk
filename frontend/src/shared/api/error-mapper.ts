import type { AxiosError } from 'axios';
import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

export interface ValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorDetails {
  message: string;
  status: number;
  /** Кастомное тело 422: details.errors */
  validationErrors?: ValidationErrorItem[];
  /** Доп. поля из ответа (413 и т.д.) */
  extra?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly validationErrors?: ValidationErrorItem[];
  readonly extra?: Record<string, unknown>;

  constructor({ message, status, validationErrors, extra }: ApiErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
    this.extra = extra;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const parseValidationBody = (data: unknown): ValidationErrorItem[] | undefined => {
  if (!isRecord(data)) return undefined;
  const details = data.details;
  if (!isRecord(details)) return undefined;
  const errors = details.errors;
  if (!Array.isArray(errors)) return undefined;
  return errors.filter(
    (e): e is ValidationErrorItem =>
      isRecord(e) &&
      Array.isArray(e.loc) &&
      typeof e.msg === 'string' &&
      typeof e.type === 'string',
  );
};

export const mapAxiosErrorToApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<unknown>;
    const status = ax.response?.status ?? 0;
    const data = ax.response?.data;

    let message = ax.message;
    if (isRecord(data) && typeof data.message === 'string') {
      message = data.message;
    }

    const validationErrors = status === 422 ? parseValidationBody(data) : undefined;

    const extra: Record<string, unknown> = {};
    if (isRecord(data)) {
      for (const [k, v] of Object.entries(data)) {
        if (k !== 'message' && k !== 'details') extra[k] = v;
      }
    }

    return new ApiError({
      message,
      status,
      validationErrors,
      extra: Object.keys(extra).length ? extra : undefined,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ message: error.message, status: 0 });
  }

  return new ApiError({ message: 'Неизвестная ошибка', status: 0 });
};

/** Маппинг loc Pydantic на путь поля формы (первый сегмент после body/query). */
export const validationLocToFieldPath = (loc: (string | number)[]): string => {
  const skip = new Set(['body', 'query', 'path', 'header', 'cookie']);
  const rest = loc.filter((x) => typeof x === 'string' && !skip.has(x));
  return rest.length ? rest.join('.') : 'root';
};

export const applyApiValidationToForm = <T extends FieldValues>(
  err: ApiError,
  setError: UseFormSetError<T>,
): void => {
  err.validationErrors?.forEach((e) => {
    const path = validationLocToFieldPath(e.loc) as Path<T>;
    setError(path, { type: 'server', message: e.msg });
  });
};
