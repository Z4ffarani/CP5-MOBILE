export function getDirectConversationId(uidA: string, uidB: string): string {
  const [first, second] = [uidA, uidB].sort();
  return `${first}_${second}`;
}
