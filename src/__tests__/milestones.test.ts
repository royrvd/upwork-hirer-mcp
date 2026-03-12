import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGql = vi.fn();
vi.mock("../graphql/client.js", () => ({ gql: (...args: any[]) => mockGql(...args) }));

const { handleMilestoneTool } = await import("../tools/milestones.js");

const MONEY = (raw: string, display: string) => ({ rawValue: raw, displayValue: display, currency: "USD" });
const ZERO = MONEY("0", "0.00");

beforeEach(() => mockGql.mockReset());

describe("list_milestones", () => {
  it("flattens milestones from multiple fixedPriceTerms", async () => {
    mockGql.mockResolvedValue({
      contractByTerm: {
        terms: {
          fixedPriceTerms: [
            { milestones: [{ id: "1", description: "M1", state: "Paid", sequenceId: 1 }] },
            { milestones: [
              { id: "2", description: "M2", state: "Paid", sequenceId: 2 },
              { id: "3", description: "M3", state: "Active", sequenceId: 3 },
            ]},
          ],
        },
      },
    });

    const result = await handleMilestoneTool("list_milestones", { contract_id: "123" });
    expect(result).toHaveLength(3);
    expect((result as any[])[2]).toMatchObject({ id: "3", state: "Active" });
    expect(mockGql).toHaveBeenCalledOnce();
    expect(mockGql.mock.calls[0][1]).toEqual({ id: "123" });
  });

  it("returns empty array when no fixedPriceTerms", async () => {
    mockGql.mockResolvedValue({ contractByTerm: { terms: { fixedPriceTerms: [] } } });
    const result = await handleMilestoneTool("list_milestones", { contract_id: "456" });
    expect(result).toEqual([]);
  });

  it("returns empty array when contractByTerm is null", async () => {
    mockGql.mockResolvedValue({ contractByTerm: null });
    const result = await handleMilestoneTool("list_milestones", { contract_id: "789" });
    expect(result).toEqual([]);
  });
});

describe("create_milestone", () => {
  it("converts dollars to cents string", async () => {
    mockGql.mockResolvedValue({
      createMilestoneV2: { id: "100", description: "Test", state: "NotFunded", depositAmount: MONEY("500", "5.00") },
    });

    await handleMilestoneTool("create_milestone", { contract_id: "123", description: "Test", amount: 5 });
    const input = mockGql.mock.calls[0][1].input;
    expect(input.depositAmount).toBe("500");
    expect(input.contractId).toBe("123");
    expect(input.description).toBe("Test");
  });

  it("converts fractional dollars correctly", async () => {
    mockGql.mockResolvedValue({ createMilestoneV2: { id: "101" } });
    await handleMilestoneTool("create_milestone", { contract_id: "123", description: "Test", amount: 19.99 });
    expect(mockGql.mock.calls[0][1].input.depositAmount).toBe("1999");
  });

  it("includes optional dueDate and instruction", async () => {
    mockGql.mockResolvedValue({ createMilestoneV2: { id: "102" } });
    await handleMilestoneTool("create_milestone", {
      contract_id: "123", description: "Test", amount: 10,
      due_date: "2026-04-01", instructions: "Do the thing",
    });
    const input = mockGql.mock.calls[0][1].input;
    expect(input.dueDate).toBe("2026-04-01");
    expect(input.instruction).toBe("Do the thing");
  });

  it("omits optional fields when not provided", async () => {
    mockGql.mockResolvedValue({ createMilestoneV2: { id: "103" } });
    await handleMilestoneTool("create_milestone", { contract_id: "123", description: "Test", amount: 10 });
    const input = mockGql.mock.calls[0][1].input;
    expect(input).not.toHaveProperty("dueDate");
    expect(input).not.toHaveProperty("instruction");
  });
});

describe("update_milestone", () => {
  it("converts amount to cents string", async () => {
    mockGql.mockResolvedValue({ editMilestone: { id: "200" } });
    await handleMilestoneTool("update_milestone", { milestone_id: "200", amount: 25 });
    const input = mockGql.mock.calls[0][1].input;
    expect(input.id).toBe("200");
    expect(input.depositAmount).toBe("2500");
  });

  it("only includes provided fields", async () => {
    mockGql.mockResolvedValue({ editMilestone: { id: "201" } });
    await handleMilestoneTool("update_milestone", { milestone_id: "201", description: "Updated" });
    const input = mockGql.mock.calls[0][1].input;
    expect(input.description).toBe("Updated");
    expect(input).not.toHaveProperty("depositAmount");
    expect(input).not.toHaveProperty("dueDate");
    expect(input).not.toHaveProperty("instructions");
    expect(input).not.toHaveProperty("message");
  });
});

describe("delete_milestone", () => {
  it("returns deleted boolean wrapper", async () => {
    mockGql.mockResolvedValue({ deleteMilestone: true });
    const result = await handleMilestoneTool("delete_milestone", { milestone_id: "300" });
    expect(result).toEqual({ deleted: true });
    expect(mockGql.mock.calls[0][1]).toEqual({ input: { id: "300" } });
  });
});

describe("activate_milestone", () => {
  it("passes id and optional message", async () => {
    mockGql.mockResolvedValue({
      activateMilestone: { id: "400", state: "Active", depositAmount: MONEY("500", "5.00"), fundedAmount: MONEY("500", "5.00") },
    });
    await handleMilestoneTool("activate_milestone", { milestone_id: "400", message: "Go ahead" });
    const input = mockGql.mock.calls[0][1].input;
    expect(input).toEqual({ id: "400", message: "Go ahead" });
  });

  it("omits message when not provided", async () => {
    mockGql.mockResolvedValue({ activateMilestone: { id: "401" } });
    await handleMilestoneTool("activate_milestone", { milestone_id: "401" });
    expect(mockGql.mock.calls[0][1].input).toEqual({ id: "401" });
  });
});

describe("approve_milestone", () => {
  it("converts paid_amount and bonus_amount to cents strings", async () => {
    mockGql.mockResolvedValue({
      approveMilestone: { id: "500", state: "Paid", paid: MONEY("50000", "500.00"), bonus: ZERO },
    });
    await handleMilestoneTool("approve_milestone", {
      milestone_id: "500", paid_amount: 500, bonus_amount: 50,
      note_to_contractor: "Great work", payment_comment: "On time",
    });
    const input = mockGql.mock.calls[0][1].input;
    expect(input.paidAmount).toBe("50000");
    expect(input.bonusAmount).toBe("5000");
    expect(input.noteToContractor).toBe("Great work");
    expect(input.paymentComment).toBe("On time");
  });

  it("omits optional fields when not provided", async () => {
    mockGql.mockResolvedValue({ approveMilestone: { id: "501" } });
    await handleMilestoneTool("approve_milestone", { milestone_id: "501", paid_amount: 100 });
    const input = mockGql.mock.calls[0][1].input;
    expect(input).not.toHaveProperty("bonusAmount");
    expect(input).not.toHaveProperty("noteToContractor");
    expect(input).not.toHaveProperty("paymentComment");
  });
});

describe("reject_milestone", () => {
  it("returns rejected boolean wrapper", async () => {
    mockGql.mockResolvedValue({ rejectSubmittedMilestone: { response: true } });
    const result = await handleMilestoneTool("reject_milestone", {
      milestone_id: "600", note_to_contractor: "Needs revision",
    });
    expect(result).toEqual({ rejected: true });
    expect(mockGql.mock.calls[0][1].input).toEqual({ id: "600", noteToContractor: "Needs revision" });
  });
});
