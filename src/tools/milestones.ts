import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { gql } from "../graphql/client.js";
import { MILESTONE_FIELDS } from "../graphql/fragments.js";

function dollarsToCents(dollars: number): string {
  return String(Math.round(dollars * 100));
}

export const milestoneTools: Tool[] = [
  {
    name: "list_milestones",
    description: "List all milestones for a fixed-price contract.",
    inputSchema: {
      type: "object" as const,
      properties: { contract_id: { type: "string" } },
      required: ["contract_id"],
    },
  },
  {
    name: "create_milestone",
    description: "Create a new milestone on a fixed-price contract.",
    inputSchema: {
      type: "object" as const,
      properties: {
        contract_id: { type: "string" },
        description: { type: "string" },
        amount: { type: "number", description: "USD amount (min $5)" },
        due_date: { type: "string", description: "YYYY-MM-DD (optional)" },
        instructions: { type: "string", description: "Additional instructions (optional)" },
      },
      required: ["contract_id", "description", "amount"],
    },
  },
  {
    name: "update_milestone",
    description: "Update a future (non-active) milestone.",
    inputSchema: {
      type: "object" as const,
      properties: {
        milestone_id: { type: "string" },
        description: { type: "string" },
        amount: { type: "number", description: "USD amount" },
        due_date: { type: "string", description: "YYYY-MM-DD" },
        instructions: { type: "string" },
        message: { type: "string", description: "Message to freelancer about the change" },
      },
      required: ["milestone_id"],
    },
  },
  {
    name: "delete_milestone",
    description: "Delete a future (non-active, non-funded) milestone.",
    inputSchema: {
      type: "object" as const,
      properties: { milestone_id: { type: "string" } },
      required: ["milestone_id"],
    },
  },
  {
    name: "activate_milestone",
    description: "Activate and fund the next milestone (puts funds in escrow).",
    inputSchema: {
      type: "object" as const,
      properties: {
        milestone_id: { type: "string" },
        message: { type: "string", description: "Optional message to freelancer" },
      },
      required: ["milestone_id"],
    },
  },
  {
    name: "approve_milestone",
    description: "Approve submitted work and release payment to the freelancer.",
    inputSchema: {
      type: "object" as const,
      properties: {
        milestone_id: { type: "string" },
        paid_amount: { type: "number", description: "USD amount to release (required)" },
        bonus_amount: { type: "number", description: "Optional bonus in USD" },
        note_to_contractor: { type: "string", description: "Optional note to freelancer" },
        payment_comment: { type: "string", description: "Optional payment comment" },
      },
      required: ["milestone_id", "paid_amount"],
    },
  },
  {
    name: "reject_milestone",
    description: "Reject submitted milestone work and request changes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        milestone_id: { type: "string" },
        note_to_contractor: { type: "string", description: "Feedback / reason for rejection" },
      },
      required: ["milestone_id", "note_to_contractor"],
    },
  },
];

export async function handleMilestoneTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "list_milestones": {
      const data = await gql(`
        query GetContractTerm($id: ID!) {
          contractByTerm(termId: $id) {
            terms {
              fixedPriceTerms {
                milestones { ${MILESTONE_FIELDS} }
              }
            }
          }
        }
      `, { id: args.contract_id as string });
      const terms = data.contractByTerm?.terms?.fixedPriceTerms || [];
      return terms.flatMap((t: any) => t.milestones || []);
    }

    case "create_milestone": {
      const data = await gql(`
        mutation CreateMilestone($input: CreateMilestoneInput!) {
          createMilestoneV2(input: $input) { ${MILESTONE_FIELDS} }
        }
      `, {
        input: {
          contractId: args.contract_id as string,
          description: args.description as string,
          depositAmount: dollarsToCents(args.amount as number),
          ...(args.due_date ? { dueDate: args.due_date as string } : {}),
          ...(args.instructions ? { instruction: args.instructions as string } : {}),
        },
      });
      return data.createMilestoneV2;
    }

    case "update_milestone": {
      const input: Record<string, unknown> = { id: args.milestone_id as string };
      if (args.description !== undefined) input.description = args.description;
      if (args.amount !== undefined) input.depositAmount = dollarsToCents(args.amount as number);
      if (args.due_date !== undefined) input.dueDate = args.due_date;
      if (args.instructions !== undefined) input.instructions = args.instructions;
      if (args.message !== undefined) input.message = args.message;
      const data = await gql(`
        mutation EditMilestone($input: EditMilestoneInput!) {
          editMilestone(input: $input) { ${MILESTONE_FIELDS} }
        }
      `, { input });
      return data.editMilestone;
    }

    case "delete_milestone": {
      const data = await gql(`
        mutation DeleteMilestone($input: DeleteMilestoneInput!) {
          deleteMilestone(input: $input)
        }
      `, { input: { id: args.milestone_id as string } });
      return { deleted: data.deleteMilestone };
    }

    case "activate_milestone": {
      const data = await gql(`
        mutation ActivateMilestone($input: ActivateMilestoneInput) {
          activateMilestone(input: $input) { ${MILESTONE_FIELDS} }
        }
      `, { input: { id: args.milestone_id as string, ...(args.message ? { message: args.message as string } : {}) } });
      return data.activateMilestone;
    }

    case "approve_milestone": {
      const data = await gql(`
        mutation ApproveMilestone($input: ApproveMilestoneInput!) {
          approveMilestone(input: $input) { ${MILESTONE_FIELDS} }
        }
      `, {
        input: {
          id: args.milestone_id as string,
          paidAmount: dollarsToCents(args.paid_amount as number),
          ...(args.bonus_amount ? { bonusAmount: dollarsToCents(args.bonus_amount as number) } : {}),
          ...(args.note_to_contractor ? { noteToContractor: args.note_to_contractor as string } : {}),
          ...(args.payment_comment ? { paymentComment: args.payment_comment as string } : {}),
        },
      });
      return data.approveMilestone;
    }

    case "reject_milestone": {
      const data = await gql(`
        mutation RejectMilestone($input: RejectMilestoneSubmissionInput!) {
          rejectSubmittedMilestone(input: $input) { response }
        }
      `, { input: { id: args.milestone_id as string, noteToContractor: args.note_to_contractor as string } });
      return { rejected: data.rejectSubmittedMilestone?.response };
    }

    default:
      throw new Error(`Unknown milestone tool: ${name}`);
  }
}
