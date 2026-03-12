import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { gql } from "../graphql/client.js";
import { CONTRACT_FIELDS, MILESTONE_FIELDS } from "../graphql/fragments.js";

export const contractTools: Tool[] = [
  {
    name: "list_my_contracts",
    description: "List all contracts where you are the hirer, resolved via message rooms.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max rooms to scan. Default: 20" },
      },
    },
  },
  {
    name: "get_contract",
    description: "Get full contract details including milestones by contract ID.",
    inputSchema: {
      type: "object" as const,
      properties: { contract_id: { type: "string" } },
      required: ["contract_id"],
    },
  },
  {
    name: "get_contracts_by_ids",
    description: "Get multiple contracts by their IDs.",
    inputSchema: {
      type: "object" as const,
      properties: {
        contract_ids: { type: "array", items: { type: "string" } },
      },
      required: ["contract_ids"],
    },
  },
  {
    name: "pause_contract",
    description: "Pause an active contract.",
    inputSchema: {
      type: "object" as const,
      properties: {
        contract_id: { type: "string" },
        message: { type: "string" },
      },
      required: ["contract_id"],
    },
  },
  {
    name: "restart_contract",
    description: "Restart a paused contract.",
    inputSchema: {
      type: "object" as const,
      properties: {
        contract_id: { type: "string" },
        message: { type: "string" },
      },
      required: ["contract_id"],
    },
  },
];

export async function handleContractTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "list_my_contracts": {
      const pagination = args.limit ? { first: args.limit as number } : undefined;
      const roomData = await gql(`
        query ListRooms($pagination: Pagination) {
          roomList(pagination: $pagination) {
            edges { node { id topic contractId } }
          }
        }
      `, { ...(pagination ? { pagination } : {}) });

      const rooms = roomData.roomList?.edges?.map((e: any) => e.node) || [];
      const contractIds = [...new Set(rooms.map((r: any) => r.contractId).filter(Boolean))];
      if (!contractIds.length) return { message: "No contracts found via rooms.", rooms };

      const contractData = await gql(`
        query GetContracts($ids: [ID!]) {
          contractList(ids: $ids) {
            contracts { ${CONTRACT_FIELDS} }
          }
        }
      `, { ids: contractIds });
      return contractData.contractList?.contracts || [];
    }

    case "get_contract": {
      const data = await gql(`
        query GetContract($id: ID!) {
          contractByTerm(termId: $id) {
            ${CONTRACT_FIELDS}
            terms {
              fixedPriceTerms {
                milestones { ${MILESTONE_FIELDS} }
              }
            }
          }
        }
      `, { id: args.contract_id as string });
      const contract = data.contractByTerm;
      if (!contract) return null;
      const { terms, ...rest } = contract;
      const milestones = (terms?.fixedPriceTerms || []).flatMap((t: any) => t.milestones || []);
      return { ...rest, milestones };
    }

    case "get_contracts_by_ids": {
      const data = await gql(`
        query GetContracts($ids: [ID!]) {
          contractList(ids: $ids) {
            contracts { ${CONTRACT_FIELDS} }
          }
        }
      `, { ids: args.contract_ids as string[] });
      return data.contractList?.contracts || [];
    }

    case "pause_contract": {
      const data = await gql(`
        mutation PauseContract($contractId: ID!, $message: String) {
          pauseContract(contractId: $contractId, message: $message) { success }
        }
      `, { contractId: args.contract_id as string, message: (args.message as string) || null });
      return { success: data.pauseContract?.success };
    }

    case "restart_contract": {
      const data = await gql(`
        mutation RestartContract($contractId: ID!, $message: String) {
          restartContract(contractId: $contractId, message: $message) { success }
        }
      `, { contractId: args.contract_id as string, message: (args.message as string) || null });
      return { success: data.restartContract?.success };
    }

    default:
      throw new Error(`Unknown contract tool: ${name}`);
  }
}
