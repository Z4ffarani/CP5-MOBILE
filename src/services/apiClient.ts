import { auth } from './firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export function isApiConfigured(): boolean {
  return API_URL.length > 0;
}

type ApiRequestInit = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> };

export async function authorizedFetch(path: string, init: ApiRequestInit = {}): Promise<Response> {
  if (!isApiConfigured()) throw new Error('URL da API não configurada.');

  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Usuário não autenticado.');

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${idToken}` },
  });
}
