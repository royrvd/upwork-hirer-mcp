import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../config.js", () => ({
    CLIENT_ID: "test_id",
    CLIENT_SECRET: "test_secret",
    TOKEN_FILE: "/tmp/test_tokens.json",
    AUTH_URL: "https://www.upwork.com/ab/account-security/oauth2/authorize",
    TOKEN_URL: "https://www.upwork.com/api/v3/oauth2/token",
    REDIRECT_URI: "http://localhost:3000/callback",
}));
const mockLoadTokens = vi.fn();
const mockSaveTokens = vi.fn();
vi.mock("../auth/tokenManager.js", () => ({
    loadTokens: () => mockLoadTokens(),
    saveTokens: (t) => mockSaveTokens(t),
}));
const mockBuildAuthUrl = vi.fn();
const mockWaitForCallback = vi.fn();
vi.mock("../auth/oauth.js", () => ({
    buildAuthUrl: () => mockBuildAuthUrl(),
    waitForCallback: () => mockWaitForCallback(),
    exchangeCode: vi.fn(),
}));
const { handleAuthTool } = await import("../tools/auth.js");
beforeEach(() => {
    mockLoadTokens.mockReset();
    mockSaveTokens.mockReset();
    mockBuildAuthUrl.mockReset();
    mockWaitForCallback.mockReset();
});
describe("auth_status", () => {
    it("returns unauthenticated when no token", async () => {
        mockLoadTokens.mockReturnValue({});
        const result = await handleAuthTool("auth_status", {});
        expect(result.authenticated).toBe(false);
    });
    it("returns authenticated with expiry when token exists", async () => {
        mockLoadTokens.mockReturnValue({
            access_token: "tok_123",
            expires_at: 1773423118235,
        });
        const result = await handleAuthTool("auth_status", {});
        expect(result.authenticated).toBe(true);
        expect(result.expires_at).toContain("2026");
    });
    it("returns unknown expiry when expires_at is missing", async () => {
        mockLoadTokens.mockReturnValue({ access_token: "tok_123" });
        const result = await handleAuthTool("auth_status", {});
        expect(result.authenticated).toBe(true);
        expect(result.expires_at).toBe("unknown");
    });
});
describe("auth_start", () => {
    it("returns auth URL", async () => {
        mockBuildAuthUrl.mockReturnValue("https://upwork.com/auth?state=abc");
        mockWaitForCallback.mockReturnValue(new Promise(() => { })); // never resolves
        const result = await handleAuthTool("auth_start", {});
        expect(result.auth_url).toBe("https://upwork.com/auth?state=abc");
        expect(result.message).toContain("Visit");
    });
});
//# sourceMappingURL=auth.test.js.map