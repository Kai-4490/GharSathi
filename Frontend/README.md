# GharSathi web (alpha-web)

React 18 + Vite + Tailwind frontend for the GharSathi Spring Boot backend (`alpha`).

## Install

```bash
npm install
```

## Environment

`.env` (already included):

```
VITE_API_URL=http://localhost:8080
```

## Run

1. Start PostgreSQL (`localhost:5432`, database `gharsathi_db`) and the backend on port **8080**
   (`mvnw spring-boot:run` in `alpha`).
2. Start the frontend:

```bash
npm run dev
```

Open http://localhost:5173. The port must stay **5173** (the backend CORS allows only 5173 and 3000).

There is no SMS provider. OTPs are printed in the backend console as `DEV OTP for <mobile>: <otp>`.
After verifying, log in with a fresh OTP (request one on the login screen).

## Creating an admin

Registration never offers the ADMIN role. Register a normal user, then promote them in PostgreSQL:

```sql
UPDATE users SET role='ADMIN' WHERE mobile_number='XXXXXXXXXX';
```

Log in again so the new role is in your token.

## Theming

All brand colours use the `brand` palette defined in `tailwind.config.js` (indigo per the spec).
Change that one palette to re-theme the whole app.

## Notes

- `React.StrictMode` is deliberately off (see `src/main.jsx`).
- See `BACKEND_REQUESTS.md` for backend gaps and quirks found while building.
