# WhatChat

Aplicativo de chat individual e em grupo, desenvolvido em React Native (Expo) com TypeScript, usando Firebase como backend e uma API própria em Node.js/Express (hospedada no Railway) para o envio seguro de notificações push e para o armazenamento de fotos.

## Integrantes

- RM558989 — Guilherme Nunes
- RM556677 — Kaique Zaffarani
- RM554913 — Pedro Josué

## Tecnologias utilizadas

- React Native
- Expo SDK 57
- TypeScript
- React Navigation (native stack)
- Firebase Authentication
- Cloud Firestore
- Firebase Realtime Database
- Firebase Cloud Messaging / Expo Notifications
- Node.js com Express (API de notificações e fotos)
- Firebase Admin SDK (API)
- Railway (hospedagem da API e Storage Bucket S3-compatível para fotos)

## Serviços Firebase e responsabilidade de cada um

| Serviço | Responsabilidade |
|---|---|
| Firebase Authentication | Cadastro e login por e-mail e senha, sessão do usuário, `uid`. |
| Cloud Firestore | Perfis de usuário, grupos e seus metadados, integrantes, limite de integrantes, política de notificações, tokens de dispositivo. |
| Firebase Realtime Database | Mensagens individuais e em grupo, sincronizadas em tempo real. |
| Firebase Cloud Messaging | Entrega das notificações push calculadas e enviadas pela API própria. |

> O armazenamento de fotos **não usa o Firebase Storage** — ele exige o plano pago (Blaze) do projeto para provisionar um bucket novo. Optou-se por um Railway Bucket (S3-compatível), conforme expressamente permitido pelo enunciado ("Firebase Storage é recomendado, mas outra solução poderá ser utilizada"). Detalhes na seção [Armazenamento de fotos](#armazenamento-de-fotos).

## Estrutura do projeto

```text
src/
  components/   Componentes de UI reutilizáveis
  screens/      Telas do aplicativo
  services/     Integração com Firebase (Auth, Firestore, RTDB) e com a API (notificações e fotos)
  hooks/        Hooks customizados (useAuth, useChat, useGroups, useNotifications, ...)
  contexts/      AuthContext
  types/        Tipagem (usuário, chat, grupo, notificação, navegação)
  utils/        Funções utilitárias (id de conversa direta, validação de grupo)
  theme/        Paleta de cores do aplicativo
  navigation/   Navegação (stack) e referência de navegação global

server/
  src/
    app.ts               Configuração do Express
    index.ts             Ponto de entrada
    middleware/
      authenticate.ts     Validação do Firebase ID Token
    routes/
      groups.ts           Sincronização do espelho de integrantes dos grupos no Realtime Database
      notifications.ts    Endpoint de envio de notificações
      photos.ts            Upload e leitura de fotos (proxy do Railway Bucket)
      health.ts           Health check
    services/
      conversationAccess.ts Participantes das conversas e espelho de integrantes dos grupos
      firebaseAdmin.ts     Inicialização do Firebase Admin SDK
      notificationSender.ts Envio via Expo Push Service
      recipientResolver.ts  Cálculo dos destinatários permitidos
      storageBucket.ts      Upload e URLs assinadas do Railway Bucket (S3-compatível)

firestore.rules          Regras de segurança do Cloud Firestore
database.rules.json      Regras de segurança do Realtime Database
firebaseConfig.json       Configuração do SDK cliente do Firebase
```

## Instalação e execução do aplicativo

Pré-requisitos: Node.js 18+, npm, Expo Go (para testes rápidos) ou um development build para testar notificações push.

```bash
npm install
cp .env.example .env   # já preenchido com a URL pública da API neste repositório
npx expo start
```

Abra no Android/iOS pelo Expo Go escaneando o QR Code, ou execute `npx expo start --android` / `--ios`.

> As notificações push completas exigem um development build (`npx expo run:android` / `npx expo run:ios` ou EAS Build), pois o funcionamento completo não depende exclusivamente do Expo Go.

## Configuração do Firebase

1. Crie um projeto em https://console.firebase.google.com.
2. **Authentication** → Sign-in method → ative apenas **E-mail/senha**.
3. **Firestore Database** → Create database → modo produção.
4. **Project settings → General → Your apps** → adicione um app Web (ícone `</>`) e copie os valores gerados para o arquivo `firebaseConfig.json` na raiz do repositório.
5. **Project settings → Service accounts** → Generate new private key. Esse arquivo **não é versionado**; os valores (`project_id`, `client_email`, `private_key`) vão diretamente nas variáveis de ambiente da hospedagem da API (nunca no aplicativo ou no GitHub).
6. Publique as regras de segurança:
   - Firestore: cole o conteúdo de `firestore.rules` em Firestore Database → Regras.
   - Realtime Database: cole o conteúdo de `database.rules.json` em Realtime Database → Regras.

### `firebaseConfig.json`

Contém apenas a configuração pública do SDK cliente (não concede privilégios administrativos):

```json
{
  "apiKey": "...",
  "authDomain": "...",
  "databaseURL": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}
```

## Armazenamento de fotos

As fotos de perfil e de grupo são armazenadas em um **Railway Bucket** (object storage S3-compatível), não no Firebase Storage — que exige o plano pago (Blaze) só para provisionar um bucket novo. O enunciado permite explicitamente outra solução além do Firebase Storage, desde que documentada.

Fluxo:

1. O app (`src/services/storageService.ts`) envia a foto via `multipart/form-data` para `POST /photos/:scope/:id` na API, autenticado com o Firebase ID Token.
2. A API (`server/src/routes/photos.ts`) valida o token, confere se o usuário pode alterar aquela foto (a própria, no caso de perfil; ou é o proprietário, no caso de grupo) e grava o arquivo no bucket (`server/src/services/storageBucket.ts`), em `users/{uid}/profile.jpg` ou `groups/{groupId}/photo.jpg`.
3. A API responde com uma URL estável e permanente da própria API (`https://whatchat-api-production.up.railway.app/photos/{scope}/{id}`) — **é essa URL, e só ela, que é salva no Firestore**, nunca a imagem em si.
4. Como buckets do Railway são privados, quando alguém acessa essa URL a API gera uma URL assinada (válida por 1h) apontando direto para o bucket e redireciona (`302`) para ela. A URL salva no Firestore nunca expira; apenas o redirecionamento interno é renovado a cada carregamento.

Nenhuma imagem é armazenada em Base64 no Firestore ou no Realtime Database.

## Notificações push

### Configuração no app

O app usa `expo-notifications` para solicitar permissão, obter o Expo Push Token e tratar o toque na notificação (`src/services/notificationService.ts`). O token é salvo em `users/{uid}/devices/{token}` no Firestore.

- **Android**: nenhuma configuração adicional além da permissão de notificações (Android 13+ solicita em runtime, já tratado pelo `expo-notifications`).
- **iOS**: as notificações push exigem um development build assinado com um Apple Developer Program válido (não funcionam no simulador nem, de forma completa, no Expo Go).

### Política de notificações

Cada grupo define `notificationPolicy` (`src/types/group.ts`):

- `all_group_messages`: toda mensagem geral do grupo notifica todos os integrantes, exceto o remetente.
- `mentioned_members`: apenas integrantes mencionados (`mentionedUserIds`) ou explicitamente selecionados como destinatário (`target.memberId`) são notificados.
- `direct_messages_only`: mensagens desse grupo não geram push.
- `disabled`: nenhuma mensagem do grupo gera push.

Conversas individuais sempre notificam o outro participante (não possuem política configurável).

### Fluxo de envio

1. O app persiste a mensagem no Realtime Database.
2. O app chama `POST /notifications/messages` na API com `conversationId` e `messageId`, autenticado com o Firebase ID Token.
3. A API valida o token com o Firebase Admin SDK.
4. A API confirma no Realtime Database que a mensagem existe e que `senderId` corresponde ao usuário autenticado.
5. A API confirma que o remetente participa da conversa: em conversas diretas, pelo id formado pelos dois `uid`; em grupos, pelos `memberIds` do grupo no Firestore. O tipo da conversa é deduzido do id, não do que o app informou.
6. A API marca a mensagem como notificada de forma atômica (transação no próprio nó da mensagem), evitando notificações duplicadas em reenvios.
7. A API calcula os destinatários a partir dos integrantes e da política de notificação do Firestore e busca os tokens de dispositivo ativos.
8. A API envia as notificações pelo Expo Push Service; tokens rejeitados como `DeviceNotRegistered` são desativados.

### Ciclo de vida do token do dispositivo

- No login, o app solicita permissão, cria o canal de notificações no Android e registra o token em `users/{uid}/devices/{token}` com `enabled: true`. Falhas nessa etapa não bloqueiam o uso do app: a tela de conversas informa quando a permissão foi negada, quando o dispositivo não oferece push (por exemplo, no navegador) ou quando o registro falhou.
- No logout, antes de encerrar a sessão, o token é marcado como `enabled: false`, e o aparelho deixa de receber push da conta que saiu.
- Ao tocar na notificação, o app abre a conversa indicada em `conversationId`/`conversationType`, inclusive quando o toque abriu o app que estava fechado.

## API de notificações (Node.js com Express)

Código em `server/`.

### Configuração e execução local

```bash
cd server
npm install
cp .env.example .env   # preencha com as credenciais do Firebase Admin SDK
npm run dev
```

### Variáveis de ambiente (`server/.env`)

| Variável | Descrição |
|---|---|
| `PORT` | Porta da API (padrão 3000). |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase. |
| `FIREBASE_CLIENT_EMAIL` | E-mail da conta de serviço (Admin SDK). |
| `FIREBASE_PRIVATE_KEY` | Chave privada da conta de serviço. Configurar somente na hospedagem, nunca versionar. |
| `FIREBASE_DATABASE_URL` | URL do Realtime Database do projeto. |
| `S3_BUCKET` | Nome do bucket S3-compatível (Railway Bucket). |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Credenciais do bucket. |
| `S3_REGION` / `S3_ENDPOINT` | Região e endpoint do bucket. |

### Publicação

A API está publicada no **Railway**, a partir do diretório `server/` deste mesmo repositório (deploy automático a cada push em `main`). As variáveis do Firebase Admin SDK e as credenciais do bucket de fotos (esta última referenciada diretamente do Railway Bucket do mesmo projeto) estão configuradas como segredos do serviço na hospedagem, nunca no repositório.

**URL pública da API:** https://whatchat-api-production.up.railway.app

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check — retorna `{ status: "ok" }` quando a API está no ar. |
| `POST` | `/notifications/messages` | Recebe `{ conversationId, messageId }` com `Authorization: Bearer <firebase-id-token>` e envia as notificações aos destinatários permitidos. |
| `POST` | `/groups/:groupId/sync-members` | Autenticado com o Firebase ID Token e restrito a integrantes. Relê o grupo no Firestore e espelha os integrantes em `groupMembers/{groupId}` no Realtime Database (veja [Regras de segurança](#regras-de-segurança)). |
| `POST` | `/photos/:scope/:id` | `scope` é `users` ou `groups`. Recebe o arquivo (`multipart/form-data`, campo `file`) autenticado com o Firebase ID Token, grava no bucket e retorna `{ url }`. |
| `GET` | `/photos/:scope/:id` | Redireciona (`302`) para uma URL assinada e temporária do bucket — é o endereço salvo no Firestore como `photoUrl`. |

Verificação de disponibilidade: `GET https://whatchat-api-production.up.railway.app/health` responde `200 OK` com `{ "status": "ok" }`.

## Proteção do limite de integrantes contra concorrência

O limite (`memberLimit`) é validado em duas camadas:

1. **Interface**: exibe as vagas disponíveis (`availableSlots`) e impede o envio do formulário quando o limite seria ultrapassado.
2. **Firestore** (`src/services/groupService.ts` + `firestore.rules`): `addMember` roda dentro de uma `runTransaction`, que relê o documento do grupo no momento do commit e rejeita a adição se o limite já tiver sido atingido — mesmo com múltiplas tentativas simultâneas, o Firestore serializa as transações conflitantes. As regras de segurança reforçam esse limite como camada final, recusando qualquer `update` em que `memberIds.size() > memberLimit`.

## Regras de segurança

- `firestore.rules`: usuários só criam/editam o próprio perfil; tokens de dispositivo só são lidos e gravados pelo próprio dono; conversas diretas só podem ser lidas pelos dois participantes (conferidos pelo próprio id, o que permite verificar se a conversa já existe antes de criá-la), exigem dois participantes distintos e um id no padrão determinístico dos dois `uid` ordenados; grupos só podem ser lidos por integrantes e criados/alterados pelo proprietário, com o limite de integrantes validado na própria regra.
- `database.rules.json`: somente participantes leem e enviam mensagens. Em conversas diretas, o participante é identificado pelo próprio id da conversa (`uidA_uidB`). Em grupos, o Realtime Database não consegue consultar o Firestore, por isso a API mantém um espelho dos integrantes em `groupMembers/{groupId}` — gravado apenas pela API (clientes não leem nem escrevem nesse nó) a partir dos `memberIds` do Firestore, sempre que um grupo é criado, um integrante é adicionado ou removido e quando o chat do grupo é aberto. Assim, um integrante removido perde o acesso às mensagens assim que o espelho é atualizado. Cada mensagem só pode ser criada (nunca sobrescrita ou apagada) e é validada para garantir que `senderId` corresponda ao usuário autenticado, que `id`/`conversationId` batam com o caminho, que `conversationType` corresponda ao tipo da conversa e que o texto tenha entre 1 e 2000 caracteres.
- A restrição de acesso ao perfil completo de um usuário (Tela de Perfil) apenas a quem compartilha uma conversa ou grupo é reforçada na aplicação: a tela de perfil só é alcançável a partir do cabeçalho de uma conversa direta já existente ou da lista de integrantes de um grupo em comum — ambos contextos que já comprovam relação. A listagem geral de usuários (`Tela de Usuários`, necessária para iniciar novas conversas) permanece acessível a qualquer usuário autenticado, conforme o próprio modelo de dados sugerido no enunciado (perfil em documento único no Firestore).
- Validações que dependem simultaneamente do Firestore e do Realtime Database (existência da mensagem + participação do remetente + política, e o espelho de integrantes dos grupos) são executadas pela API, e não pelas regras dos bancos.

## Capturas de tela e evidência de notificação

_A adicionar após os testes em dispositivo físico._

## Hooks e organização

Hooks customizados (`useAuth`, `useChat`, `useGroups`, `useUsers`, `useConversations`, `useNotifications`) encapsulam `useState`, `useEffect`, `useMemo` e `useCallback` com finalidade real, conforme exigido. O projeto não utiliza `any` em nenhum ponto do código.

## Checklist de requisitos

### 🔐 Autenticação

- [x] React Native, Expo SDK 55+ e TypeScript
- [x] Cadastro e login apenas com e-mail/senha
- [x] Cadastro com nome, celular, data de nascimento e foto de perfil
- [x] Logout e recuperação de sessão

### 💬 Conversas e grupos

- [x] Conversas individuais com exatamente dois participantes
- [x] Perfil acessível pela foto do participante
- [x] Criação e edição de grupos
- [x] Foto do grupo e listagem de seus integrantes
- [x] Perfil acessível pela lista de integrantes do grupo
- [x] Proprietário e integrantes identificados por `uid`

### 👥 Limite configurável de integrantes

- [x] Limite configurável de integrantes
- [x] Proteção contra estouro do limite em ações concorrentes

### 📨 Mensagens e tempo real

- [x] Mensagens no Realtime Database
- [x] Perfis, grupos e configurações no Firestore
- [x] Imagens armazenadas em serviço apropriado e apenas suas URLs salvas no Firestore — upload/leitura testados ponta a ponta contra a API publicada
- [x] Atualização de mensagens em tempo real

### 🔔 Notificações push

- [ ] Firebase Cloud Messaging configurado — projeto Firebase real ativo; fluxo de autenticação/validação da API testado ponta a ponta via requisições reais (200/403/404 conforme esperado); falta apenas testar o recebimento em dispositivo físico
- [x] Tokens de dispositivos armazenados com segurança
- [x] API online autenticada com Firebase ID Token
- [x] API publicada em URL pública com HTTPS — https://whatchat-api-production.up.railway.app
- [x] API funciona sem servidor local ou inicialização pelo professor — hospedada no Railway, deploy automático a partir do GitHub
- [x] Push enviado pela API, sem utilização de Cloud Functions
- [x] Política `all_group_messages`
- [x] Política `mentioned_members`
- [x] Política `direct_messages_only`
- [x] Política `disabled`
- [x] Remetente excluído dos destinatários do próprio push
- [x] Toque na notificação abre a conversa correta

### 🔒 Segurança

- [x] Regras de segurança do Firestore e Realtime Database — `firestore.rules` e `database.rules.json` (participantes, espelho de integrantes dos grupos) publicadas no Console do Firebase

### 🔷 TypeScript, hooks e organização

- [x] Loading, estados vazios e tratamento de erros
- [x] Hooks obrigatórios utilizados com finalidade real
- [x] Projeto sem `any`
- [x] Services e componentes separados

### 📄 Documentação e entrega

- [ ] README completo com prints e configuração — falta anexar capturas de tela e evidência de notificação após teste em dispositivo
- [x] README com nome e RM de todos os integrantes
- [x] Arquivo `firebaseConfig.json` presente no repositório, com os valores reais do projeto
- [x] `firebaseConfig.json` sem credenciais administrativas ou chaves privadas
- [x] Arquivos `.env.example` presentes e sem segredos reais
- [x] Credencial administrativa fora do aplicativo e do GitHub
- [x] Segredos administrativos configurados somente na hospedagem da API — variáveis definidas diretamente no serviço do Railway
- [x] Repositório acessível no GitHub
