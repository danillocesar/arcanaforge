export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type TokenGetter = () => Promise<string | null>;
type UnauthorizedHandler = () => void | Promise<void>;

let getToken: TokenGetter | null = null;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setAuthConfig(config: {
  getToken?: TokenGetter;
  onUnauthorized?: UnauthorizedHandler;
}) {
  getToken = config.getToken ?? null;
  onUnauthorized = config.onUnauthorized ?? null;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  const token = getToken ? await getToken() : null;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401 && onUnauthorized) {
    await onUnauthorized();
  }
  return response;
}

export async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
}
