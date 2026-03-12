import { GRAPHQL_URL, TOKEN_URL, CLIENT_ID, CLIENT_SECRET } from "../config.js";
import { loadTokens, saveTokens } from "../auth/tokenManager.js";

async function ensureValidToken(): Promise<string> {
  let t = loadTokens();
  if (!t.access_token) throw new Error("Not authenticated. Call auth_start first.");
  if (t.expires_at && Date.now() > t.expires_at - 300_000 && t.refresh_token) {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: t.refresh_token }),
    });
    if (res.ok) {
      const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number };
      t = {
        ...t,
        access_token: data.access_token,
        refresh_token: data.refresh_token || t.refresh_token,
        expires_at: Date.now() + (data.expires_in || 86400) * 1000,
      };
      saveTokens(t);
    }
  }
  return t.access_token!;
}

export async function gql(query: string, variables: Record<string, unknown> = {}): Promise<Record<string, any>> {
  const token = await ensureValidToken();
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json() as { data?: Record<string, any>; errors?: Array<{ message: string }> };
  if (json.errors) {
    if (json.data) {
      // Partial success — log errors but return available data
      console.error("GraphQL partial errors:", json.errors.map(e => e.message).join("; "));
    } else {
      throw new Error(json.errors.map(e => e.message).join("; "));
    }
  }
  return json.data!;
}
