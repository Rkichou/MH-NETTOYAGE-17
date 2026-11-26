import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [projectId, uid, action] = process.argv.slice(2);
if (!projectId || !uid || !["grant", "revoke"].includes(action)) {
  console.error("Usage: node scripts/admin-role.mjs PROJECT_ID UID grant|revoke");
  process.exit(1);
}
initializeApp({ credential: applicationDefault(), projectId });
try {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  const claims = { ...user.customClaims };
  if (action === "grant") claims.admin = true; else delete claims.admin;
  await auth.setCustomUserClaims(uid, claims);
  if (action === "revoke") await auth.revokeRefreshTokens(uid);
  console.log("Role updated. Sign out and sign in again to refresh claims.");
} catch {
  console.error("Role update failed. Check project, UID and privileged credentials.");
  process.exitCode = 1;
}
