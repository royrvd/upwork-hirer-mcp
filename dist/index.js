#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { TOOLS, handleTool } from "./tools/index.js";
const server = new Server({ name: "upwork-hirer-mcp", version: "2.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
        const result = await handleTool(name, args || {});
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    catch (err) {
        return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Upwork Hirer MCP server running v2.0.0");
//# sourceMappingURL=index.js.map