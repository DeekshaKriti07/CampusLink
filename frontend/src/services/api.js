const baseURL = (import.meta.env?.VITE_API_URL || '/api/v1').replace(/\/$/, '');

async function request(method, url, data, config = {}) {
  const headers = new Headers(config.headers);
  const isSignIn = url === '/auth/login' || url === '/auth/register';
  const token = isSignIn ? null : localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) throw new Error('Expired');
      headers.set('Authorization', `Bearer ${token}`);
    } catch {
      localStorage.removeItem('token');
      if (!['/login', '/register'].includes(location.pathname)) location.replace('/login');
      throw new Error('Your session expired. Please sign in again.');
    }
  }
  if (data !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${baseURL}/${url.replace(/^\//, '')}`, {
    method, headers, signal: config.signal || AbortSignal.timeout(125000),
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  let body = null;
  if (response.status !== 204) {
    if (response.headers.get('content-type')?.includes('application/json')) body = await response.json();
    else body = { error: { message: 'Unexpected server response. Please try again.' } };
  }
  if (!response.ok) {
    if (response.status === 401 && !url.startsWith('/auth/')) {
      localStorage.removeItem('token'); location.replace('/login');
    }
    throw Object.assign(new Error(body?.error?.message || 'The request failed.'), { response: { status: response.status, data: body } });
  }
  return { data: body, status: response.status };
}
export default {
  get: (url, config) => request('GET', url, undefined, config),
  delete: (url, config) => request('DELETE', url, undefined, config),
  post: (url, data, config) => request('POST', url, data, config),
  put: (url, data, config) => request('PUT', url, data, config),
  patch: (url, data, config) => request('PATCH', url, data, config),
};
