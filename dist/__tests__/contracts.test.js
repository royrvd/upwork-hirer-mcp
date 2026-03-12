import { describe, it, expect, vi, beforeEach } from "vitest";
const mockGql = vi.fn();
vi.mock("../graphql/client.js", () => ({ gql: (...args) => mockGql(...args) }));
const { handleContractTool } = await import("../tools/contracts.js");
beforeEach(() => mockGql.mockReset());
describe("list_my_contracts", () => {
    it("extracts contract IDs from rooms and fetches contracts", async () => {
        mockGql
            .mockResolvedValueOnce({
            roomList: {
                edges: [
                    { node: { id: "r1", topic: "Project A", contractId: "c1" } },
                    { node: { id: "r2", topic: "Project B", contractId: "c2" } },
                    { node: { id: "r3", topic: "Group Chat", contractId: null } },
                ],
            },
        })
            .mockResolvedValueOnce({
            contractList: {
                contracts: [
                    { id: "c1", title: "Contract A", status: "ACTIVE" },
                    { id: "c2", title: "Contract B", status: "CLOSED" },
                ],
            },
        });
        const result = await handleContractTool("list_my_contracts", {});
        expect(result).toHaveLength(2);
        expect(mockGql).toHaveBeenCalledTimes(2);
        // Should pass deduplicated contract IDs
        expect(mockGql.mock.calls[1][1].ids).toEqual(["c1", "c2"]);
    });
    it("deduplicates contract IDs", async () => {
        mockGql
            .mockResolvedValueOnce({
            roomList: {
                edges: [
                    { node: { id: "r1", contractId: "c1" } },
                    { node: { id: "r2", contractId: "c1" } },
                ],
            },
        })
            .mockResolvedValueOnce({ contractList: { contracts: [{ id: "c1" }] } });
        await handleContractTool("list_my_contracts", {});
        expect(mockGql.mock.calls[1][1].ids).toEqual(["c1"]);
    });
    it("returns message when no contracts found", async () => {
        mockGql.mockResolvedValue({
            roomList: { edges: [{ node: { id: "r1", contractId: null } }] },
        });
        const result = await handleContractTool("list_my_contracts", {});
        expect(result.message).toContain("No contracts");
        expect(mockGql).toHaveBeenCalledOnce();
    });
    it("passes pagination when limit provided", async () => {
        mockGql
            .mockResolvedValueOnce({ roomList: { edges: [] } });
        await handleContractTool("list_my_contracts", { limit: 5 });
        expect(mockGql.mock.calls[0][1].pagination).toEqual({ first: 5 });
    });
});
describe("get_contract", () => {
    it("flattens milestones from fixedPriceTerms", async () => {
        mockGql.mockResolvedValue({
            contractByTerm: {
                id: "c1", title: "Project", status: "ACTIVE", kind: "FIXED",
                freelancer: { id: "f1", name: "Dev" },
                terms: {
                    fixedPriceTerms: [
                        { milestones: [{ id: "m1", state: "Paid" }] },
                        { milestones: [{ id: "m2", state: "Active" }] },
                    ],
                },
            },
        });
        const result = await handleContractTool("get_contract", { contract_id: "c1" });
        expect(result.milestones).toHaveLength(2);
        expect(result).not.toHaveProperty("terms");
        expect(result.title).toBe("Project");
    });
    it("returns null when contract not found", async () => {
        mockGql.mockResolvedValue({ contractByTerm: null });
        const result = await handleContractTool("get_contract", { contract_id: "nope" });
        expect(result).toBeNull();
    });
});
describe("get_contracts_by_ids", () => {
    it("passes ids array and returns contracts", async () => {
        mockGql.mockResolvedValue({
            contractList: { contracts: [{ id: "c1" }, { id: "c2" }] },
        });
        const result = await handleContractTool("get_contracts_by_ids", { contract_ids: ["c1", "c2"] });
        expect(result).toHaveLength(2);
        expect(mockGql.mock.calls[0][1].ids).toEqual(["c1", "c2"]);
    });
});
describe("pause_contract", () => {
    it("returns success wrapper", async () => {
        mockGql.mockResolvedValue({ pauseContract: { success: true } });
        const result = await handleContractTool("pause_contract", { contract_id: "c1", message: "On hold" });
        expect(result).toEqual({ success: true });
        expect(mockGql.mock.calls[0][1]).toMatchObject({ contractId: "c1", message: "On hold" });
    });
    it("defaults message to null", async () => {
        mockGql.mockResolvedValue({ pauseContract: { success: true } });
        await handleContractTool("pause_contract", { contract_id: "c1" });
        expect(mockGql.mock.calls[0][1].message).toBeNull();
    });
});
describe("restart_contract", () => {
    it("returns success wrapper", async () => {
        mockGql.mockResolvedValue({ restartContract: { success: true } });
        const result = await handleContractTool("restart_contract", { contract_id: "c1" });
        expect(result).toEqual({ success: true });
    });
});
//# sourceMappingURL=contracts.test.js.map