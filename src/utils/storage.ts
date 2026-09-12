const DATE_KEY_HINT = /(?:At|Date)$/;

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to persist "${key}" to localStorage:`, error);
  }
}

function reviveDates(value: unknown): unknown {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = reviveDates(item);
    });
    return value;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    Object.keys(record).forEach((key) => {
      const item = record[key];
      if (typeof item === 'string' && DATE_KEY_HINT.test(key) && !Number.isNaN(Date.parse(item))) {
        record[key] = new Date(item);
      } else {
        record[key] = reviveDates(item);
      }
    });
    return record;
  }
  return value;
}

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return reviveDates(JSON.parse(raw)) as T;
  } catch (error) {
    console.warn(`Failed to restore "${key}" from localStorage:`, error);
    return fallback;
  }
}

export function clearState(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to clear "${key}" from localStorage:`, error);
  }
}