import { Capacitor } from "@capacitor/core";

export const AUTH_EXPIRED_EVENT = "meatlens:auth-expired";

let apiCsrfToken: string | null = null;

export type ApiSessionRefreshHandler = () => Promise<string | null>;

let apiSessionRefreshHandler: ApiSessionRefreshHandler | null = null;
let apiSessionRefreshPromise: Promise<string | null> | null = null;

// CSRF state is kept in memory only. Safe methods do not need the token;
// mutating browser requests receive it at the final RequestInit boundary.
function isSafeMethod(method: string | undefined): boolean {
  const normalizedMethod = (method ?? "GET").toUpperCase();
  return normalizedMethod === "GET" || normalizedMethod === "HEAD" || normalizedMethod === "OPTIONS";
}

export function getApiCsrfToken(): string | null {
  return apiCsrfToken;
}

export function setApiCsrfToken(token: string | null): void {
  apiCsrfToken = token?.trim() || null;
}

export function clearApiCsrfToken(): void {
  apiCsrfToken = null;
}

export function setApiSessionRefreshHandler(handler: ApiSessionRefreshHandler | null): void {
  apiSessionRefreshHandler = handler;
}

export async function refreshApiSessionForCsrf(): Promise<string | null> {
  if (!apiSessionRefreshHandler) {
    return null;
  }

  if (!apiSessionRefreshPromise) {
    apiSessionRefreshPromise = apiSessionRefreshHandler()
      .then((token) => {
        const refreshedToken = token?.trim() || null;
        if (refreshedToken) {
          setApiCsrfToken(refreshedToken);
        }
        return refreshedToken;
      })
      .catch(() => null)
      .finally(() => {
        apiSessionRefreshPromise = null;
      });
  }

  return apiSessionRefreshPromise;
}

export function notifyApiAuthExpired(): void {
  clearApiCsrfToken();
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

// Native requests omit browser credentials, while web requests keep the
// session cookie. Both platforms share the same CSRF header policy.
export function applyApiRequestInit(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);

  if (!isSafeMethod(init.method) && apiCsrfToken && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", apiCsrfToken);
  }

  const isNative = Capacitor.isNativePlatform();

  return {
    ...init,
    headers,
    credentials: isNative ? "omit" : (init.credentials ?? "include"),
  };
}
