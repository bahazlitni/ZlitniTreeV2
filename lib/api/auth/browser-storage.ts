export function getBrowserStorage() {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredItem(key: string) {
  return getBrowserStorage()?.getItem(key) ?? null;
}

export function setStoredItem(key: string, value: string) {
  getBrowserStorage()?.setItem(key, value);
}

export function removeStoredItem(key: string) {
  getBrowserStorage()?.removeItem(key);
}
