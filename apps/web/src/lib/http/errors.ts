export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown
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

  return new ApiError(message, response.status, payload);
}

function normalizeErrorMessage(message?: string | string[]) {
  if (Array.isArray(message)) {
    return message.join("；");
  }

  return message ?? "request-failed";
}
