export declare const MONEY_FIELDS = "{ rawValue displayValue currency }";
export declare const MILESTONE_FIELDS = "\n  id description state sequenceId instructions dueDateTime\n  submissionCount createdDateTime modifiedDateTime\n  depositAmount { rawValue displayValue currency }\n  fundedAmount { rawValue displayValue currency }\n  paid { rawValue displayValue currency }\n  currentEscrowAmount { rawValue displayValue currency }\n";
export declare const CONTRACT_FIELDS = "\n  id title status kind startDate endDate\n  freelancer { id name }\n  clientOrganization { id name }\n  hiringManager { id name }\n";
export declare const ROOM_FIELDS = "\n  id topic numUnread contractId roomType\n  roomUsers { user { id name } }\n  latestStory { id message createdDateTime }\n";
export declare const STORY_FIELDS = "\n  id message createdDateTime updatedDateTime\n  user { id name }\n";
//# sourceMappingURL=fragments.d.ts.map