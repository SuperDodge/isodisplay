import * as localAuth from "./localAuth";
import { contentApi, playlistsApi, displaysApi, settingsApi } from "./isodisplayClient";

export const ContentItem = {
  list: (paramsOrOrder) => {
    const params = typeof paramsOrOrder === "object" ? paramsOrOrder : {};
    return contentApi.list(params);
  },
  filter: (params = {}) => contentApi.list(params),
  get: (id) => contentApi.get(id),
  create: (payload) => contentApi.create(payload),
  update: (id, payload) => contentApi.update(id, payload),
  delete: (id) => contentApi.remove(id),
};

export const Playlist = {
  list: (paramsOrOrder) => {
    const params = typeof paramsOrOrder === "object" ? paramsOrOrder : {};
    return playlistsApi.list(params);
  },
  filter: async (params = {}) => {
    if (params.id) {
      const pl = await playlistsApi.get(params.id);
      return pl ? [pl] : [];
    }
    return playlistsApi.list(params);
  },
  get: (id) => playlistsApi.get(id),
  create: (payload) => playlistsApi.create(payload),
  update: (id, payload) => playlistsApi.update(id, payload),
  delete: (id) => playlistsApi.remove(id),
};

export const Display = {
  list: (params) => displaysApi.list(params),
  filter: async (params = {}) => {
    if (params.id) {
      const d = await displaysApi.get(params.id);
      return d ? [d] : [];
    }
    return displaysApi.list(params);
  },
  get: (id) => displaysApi.get(id),
  create: (payload) => displaysApi.create(payload),
  update: (id, payload) => displaysApi.update(id, payload),
  delete: (id) => displaysApi.remove(id),
};

export const DisplaySettings = {
  list: async () => {
    const s = await settingsApi.get();
    return s ? [s] : [];
  },
  create: (payload) => settingsApi.update(payload),
  update: (_id, payload) => settingsApi.update(payload),
};

export const User = localAuth.auth;
