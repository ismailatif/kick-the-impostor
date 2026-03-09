Original prompt: can you move var thats can be change in prodution to env in the front

- Moved the frontend Socket.IO server URL to `VITE_SOCKET_SERVER_URL`.
- Added a frontend fallback to `window.location.protocol//window.location.hostname:3001` so local and LAN testing still work without hard-coded IPs.
- Added `.env.example` with the expected Vite variable name.
- Documented the frontend env var in `README.md`.
- Validation: `npm.cmd run build` passed on March 9, 2026.
- TODO: If more deploy-time frontend settings are introduced later, keep them under `VITE_` env vars and document them in `README.md`.
