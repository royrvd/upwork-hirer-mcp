import crypto from "crypto";
import http from "http";
import { AUTH_URL, TOKEN_URL, REDIRECT_URI, CLIENT_ID, CLIENT_SECRET } from "../config.js";
import { loadTokens, saveTokens } from "./tokenManager.js";
export function buildAuthUrl() {
    const state = crypto.randomBytes(16).toString("hex");
    const t = loadTokens();
    t.pending_state = state;
    saveTokens(t);
    return `${AUTH_URL}?` + new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state,
    });
}
export function waitForCallback(timeoutMs = 120_000) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url ?? "/", "http://localhost:3000");
            if (!url.pathname.startsWith("/callback")) {
                res.writeHead(404);
                res.end();
                return;
            }
            const code = url.searchParams.get("code");
            const state = url.searchParams.get("state");
            if (!code || !state) {
                res.writeHead(400, { "Content-Type": "text/html" });
                res.end("<h2>Missing code or state parameter.</h2>");
                return;
            }
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("<h2>Upwork auth complete! You can close this tab and return to Claude.</h2>");
            server.close();
            resolve({ code, state });
        });
        server.listen(3000);
        setTimeout(() => { server.close(); reject(new Error("Auth timeout — try again")); }, timeoutMs);
    });
}
export async function exchangeCode(code) {
    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
    });
    if (!res.ok)
        throw new Error(`Token exchange failed: ${await res.text()}`);
    const data = await res.json();
    saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in || 86400) * 1000,
        obtained_at: Date.now(),
    });
}
//# sourceMappingURL=oauth.js.map