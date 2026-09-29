import { auth } from './firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

async function uploadPhoto(scope: 'users' | 'groups', id: string, localUri: string): Promise<string> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Usuário não autenticado.');

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const response = await fetch(`${API_URL}/photos/${scope}/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  });

  if (!response.ok) throw new Error('Não foi possível enviar a foto.');

  const data = (await response.json()) as { url: string };
  return data.url;
}

export function uploadUserPhoto(uid: string, localUri: string): Promise<string> {
  return uploadPhoto('users', uid, localUri);
}

export function uploadGroupPhoto(groupId: string, localUri: string): Promise<string> {
  return uploadPhoto('groups', groupId, localUri);
}
