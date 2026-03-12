export const MONEY_FIELDS = `{ rawValue displayValue currency }`;

export const MILESTONE_FIELDS = `
  id description state sequenceId instructions dueDateTime
  submissionCount createdDateTime modifiedDateTime
  depositAmount ${MONEY_FIELDS}
  fundedAmount ${MONEY_FIELDS}
  paid ${MONEY_FIELDS}
  currentEscrowAmount ${MONEY_FIELDS}
`;

export const CONTRACT_FIELDS = `
  id title status kind startDate endDate
  freelancer { id name }
  clientOrganization { id name }
  hiringManager { id name }
`;

export const ROOM_FIELDS = `
  id topic numUnread contractId roomType
  roomUsers { user { id name } }
  latestStory { id message createdDateTime }
`;

export const STORY_FIELDS = `
  id message createdDateTime updatedDateTime
  user { id name }
`;
