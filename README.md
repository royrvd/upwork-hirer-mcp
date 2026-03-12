# Upwork Hirer MCP

**Let Claude manage your freelancers.** Track contracts, fund milestones, message your team — all through natural conversation.

```
You:    "Do I have any unread messages from freelancers?"
Claude: 2 unread — Jane D. asked about the design specs,
        and Alex M. submitted milestone #3 for review.

You:    "Approve Alex's milestone for $250 and tell Jane I'll send specs tomorrow"
Claude: Done. Milestone #3 approved — $250 released to Alex.
        Message sent to Jane: "I'll send the specs over tomorrow."
```

No more context-switching between Upwork tabs. Check messages, approve submitted work, create milestones, pause contracts — anything you'd do in the Upwork dashboard, but faster.

---

## Why?

- **Stay in flow** — manage freelancers without leaving your IDE or chat
- **Batch operations** — "Create milestones for the next 4 weeks at $600 each"
- **Never miss a message** — "Do I have any unread messages from my contractors?"
- **Full visibility** — "Show me all active contracts and their milestone status"
- **Safe** — OAuth2 with automatic token refresh, credentials never stored in code

---

## Quick Start

### 1. Get Upwork API credentials

Create an app at [upwork.com/developer](https://www.upwork.com/developer/keys/apply). Set the **Redirect URI** to `http://localhost:3000/callback` — this is required for the OAuth flow. Then grab your Client ID and Client Secret.

### 2. Install

**Claude Desktop** — add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "upwork-hirers": {
      "command": "npx",
      "args": ["github:royrvd/upwork-hirer-mcp"],
      "env": {
        "UPWORK_CLIENT_ID": "your_client_id",
        "UPWORK_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

**Claude Code:**

```bash
claude mcp add upwork-hirers \
  -e UPWORK_CLIENT_ID=your_client_id \
  -e UPWORK_CLIENT_SECRET=your_client_secret \
  -- npx github:royrvd/upwork-hirer-mcp
```

### 3. Authenticate

Ask Claude to start the auth flow. It will give you a URL — open it, log in to Upwork, and you're done. Tokens are saved locally and refresh automatically.

---

## What can Claude do with this?

| | |
|---|---|
| **Contracts** | List your contracts, get full details with milestones, pause or restart engagements |
| **Milestones** | Create, update, fund, approve, reject, or delete milestones on fixed-price contracts |
| **Messages** | Read conversations, send messages to freelancers, edit or delete messages |
| **Schema Explorer** | Introspect the Upwork GraphQL API to discover new capabilities |

### All 27 Tools

`auth_start` `auth_status` `list_my_contracts` `get_contract` `get_contracts_by_ids` `pause_contract` `restart_contract` `list_milestones` `create_milestone` `update_milestone` `delete_milestone` `activate_milestone` `approve_milestone` `reject_milestone` `list_rooms` `get_room` `get_room_by_contract` `get_messages` `send_message` `update_message` `delete_message` `get_current_user` `introspect_queries` `introspect_mutations` `introspect_type` `introspect_all_inputs` `introspect_mutation_inputs`

---

## Development

```bash
git clone https://github.com/royrvd/upwork-hirer-mcp.git
cd upwork-hirer-mcp
pnpm install
pnpm build

# Run with MCP Inspector
UPWORK_CLIENT_ID=... UPWORK_CLIENT_SECRET=... pnpm inspect

# Run tests (47 tests, all mocked — no API calls)
pnpm test
```

### Project Structure

```
src/
├── index.ts                 # MCP server entry point
├── config.ts                # Environment variables, API URLs
├── auth/
│   ├── oauth.ts             # OAuth2 flow (auth URL, callback, token exchange)
│   └── tokenManager.ts      # Token persistence (~/.upwork_tokens.json)
├── graphql/
│   ├── client.ts            # Authenticated GraphQL client with auto-refresh
│   └── fragments.ts         # Shared field selections (Money, Milestone, Room, etc.)
└── tools/
    ├── index.ts             # Tool registry and dispatcher
    ├── auth.ts              # auth_start, auth_status
    ├── contracts.ts         # Contract queries and mutations
    ├── milestones.ts        # Milestone CRUD
    ├── messages.ts          # Room and message operations
    ├── introspection.ts     # GraphQL schema exploration
    └── user.ts              # Current user info
```

## License

MIT
