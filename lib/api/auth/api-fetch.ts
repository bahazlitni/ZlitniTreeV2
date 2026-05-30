// lib/api/auth/shared/api-fetch
import { getStoredItem, removeStoredItem, setStoredItem } from "@/lib/api/auth/browser-storage";

type ApiFetchBaseOptions = RequestInit & {
  auth?: boolean;
};

export const REFRESH_PATH = "/api/auth/refresh";
export const ACCESS_TOKEN_KEY = "access_token";
export const AUTH_USER_KEY = "auth_user";


export async function apiFetch(
  input: string,
  options: ApiFetchBaseOptions,
): Promise<Response> {
  const {
    auth = false,
    headers,
    ...rest
  } = options;

  const finalHeaders = new Headers(headers);

  if (auth) {
    const accessToken = getStoredItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      finalHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  let response = await fetch(input, {
    ...rest,
    headers: finalHeaders,
    credentials: "include",
  });

  if (auth && response.status === 401 && REFRESH_PATH) {
    const refreshRes = await fetch(REFRESH_PATH, {
      method: "POST",
      credentials: "include",
    });

    const refreshData = await refreshRes.json().catch(() => null);

    if (!refreshRes.ok || !refreshData?.ok || !refreshData?.accessToken) {
      removeStoredItem(ACCESS_TOKEN_KEY);
      removeStoredItem(AUTH_USER_KEY);
      return response;
    }

    setStoredItem(ACCESS_TOKEN_KEY, refreshData.accessToken);
    finalHeaders.set("Authorization", `Bearer ${refreshData.accessToken}`);

    response = await fetch(input, {
      ...rest,
      headers: finalHeaders,
      credentials: "include",
    });
  }

  return response;
}
