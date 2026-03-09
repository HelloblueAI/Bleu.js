# Bugs found and fixes (audit)

Summary of bugs identified and how they were addressed.

---

## Fixed

### 1. **APITokenService.create_token return type**
- **Issue:** Method was annotated as returning `APITokenResponse` but actually returns `APITokenCreateResponse` (one-time response including raw token).
- **Fix:** Return type updated to `APITokenCreateResponse`; import added in `api_token_service.py`.

### 2. **APITokenService: which subscription is used**
- **Issue:** `db_user.subscriptions[0]` always used the first subscription, which might be inactive or expired.
- **Fix:** Prefer an active subscription (`status == "active"`); fall back to first if none active.

### 3. **APIService and `user.subscription`**
- **Issue:** `APIService` uses `user.subscription` (singular), but `User` only defines `subscriptions` (plural), so `hasattr(user, "subscription")` is always false and the code would always raise 403.
- **Fix:** Added a `User.subscription` property that returns the first active subscription (or first subscription if none active). So `user.subscription` works and matches existing `APIService` usage.

### 4. **Subscription attributes expected by APIService**
- **Issue:** `APIService` expects `current_period_start`, `current_period_end`, `api_calls_limit`, `rate_limit`, `plan_type` on the subscription object. The `Subscription` model has `start_date`, `end_date`, and a `plan` relationship (with `api_calls_limit` on the plan).
- **Fix:** Added properties on `Subscription`: `current_period_start`/`current_period_end` (alias to `start_date`/`end_date`), `api_calls_limit` and `rate_limit` (from `plan` with safe fallbacks), and `plan_type` (from `plan`). No schema migration required.

---

## Worth double-checking

- **SubscriptionPlan.rate_limit:** Scripts (e.g. `setup_subscription_plans.py`) pass `rate_limit` into `SubscriptionPlan`, but the declared model in `subscription.py` does not have a `rate_limit` column. Either the column exists in the DB and is missing from the model, or the script will fail when run. Add the column to the model if it exists in the DB, or remove it from the script.
- **Tests:** After the `User.subscription` and `Subscription` property changes, run the full test suite (especially subscription/API and dashboard flows) to confirm nothing else assumed the old shape.

---

## Not changed

- **api_service.py** call sites were left as-is; they now work via the new `User.subscription` property and `Subscription` property aliases.
