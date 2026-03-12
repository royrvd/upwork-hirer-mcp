import { CLIENT_ID, CLIENT_SECRET } from "../config.js";
import { loadTokens } from "../auth/tokenManager.js";
import { buildAuthUrl, waitForCallback, exchangeCode } from "../auth/oauth.js";
export const authTools = [
    {
        name: "auth_start",
        description: "Start OAuth login. Returns a URL to visit in your browser. Auth completes automatically via localhost:3000.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "auth_status",
        description: "Check if authenticated and when the token expires.",
        inputSchema: { type: "object", properties: {} },
    },
];
export async function handleAuthTool(name, _args) {
    switch (name) {
        case "auth_status": {
            const t = loadTokens();
            if (!t.access_token)
                return { authenticated: false, message: "Call auth_start to log in." };
            return { authenticated: true, expires_at: t.expires_at ? new Date(t.expires_at).toISOString() : "unknown" };
        }
        case "auth_start": {
            if (!CLIENT_ID || !CLIENT_SECRET)
                throw new Error("UPWORK_CLIENT_ID and UPWORK_CLIENT_SECRET must be set.");
            const url = buildAuthUrl();
            waitForCallback().then(async ({ code, state }) => {
                const t = loadTokens();
                if (state !== t.pending_state)
                    throw new Error("State mismatch");
                await exchangeCode(code);
                console.error("Auth complete — tokens saved.");
            }).catch(err => console.error("Auth error:", err.message));
            return { message: "Visit the auth_url in your browser to authorize.", auth_url: url };
        }
        default:
            throw new Error(`Unknown auth tool: ${name}`);
    }
}
//# sourceMappingURL=auth.js.map