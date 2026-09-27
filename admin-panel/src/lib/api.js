export const API_URL = (import.meta.env.VITE_API_URL || 'https://genome-patent-impact-pro.trycloudflare.com').replace(/\/+$/, '');

export async function apiRequest(path, options = {}, token = '') {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.message || 'Request failed');
  return data;
}
