import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { gql } from "../graphql/client.js";

export const introspectionTools: Tool[] = [
  {
    name: "introspect_all_inputs",
    description: "Fetches all key input and return types in one shot. Run before testing mutations to pre-validate field names.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "introspect_type",
    description: "Inspect any GraphQL type by name (e.g. 'Room', 'Milestone', 'ActivateMilestoneInput').",
    inputSchema: {
      type: "object" as const,
      properties: { type_name: { type: "string" } },
      required: ["type_name"],
    },
  },
  {
    name: "introspect_mutations",
    description: "List all available GraphQL mutations.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "introspect_queries",
    description: "List all available GraphQL root query fields.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "introspect_mutation_inputs",
    description: "Fetches the exact input type names and their fields for specific mutations. Use this to discover the real input type names when introspect_all_inputs returns 'not found'.",
    inputSchema: {
      type: "object" as const,
      properties: {
        mutation_names: {
          type: "array",
          items: { type: "string" },
          description: "List of mutation names to inspect, e.g. ['createRoomStoryV2', 'updateRoomStoryV2', 'createMilestoneV2']",
        },
      },
      required: ["mutation_names"],
    },
  },
];

export async function handleIntrospectionTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "introspect_mutation_inputs": {
      const data = await gql(`query { __schema { mutationType { fields {
        name args { name type { name kind ofType { name kind ofType { name kind } } } }
      }}}}`);

      const allMutations = data.__schema.mutationType.fields;
      const results: Record<string, unknown> = {};

      for (const mutName of args.mutation_names as string[]) {
        const mut = allMutations.find((m: any) => m.name === mutName);
        if (!mut) { results[mutName] = { error: "mutation not found" }; continue; }

        const mutArgs: unknown[] = [];
        for (const arg of mut.args) {
          const typeName = arg.type.name
            || arg.type.ofType?.name
            || arg.type.ofType?.ofType?.name;

          if (!typeName) {
            mutArgs.push({ name: arg.name, type: "unknown" });
            continue;
          }

          try {
            const typeData = await gql(`
              query InspectType($name: String!) {
                __type(name: $name) {
                  name kind
                  inputFields { name description type { name kind ofType { name kind } } }
                }
              }
            `, { name: typeName });
            mutArgs.push({ name: arg.name, type: typeName, fields: typeData.__type?.inputFields || [] });
          } catch (e: any) {
            mutArgs.push({ name: arg.name, type: typeName, error: e.message });
          }
        }
        results[mutName] = { args: mutArgs };
      }
      return results;
    }

    case "introspect_all_inputs": {
      const types = [
        "RoomStoryFilter", "RoomStory", "RoomStoryConnection",
        "CreateRoomStoryInputV2", "UpdateRoomStoryInputV2",
        "CreateMilestoneInputV2", "EditMilestoneInput", "DeleteMilestoneInput",
        "ActivateMilestoneInput", "ApproveMilestoneInput", "RejectMilestoneSubmissionInput",
        "ContractDetails", "Milestone", "RoomFilter", "Pagination",
      ];
      const results: Record<string, unknown> = {};
      await Promise.all(types.map(async (typeName) => {
        try {
          const data = await gql(`
            query InspectType($name: String!) {
              __type(name: $name) {
                name kind
                fields      { name type { name kind ofType { name kind } } }
                inputFields { name type { name kind ofType { name kind } } }
              }
            }
          `, { name: typeName });
          results[typeName] = data.__type || { error: "not found" };
        } catch (e: any) {
          results[typeName] = { error: e.message };
        }
      }));
      return results;
    }

    case "introspect_type": {
      const data = await gql(`
        query InspectType($name: String!) {
          __type(name: $name) {
            name kind description
            fields      { name description type { name kind ofType { name kind } } }
            inputFields { name description type { name kind ofType { name kind } } }
            enumValues  { name description }
          }
        }
      `, { name: args.type_name as string });
      if (!data.__type) throw new Error(`Type '${args.type_name}' not found in schema.`);
      return data.__type;
    }

    case "introspect_mutations": {
      const data = await gql(`query { __schema { mutationType { fields {
        name description args { name type { name kind } }
      }}}}`);
      return data.__schema.mutationType.fields.map((f: any) => ({
        name: f.name, description: f.description,
        args: f.args.map((a: any) => `${a.name}: ${a.type.name || a.type.kind}`),
      }));
    }

    case "introspect_queries": {
      const data = await gql(`query { __schema { queryType { fields {
        name description args { name type { name kind } }
      }}}}`);
      return data.__schema.queryType.fields.map((f: any) => ({
        name: f.name, description: f.description,
        args: f.args.map((a: any) => `${a.name}: ${a.type.name || a.type.kind}`),
      }));
    }

    default:
      throw new Error(`Unknown introspection tool: ${name}`);
  }
}
