# Scan2Rescue

Scan2Rescue connects an emergency QR card to a mobile app, a public emergency page, and an admin dashboard. The current workspace has three runnable components:

- `backend/`: Express API, MongoDB models, alert reporting, and admin APIs.
- `admin-panel/`: Vite dashboard and the public `/emergency/:qrId` page used by QR codes.
- `mobile_scan2resuce/`: Expo React Native app for profile setup, QR scanning, emergency calls, and sticker orders.

## Requirements

- Node.js and npm for the backend.
- Bun for the admin panel and Expo app.
- MongoDB running locally or a reachable MongoDB connection string.
- Expo Go on a phone for device testing, or an Android/iOS simulator.

Start MongoDB before starting the API. For a physical phone, connect the phone and development computer to the same network and use the computer's LAN IP instead of `localhost` in mobile-facing URLs.

## Configure the Backend

In PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` before starting the API:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/scan2rescue
JWT_SECRET=<replace-with-a-long-random-secret>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<replace-with-a-strong-password>
ADMIN_PANEL_ORIGIN=http://localhost:5173
NODE_ENV=development
DEBUG_VICTIM_OTP=123456
```

`ADMIN_PANEL_ORIGIN` must match the origin used to open the admin panel. If you open it on a phone using a LAN IP, set this value to that same origin, such as `http://192.168.1.50:5173`, and open the panel using that address as well. The legacy debug OTP is for the legacy victim endpoint only; QR scans use the public emergency endpoint.

Never commit real credentials or production secrets. The project `.gitignore` leaves a bare `.env` trackable, so protect `backend/.env` yourself.

## Run the Backend

In a terminal from `backend/`:

```sh
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default. Check it at `http://localhost:5000/health`; a healthy response contains `"status":"ok"`.

Optional local data commands:

```sh
npm run seed:hospitals
npm run seed:demo
```

**These commands delete data before inserting fixtures.** `seed:hospitals` replaces the hospital collection. `seed:demo` deletes existing users, emergency contacts, alerts, and hospitals before adding demo data. The demo login password is `Demo@12345`; QR IDs are `demo-arun-kumar`, `demo-divya-raj`, and `demo-karthik-s`.

## Run the Admin Panel

In a second terminal from `admin-panel/`, create `.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` is the backend origin **without** `/api`. For a phone on the LAN, use the backend computer's LAN IP here too, for example `http://192.168.1.50:5000`.

Then run:

```sh
bun install
bun run dev
```

Vite binds to the network. The local URL is normally `http://localhost:5173`; for device testing, open `http://<computer-lan-ip>:5173`.

## Run the Expo App

In a third terminal from `mobile_scan2resuce/`, create `.env.local`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_PUBLIC_CARD_BASE_URL=http://localhost:5173
```

For a physical phone, replace `localhost` in both values with the computer's LAN IP. For example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:5000/api
EXPO_PUBLIC_PUBLIC_CARD_BASE_URL=http://192.168.1.50:5173
```

`EXPO_PUBLIC_API_URL` includes `/api`. `EXPO_PUBLIC_PUBLIC_CARD_BASE_URL` is only the admin panel origin; the app adds `/emergency/<qrId>` to it. Restart Expo after changing environment values.

Install and start Expo:

```sh
bun install
bun run start -- --lan
```

Open the Metro QR code in Expo Go. Grant camera and location permissions when testing QR scanning and emergency location features. Keep the backend running while using the app.

## Local End-to-End Check

1. Start MongoDB.
2. Start the backend and verify `/health`.
3. Start the admin panel and Expo app in separate terminals.
4. Register a user, enable public emergency-card sharing, and add an emergency contact.
5. View the QR code in the app and open its public page, or scan it with another device.
6. Test the emergency actions and confirm logged alerts appear in the admin dashboard.

Use `npm test` from `backend/` for backend tests, `bun run lint` from `admin-panel/` for admin lint, and `bun run lint` from `mobile_scan2resuce/` for Expo lint.

## More Documentation

- [Local runbook](RUNBOOK.md)
- [API contract](API_CONTRACT.md)
- [Product review and release considerations](PRODUCT_FEATURE_REVIEW.md)
- [Admin panel details](admin-panel/README.md)
- [Expo app details](mobile_scan2resuce/README.md)
