# Local test copy

A copy of the project set up to run on this machine with no MySQL server. Nothing here touches the real database or live payments.

## Run it

```
cd eCommerce-test
npm run local        # seeds the database if it's empty, then starts server + client
```

Then open http://localhost:3002.

| | |
|---|---|
| Storefront | http://localhost:3002 |
| API | http://localhost:5002 |
| Database | `data/local.sqlite` (SQLite file) |

These ports differ from the main project's (3000 and 5001), so both can run at the same time.

## Test logins

| Username | Password | Role |
|---|---|---|
| `admin` | `admin12345` | Admin: log in, then go to /AdminPanel |
| `tester` | `tester12345` | Customer |

You can also sign up new accounts.

## Test payments (sandbox — no real money)

- **Card (Square):** `4111 1111 1111 1111`, any future expiry date, any CVV, any ZIP.
  More test cards: https://developer.squareup.com/docs/devtools/sandbox/payments
- **PayPal:** log in with a *sandbox personal* account from https://developer.paypal.com/dashboard/accounts

## Emails

No email is actually sent locally. Order receipts and shipping updates are saved as JSON files in
`data/outbox/`, one per message. To send real email, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS` and `MAIL_FROM` in `.env`.

## Useful commands

| Command | What it does |
|---|---|
| `npm run local` | Seed (if empty) and start server + client |
| `npm test` | Run the API test suite (in-memory database) |
| `npm run fill-images` | Point products with no image at the local photos |
| `npm run set-admin -- <username>` | Make a user an admin |

## Reset

Stop the app (Ctrl+C), delete `data/local.sqlite`, then `npm run local` again.

## What's different from the main project

- `.env` uses SQLite (`DB_DIALECT=sqlite`), new JWT secrets, and ports 5002/3002.
- `client/.env.development.local` points the client at port 5002.
- `config/Database.js` accepts `DB_DIALECT=sqlite` (a small, safe change that could be ported back).
- `scripts/seed.js` loads the 20 sample shoes plus one donation item, and creates the two logins.
  Out-of-stock samples get 10 units so everything can be bought.

## Moving these changes into the main repo

This folder is a full git checkout of the main repo, so you can commit here and push a branch.
Git already ignores the files that belong only to this copy:

- `.env`: test secrets and SQLite settings. **Don't copy it over the main `.env`.**
- `client/.env.development.local`: points the client at port 5002.
- `data/`: the local database and the email outbox.

In the main project, after pulling:

1. Run `npm install` (new server packages: `nodemailer`, `helmet`).
2. Start the server once. It adds the new database columns (users.isAdmin, transactions.processorPaymentId,
   orders.customerEmail/trackingCarrier/trackingNumber/statusHistory) and gives old reviews ids.
3. Run `npm run fill-images` to point the 10 imageless products at the local photos.
4. Optionally add SMTP settings to the main `.env` (see TODOs.js, TODO 5).
