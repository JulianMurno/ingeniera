import { api, setSession, clearToken, getSessionUser } from './api';

export function decodeRol(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.rol || null;
  } catch {
    return null;
  }
}

export async function login(username, password) {
  const { token, user } = await api('/auth/login', {
    method: 'POST',
    body: { username, password },
    auth: false,
  });
  const full = user.rol ? user : { ...user, rol: decodeRol(token) };
  setSession(token, full);
  return full;
}

export function logout() {
  clearToken();
}

export function currentUser() {
  return getSessionUser();
}