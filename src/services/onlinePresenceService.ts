export const DEFAULT_ONLINE_USERS_FALLBACK = 1;

export function subscribeOnlineUsersCount(onCountChange: (count: number) => void): () => void {
  onCountChange(DEFAULT_ONLINE_USERS_FALLBACK);
  return () => {};
}
