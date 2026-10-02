// DONE: Cart persistence implemented using localStorage and remote sync via /api/cart/update/:id/:ipAddress.
//       Guest carts are preserved across refreshes and merged with authenticated carts when available.

// DONE: Browse page now fetches products on mount when they are not already loaded and renders a loading state.

//Done TODO: Fix the runtime error with the cart request for logged in customers.
// DONE: The cart update route has been updated to handle the case where the id parameter is not provided. If the id parameter is not provided, the route will use the ipAddress to identify the user instead. This allows for cart updates to work for non-authenticated users as well. Additionally, logging has been added to help debug any issues with cart updates.

//Done TODO: IP History management doesn't populate dom with an iphistory if there isnt one present in the database. Fixed...
// DONE: IP History management now creates a new IP history record if one doesn't exist for the incoming IP address, and returns the new record in the response. This ensures that even first-time visitors have an IP history created for them, allowing for cart persistence and tracking from their very first interaction. Additionally, the update logic has been adjusted to return the updated IP history record after an update operation, providing immediate feedback on the changes made.

//Done TODO: Fix the cart update with a non-authenticated user. The cart is getting a 500 error with a message which states "error": "WHERE parameter \"id\" has invalid \"undefined\" value". This is because the cart update route is expecting an id parameter, but it is not being passed in the request. The cart update route should be updated to handle the case where the id parameter is not provided, and it should use the ipAddress to identify the user instead.
// DONE: The cart update route has been updated to handle the case where the id parameter is not provided. If the id parameter is not provided, the route will use the ipAddress to identify the user instead. This allows for cart updates to work for non-authenticated users as well.

//DONE TODO: Fix the issue with the cart loading forms twice. Its seems to be related to the UseEffect running twice. This issue has been resolved for square payments, though the credit card form still needs fixing.
// DONE: The double form rendering issue was caused by the useEffect hook running twice in development mode due to React's Strict Mode. To fix this, we added a check to ensure that the Square payment form is only initialized once, preventing the duplicate rendering of the form. This change has been applied to both the Square payment form and the credit card form, ensuring that they both render correctly without duplication.

//DONE TODO: There may be some TODO's in the adminPanel. For example there may still be a bug with the other users being able to access it.
//DONE: The admin panel access issue has been resolved by implementing proper authentication and authorization checks. Now, only users with the appropriate admin role can access the admin panel, ensuring that other users are restricted from accessing it. This enhances the security of the admin panel and prevents unauthorized access to sensitive features and data.

//DONE TODO: Implement a feature to automatically use the browser location to pre-fill the shipping address form on the checkout page. This would enhance user experience by reducing the amount of manual input required during checkout. 
// DONE: The browser location feature has been implemented to pre-fill the shipping address form on the checkout page. This enhancement improves user experience by reducing the amount of manual input required during checkout, making the process faster and more convenient for customers. The location data is fetched using the useGeoLocation hook and is used to populate the relevant fields in the shipping address form automatically.

//DONE TODO: Fix the UX/UI issue with the header opening a topdown bar and a sidebar when the scale is small. Currently the dropdown button toggles both the topdown bar and the sidebar, which creates a confusing user experience. The dropdown button should be updated to only toggle the sidebar. This will create a clearer and more intuitive navigation experience for users on smaller screens.
// DONE: The header dropdown button now only toggles the sidebar, resolving the UX/UI issue where both the topdown bar and sidebar were being opened simultaneously. This provides a clearer and more intuitive navigation experience for users on smaller screens.
//DONE TODO 1:  (For after MVP is achieved) Implement the review system so that customers may leave reviews for their products. (Noted that the admin panel is already built to accommodate that.) 

//DONE TODO 2: Implement all the missing JPGs for the items. OR wait to have actual items after deployment. 

// TODO 3: Implement working sandbox API's for Klarna and Afterpay payment options. 

//DONE TODO 4: Check for shipping state using geolocation for paypal, klarna and afterpay to ensure that they are only offered as payment options when the customer is in a state where those payment options are available.

// TODO 5: Add logistics integration for checkout (Order and transaction confirmations and item shipment integration specifically).
// ADD UPS OR USPS

// TODO 6: Add the ability to change your username and password on the account page. In fact add a tabbed account management page thats modular and scalable in nature.
// DONE

// TODO 7: The cart isn't persisting between page refreshes on the deployment build.
// DONE

// TODO 8: Check if a product is a donation and implement a payment option. also add an "All Items" tab on the products page.
// DONE

// TODO 9: Fully integrate paypal and square's production API keys for implementation of donation features.


//PARTLY DONE TODO 10: Fully integrate https protocols after full deployment of the MVP and domain attainment.

// ── Added from repo review (2026-09-27) ──────────────────────────────────────

// TODO 7 (update 2026-09-28): Root causes fixed. The deployment should get re-tested once it's redeployed.
// DONE: CartContext checked `typeof x === Array`, which is always false, so every loaded cart was thrown away.
//       Guest carts were keyed by the /proxy endpoint, which returned the *server's* IP, so all guests shared one cart.
//       Access tokens expired after 15 minutes with no refresh. Carts are now keyed by the logged-in customer or the
//       httpOnly sessionId cookie, and axios silently refreshes expired tokens.

//DONE TODO 11: (SECURITY) Secrets are committed to git: .env, .env.me, test.pem and client/test.pem.
// DONE: Untracked with `git rm --cached` and *.pem added to .gitignore. .env.vault (encrypted) is still tracked on purpose.
//       The Square access token and PayPal secret were also moved out of client/.env.development into the server .env.
//       Anything prefixed REACT_APP_ can end up in the public JS bundle.
// TODO 11b: STILL NEEDED BY YOU. The old values are in git history. Rotate every one: JWT secrets, DB password,
//       Square access token, PayPal secret, the dotenv-vault DOTENV_ME key, and whatever test.pem is.
//       Optionally scrub history with git filter-repo.

//DONE TODO 12: (SECURITY) Admin access was only checked on the client.
// DONE: Added users.isAdmin. It's carried in the signed JWT, and the verifyAdmin middleware enforces it on the server.
//       On first start, config/Database.js adds the column and promotes the existing 'Admin' user.
//       Grant/revoke with `npm run set-admin -- <username> [true|false]`. Registering as "Admin" no longer grants anything.

//DONE TODO 13: (SECURITY) Most API routes had no auth.
// DONE: Customers, orders, transactions, ip-history, users, product create/update/delete and Square payment management are
//       admin-only. Account data moved to self-service /api/me/customer and /api/me/orders. Reviews use a new
//       login-required POST /api/products/:id/reviews instead of the product-update route.

//DONE TODO 14: (SECURITY) Cart routes trusted the userId in the URL, and guest carts were keyed by IP.
// DONE: The cart API is now GET/PUT /api/cart and DELETE /api/cart/:productId. The owner comes from the verified token,
//       or the sessionId cookie for guests (new guestcarts table). The guest cart is merged into the customer cart at login.
//       Customers are now linked to users by email everywhere (cart, saved cards, account), not by mixing up users.id and customers.id.

//DONE TODO 15: client/src/api/axios.js dropped withCredentials and the auth header.
// DONE: Restored the instance and read baseURL from REACT_APP_API_URL. Production builds default to same-origin.
//       Added a 401 interceptor that refreshes via /api/token.

//DONE TODO 16: Deployment URLs don't match.
// DONE: CORS origins now come from CLIENT_ORIGIN (comma-separated) in .env, and the dead allowlist code is removed.
// TODO 16b: Confirm which EC2 host is live and fix README.md (it still links ec2-18-232-86-51).
//       Set CLIENT_ORIGIN in the server .env on that box.

//DONE TODO 17: Token lifetimes and cookies were inconsistent.
// DONE: utils/authTokens.js is the single source for all of them: 15m access, 7d refresh, and the same cookie options everywhere.
//       Register now sets cookies too.

//DONE TODO 18: db.authenticate() wasn't awaited, and every model ran db.sync().
// DONE: initDatabase() in config/Database.js is awaited once in index.js before listen. The server exits if the DB is unreachable.

//DONE TODO 19: package.json cleanup.
// DONE: Removed crypto, path, zlib, router, type, body-parser, cookieparser and axios (unused server-side now).
//       nodemon, concurrently and sqlite3 are devDependencies. `npm run dev` works.
//       One remaining moderate advisory: uuid via sequelize. The only fix is a Sequelize downgrade, so it's left alone.

//DONE TODO 20: cart and ip-history routes were mounted twice.
// DONE: They're mounted once, in routes/index.js.

//DONE TODO 21: Debug logging.
// DONE: Removed the logs that printed Square tokens, request bodies, the user's location, and customer/order/transaction data.
//       The per-request logger is dev-only.

//DONE TODO 22: Raw error messages leaked to clients.
// DONE: Controllers share utils/handleError.js, which only includes error details outside production.

//DONE TODO 23: No real tests.
// DONE: `npm test` runs tests/api.test.js (13 tests: auth, refresh, admin guard, cart ownership/merge, reviews)
//       against in-memory SQLite. App setup moved to app.js so the tests can import it without starting a server.

// Other fixes found along the way:
// DONE: updateProduct never sent a response, so admin edits and review submits hung until timeout.
// DONE: Order/transaction update and delete read the id from req.body instead of the URL, so deletes always 404'd.
// DONE: The production catch-all route used Express 4 syntax ('*'), which crashes Express 5 at startup. Changed to '/*splat'.
// DONE: The page redirected to /home (or /AdminPanel) on every refresh. It now redirects only after login.
// DONE: Added the missing DELETE /api/ip-history/delete/:ip route that the admin panel was already calling.

//DONE TODO 24: Checkout payments didn't work (routes that didn't exist, old Square SDK calls, amount trusted from the browser).
// DONE: Checkout is server-authoritative (Controllers/Checkout.js, /api/checkout/*). The server prices the cart it has stored,
//       using products-table prices and utils/tax.js, and charges exactly that, in cents.
//         - Square: POST /api/checkout/square with the card token from the Web Payments SDK. Uses v42 client.payments.create
//           and an idempotency key, so a double-click can't double-charge.
//         - PayPal: the server creates the order (POST /api/checkout/paypal/order) and captures it (POST /api/checkout/paypal/capture).
//           Capture is refused if the cart total changed after the order was created.
//         - On success it creates the Order and Transaction (with processorPaymentId for refunds), decrements stock,
//           updates customer totals and clears the cart. Guests can check out too.
//       The admin payment routes (get/cancel/complete/refund/list) are rewritten for Square v42.
//       Checkout.js has a shipping state picker (pre-filled from location) and shows the server quote.
//       SquarePaymentForm reads its IDs from env. The old POST /api/payments (client-priced) is removed.
//       tests/checkout.test.js has 9 tests, with Square/PayPal HTTP stubbed.
// TODO 24b: Before going live, run one real sandbox purchase with each processor (test card 4111 1111 1111 1111).
//       Known limits: stock is checked before charging but not locked, so two simultaneous buyers could oversell the last item.
//       If saving the order fails after a successful charge, the server logs "PAYMENT TAKEN BUT ORDER NOT RECORDED" with the
//       payment id for manual reconciliation.

//DONE TODO 25: Production client config and stale build files.
// DONE: Created client/.env.production (public Square/PayPal IDs, no API URL, so it uses the same origin) and untracked the old client/build files.
//       Also fixed Hooks/locationHook.js: the hardcoded OpenCage key moved to REACT_APP_OPENCAGE_KEY, and the IP fallback
//       is https://ipapi.co (the old http://ip-api.com is blocked on HTTPS pages). It now always returns a state code or null.

// Progress on the original list:
// TODO 3:  Klarna/Afterpay still to do. Add them as new /api/checkout/<provider> handlers that use buildQuote(),
//          following the Square and PayPal pattern. KlarnaPaymentForm.js is unused until then.
//DONE TODO 8: Donations and the "All Items" tab.
// DONE: Donation checkout works: donations aren't taxed, need no shipping state, and are sent to PayPal with category DONATION.
//       "All Items" was already there. The Browse category tabs are now built from the product data instead of a
//       hardcoded list of four, so products tagged only "Boots", "Sandals" etc. show up. There's also a Donations tab
//       whenever donation products exist.
// TODO 9:  Switching to production keys is config-only now:
//          server .env SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID / SQUARE_NODE_ENV=production and PAYPAL_CLIENT_ID / PAYPAL_SECRET_KEY / PAYPAL_ENVIRONMENT=production;
//          client/.env.production REACT_APP_SQUARE_APPLICATION_ID / REACT_APP_SQUARE_LOCATION_ID / REACT_APP_SQUARE_ENVIRONMENT=production / REACT_APP_PAYPAL_CLIENT_ID.

//DONE TODO 6: Username/password changes and a tabbed account page.
// DONE: The Account page has Profile / Orders / Security tabs. Each tab is a component in client/src/components/account/,
//       and adding a tab is one entry in ACCOUNT_TABS in views/Main/Account.js. The active tab is kept in the URL (?tab=security).
//       The server adds PUT /api/me/username and PUT /api/me/password. Both need the current password.
//       A password change signs out other devices. Passwords must be at least 8 characters, at signup too.
//       Also found and fixed: refresh tokens (~340 chars) overflowed the VARCHAR(255) refresh_token column, and two
//       tokens signed in the same second were identical. They're now unique (jwtid) and stored as a SHA-256 hash.
//       Everyone has to log in once after this deploys, because old stored tokens won't match.
//DONE TODO 6b: Changing the email address isn't supported yet. Email links the login to the customer profile, so a change
//       needs to update both rows, ideally after confirming the new address.
// DONE: PUT /api/me/email (current password required) updates the users row and the customer row in one
//       transaction and re-issues the session. It's on the Account page's Security tab.

// ── Worked on in the eCommerce-test copy (2026-09-29) ─────────────────────────

// DONE TODO 1: Reviews can be edited and deleted.
//       PUT /api/products/:id/reviews/:reviewId: the author only.
//       DELETE: the author, or an admin (moderation). Admins can delete but not rewrite someone's words.
//       The product page shows Edit/Delete on your own reviews (edited ones are marked "(edited)"),
//       and the admin Products tab has "Delete review".
//       Older sample reviews had no id; on first start each is given a permanent one (config/Database.js).

// DONE TODO 2: The 10 products without a picture now use the photos that were already in client/src/views/Assets.
//       All 20 photos are copied to client/public/images/products/ (served by the dev server and included in the build).
//       `npm run fill-images` sets product_img for products with no image, matching by name (scripts/productImages.json).
//       Run it once against the real MySQL database. `-- --all` also replaces the imgur links with the local copies.

// DONE TODO 4: config/paymentMethods.js lists states excluded per payment method (empty for now = offered everywhere).
//       The checkout quote returns the allowed methods, checkout only shows those, and the payment endpoints
//       refuse a method that isn't allowed for the order's state.
// TODO 4b: Fill in the real exclusions when Klarna/Afterpay are added. They have state lending rules; PayPal and cards don't.

// DONE TODO 5 (the part that doesn't need a shipping company):
//       - Order confirmation email at checkout. A receipt email is required for guests (checked before charging)
//         and pre-filled for logged-in users.
//       - Order statuses Paid → Processing → Shipped → Delivered (or Cancelled / Refunded), with carrier + tracking
//         number and a status history. Admins set them in the admin Orders tab (PATCH /api/orders/:id/status).
//         The customer is emailed when an order ships (with a tracking link), is delivered, cancelled or refunded.
//       - Customers see status badges and tracking links in Account → Orders.
//       - Email: set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM in .env to really send.
//         Without them, emails are saved as JSON files in data/outbox/ (utils/mailer.js).
//       - Fixed along the way: admin order edits always crashed (undefined orderItems); transaction edits saved query
//         options as data; the admin transaction "Put on Hold" / "Mark as Completed" buttons and "Export Details"
//         only logged to the console. They now update the transaction and download a JSON file.
// TODO 5b: Carrier integration: buy labels and pull tracking automatically (e.g. Shippo or EasyPost), and choose a
//       shipping-rate policy (checkout currently charges no shipping). This needs an account with a provider.
// TODO 5c: Refund money through Square/PayPal when an order is marked Refunded. Right now, marking it Refunded only
//       records the status and emails the customer. The admin Square refund route exists (POST /api/payments/:id/refund).

// PARTLY DONE TODO 10: The app is ready for HTTPS.
//       - Security headers on every response (helmet): nosniff, frame protection, no X-Powered-By, etc.
//       - FORCE_HTTPS=true (production only) redirects http → https and sends HSTS. Nginx must set
//         X-Forwarded-Proto; trust proxy is already set for a proxy on the same machine.
//       - Cookies were already Secure in production.
// TODO 10b: Still needs a domain and certificate (e.g. Nginx + certbot / Let's Encrypt), then set FORCE_HTTPS=true.
//       Then add a Content-Security-Policy listing the Square, PayPal, imgur, ipapi.co and OpenCage origins
//       (it's off for now so those keep working).

// Dev setup: nodemon.json stops the API restarting when client files or data/ change. Before, every saved
// email in data/outbox restarted the server and dropped requests in flight.

// ── Contact page (2026-10-01) ────────────────────────────────────────────────

//DONE TODO 26: Build out the Contact Us page.
// DONE: /contact (views/Main/Contact.js) shows the shop address, skelesitesmlh@gmail.com, and a message form.
//       The form posts to POST /api/contact (Controllers/Contact.js), which emails the message to that address
//       through utils/mailer.js with the visitor's address as Reply-To, so replying in Gmail answers them.
//       Works for guests and logged-in users (email pre-filled, account name included). Linked from the header,
//       the footer and the Home "Contact Us" button. Spam limits: 5 messages per hour per IP and a hidden
//       honeypot field. tests/contact.test.js has 5 tests.
//       To change the address: CONTACT_EMAIL in the server .env and REACT_APP_CONTACT_EMAIL in the client env.
// TODO 26b: STILL NEEDED BY YOU. Until SMTP is set, messages are only saved to data/outbox/ and never reach the
//       inbox. For Gmail, turn on 2-Step Verification for skelesitesmlh@gmail.com, create an App Password
//       (https://myaccount.google.com/apppasswords), then set in the server .env:
//         SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_USER=skelesitesmlh@gmail.com  SMTP_PASS=<app password>
//         MAIL_FROM="Shoe Store <skelesitesmlh@gmail.com>"
//       This also turns on real order receipts and shipping emails (TODO 5).

// Still needs you: TODO 3 (Klarna/Afterpay sandbox credentials), 9 (production keys), 11b (rotate the committed
// secrets), 16b (which EC2 host is live), 24b (a PayPal sandbox buyer run), 5b (a shipping provider),
// 26b (a Gmail app password so contact messages are really sent).
