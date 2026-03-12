import { gql } from "../graphql/client.js";
export const userTools = [
    {
        name: "get_current_user",
        description: "Get current authenticated user ID, name and organization.",
        inputSchema: { type: "object", properties: {} },
    },
];
export async function handleUserTool(name, _args) {
    switch (name) {
        case "get_current_user": {
            return await gql(`query { user { id nid rid name } organization { id } }`);
        }
        default:
            throw new Error(`Unknown user tool: ${name}`);
    }
}
//# sourceMappingURL=user.js.map