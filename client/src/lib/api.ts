const TOKEN_KEY = 'claymont_session';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode) — session lasts for this tab only
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const res = await fetch(`/api${path}`, { ...init, headers });
  if (res.status === 401) {
    setToken(null);
    onUnauthorized();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`);
  }
  return res;
}

export const api = {
  get: async <T>(path: string): Promise<T> => (await request(path)).json(),
  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const res = await request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) });
    return res.status === 204 ? (undefined as T) : res.json();
  },
  patch: async <T>(path: string, body: unknown): Promise<T> =>
    (await request(path, { method: 'PATCH', body: JSON.stringify(body) })).json(),
  delete: async (path: string): Promise<void> => {
    await request(path, { method: 'DELETE' });
  },
  blob: async (path: string): Promise<Blob> => (await request(path)).blob(),
};

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
