import dotenv from 'dotenv';
dotenv.config();

// ── JWT Secret Validation ─────────────────────────────────────────────────────
// Ensure required secrets are set before starting the server
const requiredSecrets = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);

if (missingSecrets.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingSecrets.join(', ')}`);
  console.error('Please add these to your .env file.');
  process.exit(1);
};

// Imported after the env check so a missing secret fails fast with a clear message.
const { default: app } = await import('./app.js');
const { initDatabase } = await import('./config/Database.js');

const port = process.env.PORT || 5001;

try {
    await initDatabase();
} catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
}

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});
