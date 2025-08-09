// Minimal client for the IsoDisplay FastAPI backend
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function http(path, opts={}) {
  const res = await fetch(`${API}${path}`, { headers: {"Content-Type":"application/json"}, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status === 204 ? null : res.json();
}

export const contentApi = {
  list: (params={}) => {
    const qs = new URLSearchParams(params).toString();
    return http(`/api/content${qs ? `?${qs}` : ""}`);
  },
  get: (id) => http(`/api/content/${id}`),
  create: (payload) => http(`/api/content`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => http(`/api/content/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => http(`/api/content/${id}`, { method: "DELETE" }),
};

export const playlistsApi = {
  list: (params={}) => {
    const qs = new URLSearchParams(params).toString();
    return http(`/api/playlists${qs ? `?${qs}` : ""}`);
  },
  get: (id) => http(`/api/playlists/${id}`),
  create: (payload) => http(`/api/playlists`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => http(`/api/playlists/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => http(`/api/playlists/${id}`, { method: "DELETE" }),
};

export const displaysApi = {
  list: (params={}) => {
    const qs = new URLSearchParams(params).toString();
    return http(`/api/displays${qs ? `?${qs}` : ""}`);
  },
  get: (id) => http(`/api/displays/${id}`),
  create: (payload) => http(`/api/displays`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => http(`/api/displays/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => http(`/api/displays/${id}`, { method: "DELETE" }),
  activate: (id, playlistId) => http(`/api/displays/${id}/activate-playlist/${playlistId}`, { method: "PUT" }),
};

export const settingsApi = {
  get: () => http(`/api/settings/display`),
  update: (payload) => http(`/api/settings/display`, { method: "PUT", body: JSON.stringify(payload) }),
};
