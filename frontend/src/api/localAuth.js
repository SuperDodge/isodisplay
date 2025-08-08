// src/api/localAuth.js

export const auth = {
  isAuthenticated: () => !!localStorage.getItem('user'),
  login: (username, password) => {
    // Replace this with your real local login logic
    localStorage.setItem('user', JSON.stringify({ username }));
    return true;
  },
  logout: () => {
    localStorage.removeItem('user');
  },
  getUser: () => JSON.parse(localStorage.getItem('user') || '{}')
};

export const entities = {
  ContentItem: {},
  Playlist: {},
  DisplaySettings: {},
  Display: {},
  User: {}
};

export const integrations = {
  Core: {}
};

