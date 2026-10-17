import { Action, ActionPanel, environment, Grid, Icon } from "@raycast/api";
import { useMemo, useState } from "react";
import { failureMessage, useBrowseControls, useNow, useRankingsData } from "../hooks/use-rankings";
import { browseCardSvg, modelCardSvg } from "../lib/cards";
import { distinctModelRankings } from "../lib/families";
import { ALL_PROVIDERS, browseEntries } from "../lib/filters";
import { formatAge } from "../lib/format";
import { logoSvg, svgImage } from "../lib/images";
import { ModelActions } from "./model-actions";
import { RankingsList } from "./rankings-list";
import { Setup } from "./setup";

export function Dashboard() {
  const data = useRankingsData();
  const now = useNow();
  const [search, setSearch] = useState("");
  const controls = useBrowseControls(data.snapshot, false, false);
  const families = useMemo(() => distinctModelRankings(data.snapshot?.models ?? []), [data.snapshot]);
  const visible = useMemo(
    () =>
      browseEntries(
        families,
        search,
        { providerId: controls.providerId, favoritesOnly: false },
        data.favorites.ids,
      ).slice(0, 5),
    [families, search, controls.providerId, controls.favoritesOnly, data.favorites.ids],
  );
  const cards = useMemo(
    () =>
      visible.map((model) => ({
        model,
        image: svgImage(modelCardSvg(model, environment.appearance, logoSvg(model.creator))),
      })),
    [visible],
  );
  if (data.needsApiKey) return <Setup />;
  const error = failureMessage(data);
  return (
    <Grid
      columns={3}
      aspectRatio="16/9"
      inset={Grid.Inset.Zero}
      navigationTitle="AI Model Rankings"
      searchBarPlaceholder="Find a model or provider…"
      filtering={false}
      searchText={search}
      onSearchTextChange={setSearch}
      isLoading={data.isLoading}
    >
      <Grid.EmptyView
        title={error ? "Unable to Load Rankings" : data.isLoading ? "Loading Models…" : "No Matching Models"}
        description={error ?? "Try a different model name or provider."}
        icon={error ? Icon.ExclamationMark : Icon.MagnifyingGlass}
        actions={
          <ModelActions
            preferences={data.preferences}
            favorites={data.favorites}
            controls={controls}
            refresh={() => data.refresh()}
          />
        }
      />
      {data.snapshot ? (
        <Grid.Section
          title={`Top Five · ${controls.providerId === ALL_PROVIDERS ? "Intelligence" : (controls.creators.find((creator) => creator.id === controls.providerId)?.name ?? "Provider")}`}
          subtitle={`Artificial Analysis · ${error ? "Cached · refresh failed" : formatAge(data.snapshot.fetchedAt, now)}`}
        >
          {cards.map(({ model, image }) => (
            <Grid.Item
              key={model.id}
              id={model.id}
              content={{
                value: image,
                tooltip: `#${model.rank} ${model.name}\n${model.creator} · Intelligence Index ${model.value}`,
              }}
              title={model.creator}
              actions={
                <ModelActions
                  model={model}
                  snapshot={data.snapshot}
                  preferences={data.preferences}
                  favorites={data.favorites}
                  controls={controls}
                  refresh={() => data.refresh()}
                />
              }
            />
          ))}
          {visible.length ? (
            <Grid.Item
              id="browse-all"
              content={svgImage(browseCardSvg(data.snapshot.models.length, environment.appearance))}
              title="All Evaluated Models"
              actions={
                <ActionPanel>
                  <Action.Push title="Browse All Models" icon={Icon.List} target={<RankingsList />} />
                </ActionPanel>
              }
            />
          ) : null}
        </Grid.Section>
      ) : null}
    </Grid>
  );
}
