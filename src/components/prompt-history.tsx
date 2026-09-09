"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PromptDiffView, VersionMessages } from "@/components/prompt-diff-view";
import {
  compareRangeForVersion,
  defaultCompareRange,
  diffPromptVersions,
} from "@/lib/diff/prompt-diff";
import { t } from "@/lib/i18n/t";
import type { PromptVersion, PromptVersionDetail } from "@/lib/prompts/types";
import { promptVersionDetailQuery } from "@/lib/queries/prompt-detail";

export function PromptHistory({
  promptId,
  versions,
  onLoadIntoEditor,
}: {
  promptId: string;
  versions: PromptVersion[];
  onLoadIntoEditor: (detail: PromptVersionDetail) => void;
}) {
  const versionNumbers = versions.map((version) => version.versionNumber);
  const initial = defaultCompareRange(versions);
  const [toVersion, setToVersion] = useState(initial?.to ?? 1);
  const [fromVersion, setFromVersion] = useState<number | null>(
    initial?.from ?? null,
  );

  const fromQuery = useQuery({
    ...promptVersionDetailQuery.options(promptId, fromVersion ?? 0),
    enabled: fromVersion != null,
  });
  const toQuery = useQuery(
    promptVersionDetailQuery.options(promptId, toVersion),
  );

  const diff =
    fromQuery.data && toQuery.data
      ? diffPromptVersions(fromQuery.data, toQuery.data)
      : null;

  function selectVersion(versionNumber: number) {
    const range = compareRangeForVersion(versionNumber, versionNumbers);
    setToVersion(range.to);
    setFromVersion(range.from);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("prompt.compareFrom")}
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
            value={fromVersion ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setFromVersion(value === "" ? null : Number(value));
            }}
          >
            <option value="">{t("prompt.noPreviousVersion")}</option>
            {versions.map((version) => (
              <option key={version.id} value={version.versionNumber}>
                {t("prompt.version", { number: version.versionNumber })}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("prompt.compareTo")}
          <select
            className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
            value={toVersion}
            onChange={(event) => selectVersion(Number(event.target.value))}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.versionNumber}>
                {t("prompt.version", { number: version.versionNumber })}
              </option>
            ))}
          </select>
        </label>
        {toQuery.data ? (
          <button
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
            type="button"
            onClick={() => {
              if (toQuery.data) {
                onLoadIntoEditor(toQuery.data);
              }
            }}
          >
            {t("prompt.loadIntoEditor")}
          </button>
        ) : null}
      </div>

      {fromVersion != null && !diff ? (
        <p className="text-sm text-[var(--muted)]">{t("prompt.loading")}</p>
      ) : null}
      {fromVersion == null && toQuery.data ? (
        <VersionMessages messages={toQuery.data.messages} />
      ) : null}
      {fromVersion != null && diff ? <PromptDiffView diff={diff} /> : null}

      <ol className="flex flex-col gap-3">
        {versions.map((version) => {
          const selected = version.versionNumber === toVersion;
          return (
            <li key={version.id}>
              <button
                className={`w-full rounded-md border p-4 text-left ${
                  selected
                    ? "border-[var(--ink)] bg-white"
                    : "border-[var(--line)] bg-white"
                }`}
                type="button"
                aria-pressed={selected}
                onClick={() => selectVersion(version.versionNumber)}
              >
                <p className="font-medium">
                  {t("prompt.version", { number: version.versionNumber })}
                </p>
                <p className="text-sm text-[var(--muted)]">{version.model}</p>
                {version.note ? (
                  <p className="mt-1 text-sm">{version.note}</p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
