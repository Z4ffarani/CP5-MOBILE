import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { authorizedFetch } from './apiClient';

const MAX_PHOTO_SIDE = 512;

// Na web o manipulador é implementado em JS; no aparelho depende do módulo nativo, presente apenas em builds
// gerados depois da inclusão do expo-image-manipulator. Sem ele, a foto segue como o seletor entregou.
function canManipulateImages(): boolean {
  return Platform.OS === 'web' || requireOptionalNativeModule('ExpoImageManipulator') !== null;
}

// Reduz e recomprime a foto antes do envio: fotos originais passam facilmente do limite de 5 MB da API,
// e um avatar não precisa de mais que 512 px.
async function preparePhoto(localUri: string): Promise<string> {
  if (!canManipulateImages()) return localUri;

  // Importado sob demanda para que o app não quebre em builds sem o módulo nativo.
  const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator');
  const context = ImageManipulator.manipulate(localUri).resize({ width: MAX_PHOTO_SIDE });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return result.uri;
}

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
  await appendPhoto(formData, await preparePhoto(localUri));

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
