import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { authTools, handleAuthTool } from "./auth.js";
import { introspectionTools, handleIntrospectionTool } from "./introspection.js";
import { userTools, handleUserTool } from "./user.js";
import { contractTools, handleContractTool } from "./contracts.js";
import { milestoneTools, handleMilestoneTool } from "./milestones.js";
import { messageTools, handleMessageTool } from "./messages.js";

export const TOOLS: Tool[] = [
  ...authTools,
  ...introspectionTools,
  ...userTools,
  ...contractTools,
  ...milestoneTools,
  ...messageTools,
];

const handlers: Record<string, (name: string, args: Record<string, unknown>) => Promise<unknown>> = {};

for (const tool of authTools) handlers[tool.name] = handleAuthTool;
for (const tool of introspectionTools) handlers[tool.name] = handleIntrospectionTool;
for (const tool of userTools) handlers[tool.name] = handleUserTool;
for (const tool of contractTools) handlers[tool.name] = handleContractTool;
for (const tool of milestoneTools) handlers[tool.name] = handleMilestoneTool;
for (const tool of messageTools) handlers[tool.name] = handleMessageTool;

export async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const handler = handlers[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler(name, args);
}
