import { ApiError } from "../../../../lib/http/errors";

export function MutationState({
  mutation,
  success,
  pending,
  formatError
}: {
  mutation: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    isSuccess: boolean;
  };
  success: string;
  pending?: string;
  formatError?: (error: unknown) => string;
}) {
  if (mutation.isPending && pending) {
    return (
      <div className="mt-4 rounded-2xl border border-navy/15 bg-sand px-4 py-3 text-sm text-ink/70">
        {pending}
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
        {formatError
          ? formatError(mutation.error)
          : (mutation.error as ApiError).message}
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="mt-4 rounded-2xl border border-moss/20 bg-white px-4 py-3 text-sm text-ink/75">
        {success}
      </div>
    );
  }

  return null;
}
