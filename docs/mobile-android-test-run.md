# Mobile Android test run (dev API)

Short runbook for running the Expo mobile app on an Android emulator against the dev API.

## Dev API

- Base URL: `https://dev-api.mitoyabarakachurch.org`

## Run

From the repo root:

```sh
pnpm --filter @church/db build
pnpm --filter @church/config build
```

Create `apps/mobile/.env.local` (gitignored; never commit it) with:

```sh
EXPO_PUBLIC_API_BASE_URL=https://dev-api.mitoyabarakachurch.org
```

Start Metro for Android:

```sh
cd apps/mobile
npx expo start --android
```

Open Expo Go on the emulator with an explicit package and your machine's LAN IP:

```sh
adb shell am start -a android.intent.action.VIEW -p host.exp.exponent -d exp://<LAN-IP>:8081
```

Notes:

- Use the LAN IP, not `exp://10.0.2.2`, which is unreachable from the emulator in this setup.
- Always pass `-p host.exp.exponent`. Without it, an unrelated app can capture the intent.

## Test user

- Email: `mobile.test@mitoyabarakachurch.org`
- Role: `member`
- Created: 2026-11-26, through the public `POST /auth/register` endpoint on the dev API.
- Password: stored locally outside git. It is not recorded in this repo; ask the owner if you do not have it.
- Church: public registration creates a user with no church, so member screens fail with "Church context (churchId) is required". On 2026-11-26 the user was attached to the dev church "Mito ya Baraka Church" with a `members` row (Mobile Test), an active default `user_church_memberships` row (role `member`), and `users.church_id`, by direct SQL on the dev database. To undo, delete those two rows and clear `users.church_id`.
- Typing the password through `adb input text` mangles `!`; send `!` separately as Shift+1 (`input keyevent`) or type the password in pieces.
