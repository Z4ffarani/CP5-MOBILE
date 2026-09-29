import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadPhoto(localUri: string, path: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export function userPhotoPath(uid: string): string {
  return `users/${uid}/profile.jpg`;
}

export function groupPhotoPath(groupId: string): string {
  return `groups/${groupId}/photo.jpg`;
}
