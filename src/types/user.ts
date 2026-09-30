// Dados visíveis a qualquer usuário autenticado (lista de usuários, conversas, integrantes): users/{uid}.
export type PublicProfile = {
  uid: string;
  name: string;
  photoUrl: string;
  createdAt: number;
};

// Dados cadastrais: users/{uid}/private/profile, legíveis apenas pelo próprio usuário. Para os demais,
// a API os entrega somente a quem compartilha uma conversa individual ou um grupo com o usuário.
export type PrivateProfile = {
  email: string;
  phoneNumber: string;
  birthDate: string;
};

export type ChatUser = PublicProfile & PrivateProfile;

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  birthDate: string;
  photoUri: string | null;
};

export type RegisterResult = {
  profile: ChatUser;
  photoFailed: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};
