import axios from "axios";

// In dev, requests go to localhost (Vite proxies /api/* to the real backend).
// In production, they go directly to the backend URL.
const api = axios.create({
  baseURL: import.meta.env.DEV ? "" : "https://b-ware-sand.vercel.app",
});

// REQUEST INTERCEPTOR — runs BEFORE every request leaves the browser.
// Think of it like a middleware in Express: req goes through this function first.
// It grabs the JWT token from localStorage and attaches it as a header.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RESPONSE INTERCEPTOR — runs AFTER every response arrives.
// If the backend says 401 (unauthorized), the token is expired/invalid.
// We clear storage and send the user to /login automatically.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
