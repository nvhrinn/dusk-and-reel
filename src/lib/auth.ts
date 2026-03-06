export interface User {
  name: string;
  email: string;
  picture: string;
}

export function loginUser(user: User) {
  localStorage.setItem("user", JSON.stringify(user));

  // jika pertama login beri kupon 2
  if (!localStorage.getItem("coupons")) {
    localStorage.setItem("coupons", "2");
  }
}

export function getUser(): User | null {
  const data = localStorage.getItem("user");
  return data ? JSON.parse(data) : null;
}

export function logoutUser() {
  localStorage.removeItem("user");
}

export function getCoupons() {
  return Number(localStorage.getItem("coupons") || 0);
}

export function setCoupons(v: number) {
  localStorage.setItem("coupons", String(v));
}

export function unlockEpisode(epId: string) {
  const unlocked = JSON.parse(localStorage.getItem("unlocked") || "[]");
  if (!unlocked.includes(epId)) {
    unlocked.push(epId);
    localStorage.setItem("unlocked", JSON.stringify(unlocked));
  }
}

export function getUnlockedEpisodes(epId: string) {
  const unlocked = JSON.parse(localStorage.getItem("unlocked") || "[]");
  return unlocked.includes(epId);
}
