export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function loginUser(profile: any) {
  localStorage.setItem("user", JSON.stringify(profile));

  if (!localStorage.getItem("coupons")) {
    localStorage.setItem("coupons", "2");
  }
}

export function logoutUser() {
  localStorage.removeItem("user");
}

export function getCoupons() {
  return Number(localStorage.getItem("coupons") || 0);
}

export function setCoupons(value: number) {
  localStorage.setItem("coupons", String(value));
}

export function getUnlockedEpisodes() {
  return JSON.parse(localStorage.getItem("unlockedEpisodes") || "[]");
}

export function unlockEpisode(epId: string) {
  const list = getUnlockedEpisodes();
  if (!list.includes(epId)) {
    list.push(epId);
    localStorage.setItem("unlockedEpisodes", JSON.stringify(list));
  }
}
