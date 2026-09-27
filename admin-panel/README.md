# Scan2Rescue Admin Panel

The Vite app provides authenticated administration for users, hospitals,
ambulances, sticker dispatch, and QR links. Its public `/emergency/:qrId` route
works without an admin login and is the browser destination encoded into sticker
QRs when the Expo app's public-card URL is configured.

## Run

```sh
bun install
bun run dev
```

## Environment

Create `.env.local` in this directory:

```env
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` is the backend origin without `/api`; the app appends API paths.
For a deployed admin panel, point it to the reachable HTTPS backend origin.

The public QR route uses the rate-limited `/api/public/emergency/:qrId` endpoint
and does not require a debug OTP. Keep the QR ID unguessable and serve the page
over HTTPS in production. `DEBUG_VICTIM_OTP` only applies to the legacy
`/api/auth/victim/:qrId` endpoint.

Sticker orders appear under **Sticker Orders**. Admins can move each request
through processing, enter manual courier/tracking details, and mark it delivered.
The app displays the order status and tracking details to its owner. Ambulance
records under **Ambulances** are used by the public QR card's nearby directory.