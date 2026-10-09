export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const TOKEN_KEY = 'hotel_token';
const USER_KEY = 'hotel_user';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSessionUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAdmin() {
  const user = getSessionUser();
  return !!user && user.rol === 'ADMINISTRADOR';
}

function parseError(status, data) {
  const err = new Error(data?.error?.message || `Error ${status}`);
  err.status = status;
  err.code = data?.error?.code;
  err.details = data?.error?.details || [];
  return err;
}

export async function api(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const opts = { method, headers: { ...headers } };
  if (auth) {
    const token = getToken();
    if (token) opts.headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (res.status === 401 && auth) {
    clearToken();
  }

  if (!res.ok) throw parseError(res.status, data);

  return data;
}