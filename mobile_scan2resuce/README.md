# Scan2Rescue Mobile

React Native and Expo implementation of the Flutter app in `../mobile_app/`.
The app uses Expo Router, SecureStore on iOS/Android, Camera for QR scanning,
Location for emergency sharing, and the existing backend API.

## Run

```sh
bun install
bun run start -- --lan
```

Open the Metro QR code with Expo Go on a device on the same network. Camera and
location flows need device permission. Web is useful for checking the auth UI,
but web sessions are held in memory and are cleared on reload.

## Backend configuration

The API URL defaults to the Cloudflare backend URL currently configured in
`src/api/client.ts`. Override it in `.env.local` when the backend runs at a
different address:

```env
EXPO_PUBLIC_API_URL=http://<backend-host>:5000/api
EXPO_PUBLIC_PUBLIC_CARD_BASE_URL=https://<admin-panel-host>
```

The Expo scanner and public-card fallback use the rate-limited
`/api/public/emergency/:qrId` endpoint and do not require a debug OTP. The legacy
`/api/auth/victim/:qrId` endpoint still uses `DEBUG_VICTIM_OTP` in development.
Serve the public card over HTTPS and keep its QR IDs unguessable in production.

This workspace's ignored `.env.local` currently sets
`EXPO_PUBLIC_PUBLIC_CARD_BASE_URL=http://192.168.1.6:5173` for LAN testing. The
admin Vite server binds to the LAN so a phone on the same Wi-Fi can open the
public `/emergency/:qrId` page. If the computer's IP changes, update `.env.local`
and restart Expo. Before production builds, replace this with the deployed HTTPS
admin-panel origin. The app intentionally does not generate QR codes or accept
sticker orders if this value is missing; QR codes must never point to the JSON
API endpoint.
The admin panel uses `VITE_API_URL` for its backend origin.

## Routes

- `/(auth)/login` and `/(auth)/register`: authentication and emergency profile setup.
- `/(main)/home`: QR card, medical summary, state-aware emergency calling, quick actions, location sharing.
- `/(main)/sticker-order` and `/(main)/sticker-orders`: sticker order and dispatch tracking.
- `/(main)/profile` and `/(main)/profile-edit`: profile and medical details.
- `/(main)/contacts` and `/(main)/contact-form`: emergency contact management.
- `/(main)/qr`: full-screen personal emergency QR.
- `/(main)/scan` and `/(main)/victim/[qrId]`: QR lookup, emergency response, and nearby hospital/ambulance contacts.

The root route restores the session and redirects to the dashboard or sign-in.