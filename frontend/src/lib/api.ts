const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export type ApiRequestMethod = "GET" | "POST" | "PATCH" | "DELETE";

export async function apiRequest<TResponse>(
  path: string,
  options: {
    method?: ApiRequestMethod;
    token?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<TResponse> {
  const { method = "GET", token, body, headers = {} } = options;

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { error?: string };
      throw new Error(parsed.error ?? fallback);
    } catch {
      throw new Error(text || fallback);
    }
  }

  return (await response.json()) as TResponse;
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}
