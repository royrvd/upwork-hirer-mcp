import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { gql } from "../graphql/client.js";

export const userTools: Tool[] = [
  {
    name: "get_current_user",
    description: "Get current authenticated user ID, name and organization.",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

export async function handleUserTool(name: string, _args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "get_current_user": {
      return await gql(`query { user { id nid rid name } organization { id } }`);
    }
    default:
      throw new Error(`Unknown user tool: ${name}`);
  }
}
