import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGql = vi.fn();
vi.mock("../graphql/client.js", () => ({ gql: (...args: any[]) => mockGql(...args) }));

const { handleMessageTool } = await import("../tools/messages.js");

beforeEach(() => mockGql.mockReset());

describe("list_rooms", () => {
  it("extracts nodes from edges", async () => {
    mockGql.mockResolvedValue({
      roomList: {
        edges: [
          { node: { id: "r1", topic: "Room 1", numUnread: 0, contractId: "c1", roomType: "ONE_ON_ONE" } },
          { node: { id: "r2", topic: "Room 2", numUnread: 3, contractId: "c2", roomType: "ONE_ON_ONE" } },
        ],
      },
    });
    const result = await handleMessageTool("list_rooms", {}) as any[];
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("r1");
  });

  it("passes unread filter when unread_only is true", async () => {
    mockGql.mockResolvedValue({ roomList: { edges: [] } });
    await handleMessageTool("list_rooms", { unread_only: true });
    expect(mockGql.mock.calls[0][1].filter).toEqual({ unreadRoomsOnly_eq: true });
  });

  it("passes empty filter when unread_only is false", async () => {
    mockGql.mockResolvedValue({ roomList: { edges: [] } });
    await handleMessageTool("list_rooms", {});
    expect(mockGql.mock.calls[0][1].filter).toEqual({});
  });

  it("passes pagination when limit provided", async () => {
    mockGql.mockResolvedValue({ roomList: { edges: [] } });
    await handleMessageTool("list_rooms", { limit: 5 });
    expect(mockGql.mock.calls[0][1].pagination).toEqual({ first: 5 });
  });

  it("omits pagination when no limit", async () => {
    mockGql.mockResolvedValue({ roomList: { edges: [] } });
    await handleMessageTool("list_rooms", {});
    expect(mockGql.mock.calls[0][1]).not.toHaveProperty("pagination");
  });

  it("returns empty array when no rooms", async () => {
    mockGql.mockResolvedValue({ roomList: { edges: [] } });
    const result = await handleMessageTool("list_rooms", {});
    expect(result).toEqual([]);
  });
});

describe("get_room", () => {
  it("passes room_id and returns room data", async () => {
    mockGql.mockResolvedValue({ room: { id: "r1", topic: "Test Room" } });
    const result = await handleMessageTool("get_room", { room_id: "r1" }) as any;
    expect(result.topic).toBe("Test Room");
    expect(mockGql.mock.calls[0][1]).toEqual({ id: "r1" });
  });
});

describe("get_room_by_contract", () => {
  it("passes contract_id as contractId", async () => {
    mockGql.mockResolvedValue({ contractRoom: { id: "r1", contractId: "c1" } });
    await handleMessageTool("get_room_by_contract", { contract_id: "c1" });
    expect(mockGql.mock.calls[0][1]).toEqual({ contractId: "c1" });
  });
});

describe("get_messages", () => {
  it("passes roomId_eq filter", async () => {
    mockGql.mockResolvedValue({
      roomStories: [
        { id: "s1", message: "Hello", createdDateTime: "2026-03-01T00:00:00Z", user: { id: "u1", name: "Alice" } },
      ],
    });
    const result = await handleMessageTool("get_messages", { room_id: "r1" }) as any[];
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe("Hello");
    expect(mockGql.mock.calls[0][1].filter).toEqual({ roomId_eq: "r1" });
  });

  it("returns empty array when no stories", async () => {
    mockGql.mockResolvedValue({ roomStories: null });
    const result = await handleMessageTool("get_messages", { room_id: "r1" });
    expect(result).toEqual([]);
  });
});

describe("send_message", () => {
  it("passes roomId and message in input", async () => {
    mockGql.mockResolvedValue({
      createRoomStoryV2: { id: "s1", message: "Hi there", createdDateTime: "2026-03-01T00:00:00Z" },
    });
    const result = await handleMessageTool("send_message", { room_id: "r1", message: "Hi there" }) as any;
    expect(result.message).toBe("Hi there");
    expect(mockGql.mock.calls[0][1].input).toEqual({ roomId: "r1", message: "Hi there" });
  });
});

describe("update_message", () => {
  it("returns status from UpdateRoomStoryResponse", async () => {
    mockGql.mockResolvedValue({ updateRoomStoryV2: { status: "success" } });
    const result = await handleMessageTool("update_message", {
      room_id: "r1", story_id: "s1", message: "Edited",
    }) as any;
    expect(result).toEqual({ status: "success" });
    expect(mockGql.mock.calls[0][1].input).toEqual({ roomId: "r1", storyId: "s1", message: "Edited" });
  });
});

describe("delete_message", () => {
  it("returns deleted wrapper from scalar response", async () => {
    mockGql.mockResolvedValue({ removeRoomStory: "s1" });
    const result = await handleMessageTool("delete_message", { room_id: "r1", story_id: "s1" });
    expect(result).toEqual({ deleted: "s1" });
    expect(mockGql.mock.calls[0][1]).toEqual({ roomId: "r1", storyId: "s1" });
  });
});
