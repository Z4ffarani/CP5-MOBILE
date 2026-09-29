export function isValidMemberLimit(limit: number, currentMemberCount: number): boolean {
  return Number.isInteger(limit) && limit >= currentMemberCount && limit >= 2;
}

export function availableSlots(memberLimit: number, memberIds: string[]): number {
  return Math.max(0, memberLimit - memberIds.length);
}

export function hasAvailableSlot(memberLimit: number, memberIds: string[]): boolean {
  return availableSlots(memberLimit, memberIds) > 0;
}
