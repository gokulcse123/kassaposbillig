const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiPost(url, body = {}, headers = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${url}`);
  }

  return res.json();
}