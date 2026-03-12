import fs from "fs";
import { TOKEN_FILE } from "../config.js";

export interface TokenData {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  obtained_at?: number;
  pending_state?: string;
}

export function loadTokens(): TokenData {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  } catch {
    return {};
  }
}

export function saveTokens(t: TokenData): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(t, null, 2));
}
