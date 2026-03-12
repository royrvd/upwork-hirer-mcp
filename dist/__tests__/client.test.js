import { describe, it, expect, vi, beforeEach } from "vitest";
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
vi.mock("../config.js", () => ({
    GRAPHQL_URL: "https://api.upwork.com/graphql",
    TOKEN_URL: "https://www.upwork.com/api/v3/oauth2/token",
    CLIENT_ID: "test_id",
    CLIENT_SECRET: "test_secret",
}));
const mockLoadTokens = vi.fn();
const mockSaveTokens = vi.fn();
vi.mock("../auth/tokenManager.js", () => ({
    loadTokens: () => mockLoadTokens(),
    saveTokens: (t) => mockSaveTokens(t),
}));
const { gql } = await import("../graphql/client.js");
beforeEach(() => {
    mockFetch.mockReset();
    mockLoadTokens.mockReset();
    mockSaveTokens.mockReset();
});
describe("gql", () => {
    it("makes authenticated GraphQL request and returns data", async () => {
        mockLoadTokens.mockReturnValue({ access_token: "tok_123", expires_at: Date.now() + 3600_000 });
        mockFetch.mockResolvedValue({
            json: async () => ({ data: { user: { id: "1", name: "Test" } } }),
        });
        const result = await gql("query { user { id name } }");
        expect(result.user.name).toBe("Test");
        expect(mockFetch.mock.calls[0][0]).toBe("https://api.upwork.com/graphql");
        expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer tok_123");
    });
    it("throws when not authenticated", async () => {
        mockLoadTokens.mockReturnValue({});
        await expect(gql("query { user { id } }")).rejects.toThrow("Not authenticated");
    });
    it("throws on full GraphQL error (no data)", async () => {
        mockLoadTokens.mockReturnValue({ access_token: "tok_123", expires_at: Date.now() + 3600_000 });
        mockFetch.mockResolvedValue({
            json: async () => ({ errors: [{ message: "Bad query" }] }),
        });
        await expect(gql("query { bad }")).rejects.toThrow("Bad query");
    });
    it("returns partial data when errors and data coexist", async () => {
        mockLoadTokens.mockReturnValue({ access_token: "tok_123", expires_at: Date.now() + 3600_000 });
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        mockFetch.mockResolvedValue({
            json: async () => ({
                data: { contractByTerm: { id: "123" } },
                errors: [{ message: "Authorization failed" }],
            }),
        });
        const result = await gql("query { contractByTerm { id } }");
        expect(result.contractByTerm.id).toBe("123");
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("partial"), expect.any(String));
        consoleSpy.mockRestore();
    });
    it("refreshes expired token", async () => {
        mockLoadTokens.mockReturnValue({
            access_token: "old_tok",
            refresh_token: "ref_tok",
            expires_at: Date.now() - 1000, // expired
        });
        mockFetch
            .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: "new_tok", refresh_token: "new_ref", expires_in: 86400 }),
        })
            .mockResolvedValueOnce({
            json: async () => ({ data: { user: { id: "1" } } }),
        });
        await gql("query { user { id } }");
        expect(mockSaveTokens).toHaveBeenCalledWith(expect.objectContaining({ access_token: "new_tok" }));
        expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe("Bearer new_tok");
    });
});
//# sourceMappingURL=client.test.js.map