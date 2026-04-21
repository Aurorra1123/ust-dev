export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
    readonly code: string | null = null
  ) {
    super(message);
  }
}

export async function buildApiError(response: Response) {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const message =
    typeof payload === "object" && payload !== null && "message" in payload
      ? normalizeErrorMessage(
          (payload as { message?: string | string[] }).message
        )
      : response.statusText || `request-failed-${response.status}`;

  return new ApiError(message, response.status, payload, extractErrorCode(payload, message));
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown, fallback = "request-failed") {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  return fallback;
}

export function getErrorStatus(error: unknown) {
  return isApiError(error) ? error.status : null;
}

export function getErrorCode(error: unknown) {
  if (isApiError(error) && error.code) {
    return error.code;
  }

  if (isApiError(error)) {
    return inferMessageCode(error.message);
  }

  if (error instanceof Error) {
    return inferMessageCode(error.message);
  }

  if (typeof error === "string") {
    return inferMessageCode(error);
  }

  return null;
}

function normalizeErrorMessage(message?: string | string[]) {
  if (Array.isArray(message)) {
    return message.join("；");
  }

  return message ?? "request-failed";
}

function extractErrorCode(payload: unknown, message: string) {
  if (typeof payload === "object" && payload !== null) {
    if ("code" in payload && typeof payload.code === "string") {
      return payload.code;
    }

    if ("errorCode" in payload && typeof payload.errorCode === "string") {
      return payload.errorCode;
    }
  }

  return inferMessageCode(message);
}

function inferMessageCode(message: string) {
  return isMachineReadableCode(message) ? message : null;
}

function isMachineReadableCode(value: string) {
  return /^[a-z0-9]+(?:[-_:][a-z0-9]+)+$/i.test(value);
}
