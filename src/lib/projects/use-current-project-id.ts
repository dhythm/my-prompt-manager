"use client";

import { useEffect, useState } from "react";
import {
  readCurrentProjectId,
  resolveCurrentProjectId,
  subscribeCurrentProjectId,
  writeCurrentProjectId,
} from "./current";

export function useCurrentProjectId(projects: Array<{ id: string }>) {
  const [projectId, setProjectId] = useState(() =>
    resolveCurrentProjectId(projects, null),
  );

  useEffect(() => {
    function syncProjectId() {
      const next = resolveCurrentProjectId(projects, readCurrentProjectId());
      setProjectId(next);
      if (next && next !== readCurrentProjectId()) {
        writeCurrentProjectId(next);
      }
    }

    syncProjectId();
    return subscribeCurrentProjectId(syncProjectId);
  }, [projects]);

  function selectProjectId(next: string) {
    setProjectId(next);
    writeCurrentProjectId(next);
  }

  return { projectId, selectProjectId };
}
