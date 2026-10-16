import { Cache } from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage, LeaderboardError } from "../lib/api";
import { LeaderboardService } from "../lib/cache";
import type { LeaderboardSnapshot } from "../lib/models";

interface LoadError {
  message: string;
  retryAt?: number;
}

interface LeaderboardState {
  snapshot?: LeaderboardSnapshot;
  error?: LoadError;
  isLoading: boolean;
}

export function useLeaderboard(apiKey: string | undefined) {
  const key = apiKey?.trim() ?? "";
  const service = useMemo(
    () => (key ? new LeaderboardService(key, new Cache({ namespace: "leaderboard" })) : undefined),
    [key],
  );
  const [state, setState] = useState<LeaderboardState>(() => ({
    snapshot: service?.readSnapshot(),
    isLoading: !!service,
  }));
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(
    async (force = true) => {
      if (!service) {
        setState({ isLoading: false });
        return;
      }
      if (request.current) return;
      const controller = new AbortController();
      request.current = controller;
      setState((previous) => ({ ...previous, isLoading: true, error: undefined }));
      try {
        const snapshot = await service.refresh(force, controller.signal);
        if (!controller.signal.aborted) setState({ snapshot, isLoading: false });
      } catch (error) {
        if (!controller.signal.aborted) {
          const failure: LoadError = {
            message: errorMessage(error),
            retryAt: error instanceof LeaderboardError ? error.retryAt : undefined,
          };
          setState((previous) => ({ ...previous, error: failure, isLoading: false }));
        }
      } finally {
        if (request.current === controller) request.current = null;
      }
    },
    [service],
  );

  useEffect(() => {
    setState({ snapshot: service?.readSnapshot(), isLoading: !!service });
    if (service) void refresh(false);
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [service, refresh]);

  return { ...state, needsApiKey: !key, refresh };
}
