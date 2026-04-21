import { ApiError } from "../../../../lib/http/errors";

export function MutationState({
  mutation,
  success
}: {
  mutation: {
    isError: boolean;
    error: unknown;
    isSuccess: boolean;
  };
  success: string;
}) {
  if (mutation.isError) {
    return (
      <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
        {(mutation.error as ApiError).message}
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
