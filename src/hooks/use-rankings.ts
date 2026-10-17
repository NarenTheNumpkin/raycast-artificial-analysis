import { getPreferenceValues } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { ALL_PROVIDERS, providers } from "../lib/filters";
import { formatRetrievedAt } from "../lib/format";
import type { LeaderboardSnapshot } from "../lib/models";
import { useFavorites } from "./use-favorites";
import { useLeaderboard } from "./use-leaderboard";

export function useRankingsData() {
  const preferences = getPreferenceValues<Preferences>();
  return { ...useLeaderboard(preferences.apiKey), preferences, favorites: useFavorites() };
}

export type RankingsData = ReturnType<typeof useRankingsData>;

export function useBrowseControls(
  snapshot: LeaderboardSnapshot | undefined,
  initialFavoritesOnly = false,
  allowFavorites = true,
) {
  const [providerId, setProviderId] = useState(ALL_PROVIDERS);
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly);
  const creators = useMemo(() => providers(snapshot?.models ?? []), [snapshot]);
  return { providerId, setProviderId, favoritesOnly, setFavoritesOnly, creators, allowFavorites };
}

export type BrowseControls = ReturnType<typeof useBrowseControls>;

export function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export function failureMessage(data: RankingsData): string | undefined {
  if (!data.error) return undefined;
  return `${data.error.message}${data.error.retryAt ? ` Retry after ${formatRetrievedAt(data.error.retryAt)}.` : ""}`;
}
