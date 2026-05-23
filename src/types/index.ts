export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;

export type ROLES = "contributor" | "maintainer";
export type GetAllIssuesParams = {
    sort?: 'newest' | 'oldest';
    type?: 'bug' | 'feature_request' | undefined;
    status?: 'open' | 'in_progress' | 'resolved' | undefined;
};