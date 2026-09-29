import { Platform } from 'react-native';
import { authorizedFetch } from './apiClient';

async function appendPhoto(formData: FormData, localUri: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Na web o seletor devolve uma URI blob:/data:, que precisa ser convertida no arquivo em si.
    const blob = await (await fetch(localUri)).blob();
    formData.append('file', blob, 'photo.jpg');
    return;
  }

  formData.append('file', {
    uri: localUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
}

async function uploadPhoto(scope: 'users' | 'groups', id: string, localUri: string): Promise<string> {
  const formData = new FormData();
  await appendPhoto(formData, localUri);

  const response = await authorizedFetch(`/photos/${scope}/${id}`, {
    method: 'POST',
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
