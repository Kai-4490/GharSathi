# Backend requests / notes

The backend was **not modified**. Prerequisites from spec Section 0 were verified by reading the source:
no `response` package content (controllers return entities), `@JsonIgnore` on `User.currentOtp` and
`User.otpGeneratedAt`, and `spring.jpa.open-in-view=true` plus
`spring.jackson.serialization.fail-on-empty-beans=false` in `application.properties`. All present.

## 1. Re-saving a profile resets VERIFIED to PENDING
- **Screen:** Profile.
- **Backend:** `POST /api/users/{id}/profile` sets `verificationStatus = PENDING` whenever `verificationDocUrl`
  is non-blank, even if it is the same URL as already stored.
- **Frontend workaround:** the profile form sends `verificationDocUrl` only when the user changed it,
  and `null` otherwise. This is a small deviation from "always send the full form" in spec 5.2, made so that
  editing e.g. occupation does not silently un-verify a verified user.
- **Suggested fix:** only reset to PENDING when the URL differs from the stored one.

## 2. Hardcoded database password in application.properties
- `spring.datasource.password` and `jwt.secret` are committed in the zip. Fine for local alpha; rotate before
  sharing or deploying.

## 3. Mockup PDF vs spec visual direction
- Not a backend issue. The mockup PDF uses a teal/amber palette; the spec mandates indigo. The build follows
  the spec. Re-theme by editing the `brand` palette in `tailwind.config.js`.
