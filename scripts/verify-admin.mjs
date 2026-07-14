/**
 * Verify bcrypt compare works for a password you supply (local ops only).
 * Does NOT contain any real credentials.
 *
 * Usage:
 *   node scripts/verify-admin.mjs '$2a$10$....' 'candidate-password'
 */
import bcrypt from "bcryptjs";

const hash = process.argv[2];
const plain = process.argv[3];

if (!hash || !plain) {
  console.error("Usage: node scripts/verify-admin.mjs <bcrypt-hash> <password>");
  process.exit(1);
}

const ok = await bcrypt.compare(plain, hash);
console.log(ok ? "MATCH" : "NO MATCH");
process.exit(ok ? 0 : 1);
