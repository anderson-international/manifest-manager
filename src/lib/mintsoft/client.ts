import axios, { AxiosInstance } from 'axios';

type MintsoftConfig = {
  baseURL?: string;
  apiKey?: string;
};

export function createMintsoftHttp(cfg: MintsoftConfig = {}): AxiosInstance {
  const baseURL = cfg.baseURL ?? process.env.MINTSOFT_API_URL;
  const apiKey = cfg.apiKey ?? (process.env.MINTSOFT_API_KEY as string | undefined);
  const http = axios.create({
    baseURL,
    headers: {
      'Accept': 'application/json',
      'ms-apikey': apiKey ?? '',
    },
    timeout: 30000,
  });
  return http;
}

type HealthCheckOk = { ok: true; status: number; count: number };
type HealthCheckErr = { ok: false; status: number; error?: string };
type HealthCheckResult = HealthCheckOk | HealthCheckErr;

export async function healthCheck(cfg: MintsoftConfig = {}): Promise<HealthCheckResult> {
  const http = createMintsoftHttp(cfg);
  try {
    const res = await http.get('/api/Order/Statuses');
    const data = Array.isArray(res.data) ? res.data : [];
    return { ok: true as const, status: res.status, count: data.length };
  } catch (err: any) {
    const status = err?.response?.status ?? 0;
    const message = typeof err?.message === 'string' ? err.message : undefined;
    return { ok: false as const, status, ...(message ? { error: message } : {}) };
  }
}
