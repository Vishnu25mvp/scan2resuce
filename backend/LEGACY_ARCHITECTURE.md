# Backend Architecture

The active backend is the modular implementation under `src/`.

- Entry point: `src/server.js`
- Routes: `src/routes/`
- Controllers: `src/controllers/`
- Models: `src/models/`
- Database configuration: `src/config/db.js`

The previous root-level server and models were removed because they used a
different API contract and schema from the modular implementation. Do not add
routes or models at the backend root; extend the `src/` implementation instead.