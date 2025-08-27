// Client-side exports
export { getCSRFHeaders, secureFetch } from './csrf-client';

// Note: Server-side functions should be imported directly from csrf-server.ts
// to avoid including server code in client bundles