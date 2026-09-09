const CURRENT_PROJECT_KEY = "currentProjectId";
const CURRENT_PROJECT_EVENT = "current-project-change";

export function writeCurrentProjectId(projectId: string) {
  sessionStorage.setItem(CURRENT_PROJECT_KEY, projectId);
  window.dispatchEvent(new Event(CURRENT_PROJECT_EVENT));
}

export function readCurrentProjectId() {
  return sessionStorage.getItem(CURRENT_PROJECT_KEY);
}

export function subscribeCurrentProjectId(onChange: () => void) {
  window.addEventListener(CURRENT_PROJECT_EVENT, onChange);
  return () => window.removeEventListener(CURRENT_PROJECT_EVENT, onChange);
}
