import fs from "fs";
import { TOKEN_FILE } from "../config.js";
export function loadTokens() {
    try {
        return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
    }
    catch {
        return {};
    }
}
export function saveTokens(t) {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(t, null, 2), { mode: 0o600 });
}
//# sourceMappingURL=tokenManager.js.map