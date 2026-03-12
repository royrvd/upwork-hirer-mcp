import path from "path";
import os from "os";
export const TOKEN_FILE = path.join(os.homedir(), ".upwork_tokens.json");
export const GRAPHQL_URL = "https://api.upwork.com/graphql";
export const TOKEN_URL = "https://www.upwork.com/api/v3/oauth2/token";
export const AUTH_URL = "https://www.upwork.com/ab/account-security/oauth2/authorize";
export const REDIRECT_URI = "http://localhost:3000/callback";
export const CLIENT_ID = process.env.UPWORK_CLIENT_ID || "";
export const CLIENT_SECRET = process.env.UPWORK_CLIENT_SECRET || "";
//# sourceMappingURL=config.js.map