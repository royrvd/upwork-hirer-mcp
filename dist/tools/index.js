import { authTools, handleAuthTool } from "./auth.js";
import { introspectionTools, handleIntrospectionTool } from "./introspection.js";
import { userTools, handleUserTool } from "./user.js";
import { contractTools, handleContractTool } from "./contracts.js";
import { milestoneTools, handleMilestoneTool } from "./milestones.js";
import { messageTools, handleMessageTool } from "./messages.js";
export const TOOLS = [
    ...authTools,
    ...introspectionTools,
    ...userTools,
    ...contractTools,
    ...milestoneTools,
    ...messageTools,
];
const handlers = {};
for (const tool of authTools)
    handlers[tool.name] = handleAuthTool;
for (const tool of introspectionTools)
    handlers[tool.name] = handleIntrospectionTool;
for (const tool of userTools)
    handlers[tool.name] = handleUserTool;
for (const tool of contractTools)
    handlers[tool.name] = handleContractTool;
for (const tool of milestoneTools)
    handlers[tool.name] = handleMilestoneTool;
for (const tool of messageTools)
    handlers[tool.name] = handleMessageTool;
export async function handleTool(name, args) {
    const handler = handlers[name];
    if (!handler)
        throw new Error(`Unknown tool: ${name}`);
    return handler(name, args);
}
//# sourceMappingURL=index.js.map