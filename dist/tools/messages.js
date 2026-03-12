import { gql } from "../graphql/client.js";
import { ROOM_FIELDS, STORY_FIELDS } from "../graphql/fragments.js";
export const messageTools = [
    {
        name: "list_rooms",
        description: "List all message rooms/conversations.",
        inputSchema: {
            type: "object",
            properties: {
                unread_only: { type: "boolean", description: "Only rooms with unread messages. Default: false" },
                limit: { type: "number", description: "Max results (default: 20)" },
            },
        },
    },
    {
        name: "get_room",
        description: "Get details of a specific message room.",
        inputSchema: {
            type: "object",
            properties: { room_id: { type: "string" } },
            required: ["room_id"],
        },
    },
    {
        name: "get_room_by_contract",
        description: "Get the message room linked to a specific contract.",
        inputSchema: {
            type: "object",
            properties: { contract_id: { type: "string" } },
            required: ["contract_id"],
        },
    },
    {
        name: "get_messages",
        description: "Get messages from a room.",
        inputSchema: {
            type: "object",
            properties: {
                room_id: { type: "string" },
            },
            required: ["room_id"],
        },
    },
    {
        name: "send_message",
        description: "Send a message in a room.",
        inputSchema: {
            type: "object",
            properties: {
                room_id: { type: "string" },
                message: { type: "string" },
            },
            required: ["room_id", "message"],
        },
    },
    {
        name: "update_message",
        description: "Edit an existing message in a room.",
        inputSchema: {
            type: "object",
            properties: {
                room_id: { type: "string" },
                story_id: { type: "string" },
                message: { type: "string" },
            },
            required: ["room_id", "story_id", "message"],
        },
    },
    {
        name: "delete_message",
        description: "Delete a message from a room.",
        inputSchema: {
            type: "object",
            properties: {
                room_id: { type: "string" },
                story_id: { type: "string" },
            },
            required: ["room_id", "story_id"],
        },
    },
];
export async function handleMessageTool(name, args) {
    switch (name) {
        case "list_rooms": {
            const filter = args.unread_only ? { unreadRoomsOnly_eq: true } : {};
            const pagination = args.limit ? { first: args.limit } : undefined;
            const data = await gql(`
        query ListRooms($filter: RoomFilter, $pagination: Pagination) {
          roomList(filter: $filter, pagination: $pagination) {
            edges { node { ${ROOM_FIELDS} } }
          }
        }
      `, { filter, ...(pagination ? { pagination } : {}) });
            return data.roomList?.edges?.map((e) => e.node) || [];
        }
        case "get_room": {
            const data = await gql(`
        query GetRoom($id: ID!) {
          room(id: $id) { ${ROOM_FIELDS} }
        }
      `, { id: args.room_id });
            return data.room;
        }
        case "get_room_by_contract": {
            const data = await gql(`
        query ContractRoom($contractId: ID!) {
          contractRoom(contractId: $contractId) { ${ROOM_FIELDS} }
        }
      `, { contractId: args.contract_id });
            return data.contractRoom;
        }
        case "get_messages": {
            const data = await gql(`
        query RoomStories($filter: RoomStoryFilter) {
          roomStories(filter: $filter) {
            ${STORY_FIELDS}
            attachments { id url name }
          }
        }
      `, { filter: { roomId_eq: args.room_id } });
            return data.roomStories || [];
        }
        case "send_message": {
            const data = await gql(`
        mutation SendMessage($input: RoomStoryCreateInputV2!) {
          createRoomStoryV2(input: $input) { ${STORY_FIELDS} }
        }
      `, { input: { roomId: args.room_id, message: args.message } });
            return data.createRoomStoryV2;
        }
        case "update_message": {
            const data = await gql(`
        mutation UpdateMessage($input: RoomStoryUpdateInputV2!) {
          updateRoomStoryV2(input: $input) { status }
        }
      `, { input: { roomId: args.room_id, storyId: args.story_id, message: args.message } });
            return { status: data.updateRoomStoryV2?.status };
        }
        case "delete_message": {
            const data = await gql(`
        mutation DeleteMessage($roomId: ID!, $storyId: ID!) {
          removeRoomStory(roomId: $roomId, storyId: $storyId)
        }
      `, { roomId: args.room_id, storyId: args.story_id });
            return { deleted: data.removeRoomStory };
        }
        default:
            throw new Error(`Unknown message tool: ${name}`);
    }
}
//# sourceMappingURL=messages.js.map