export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type TokenGetter = (forceRefresh?: boolean) => Promise<string | null>;
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

async function sendRequest(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  token: string | null,
): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }
  return fetch(input, { ...init, headers });
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getToken ? await getToken() : null;
  let response = await sendRequest(input, init, token);

  if (response.status === 401 && getToken) {
    let freshToken: string | null = null;
    try {
      freshToken = await getToken(true);
    } catch {
      freshToken = null;
    }
    if (freshToken && freshToken !== token) {
      response = await sendRequest(input, init, freshToken);
    }
  }

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
