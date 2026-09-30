// Grant or revoke admin access.
//   npm run set-admin -- <username>          → make admin
//   npm run set-admin -- <username> false    → remove admin
// The user must log out and back in (or wait for the next token refresh) for it to apply.
import db, { initDatabase } from '../config/Database.js';
import Users from '../models/userModel.js';

const [username, flag = 'true'] = process.argv.slice(2);

if (!username) {
  console.error('Usage: npm run set-admin -- <username> [true|false]');
  process.exit(1);
}

const isAdmin = flag !== 'false';

try {
  await initDatabase();
  const [updated] = await Users.update({ isAdmin }, { where: { username } });
  if (!updated) {
    console.error(`No user named "${username}".`);
    process.exitCode = 1;
  } else {
    console.log(`${username}: isAdmin = ${isAdmin}`);
  }
} finally {
  await db.close();
}
