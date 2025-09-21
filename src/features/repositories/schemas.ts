import { z } from 'zod';
import { defaultProject, defaultOrg } from '../../utils/environment';

/**
 * Schema for getting a repository
 */
export const GetRepositorySchema = z.object({
  projectId: z
    .string()
    .optional()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  organizationId: z
    .string()
    .optional()
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  repositoryId: z.string().describe('The ID or name of the repository'),
});

/**
 * Schema for getting detailed repository information
 */
export const GetRepositoryDetailsSchema = z.object({
  projectId: z
    .string()
    .optional()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  organizationId: z
    .string()
    .optional()
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  repositoryId: z.string().describe('The ID or name of the repository'),
  includeStatistics: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include branch statistics'),
  includeRefs: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include repository refs'),
  refFilter: z
    .string()
    .optional()
    .describe('Optional filter for refs (e.g., "heads/" or "tags/")'),
  branchName: z
    .string()
    .optional()
    .describe(
      'Name of specific branch to get statistics for (if includeStatistics is true)',
    ),
});

/**
 * Schema for listing repositories
 */
export const ListRepositoriesSchema = z.object({
  projectId: z
    .string()
    .optional()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  organizationId: z
    .string()
    .optional()
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  includeLinks: z
    .boolean()
    .optional()
    .describe('Whether to include reference links'),
});

/**
 * Schema for getting file content
 */
export const GetFileContentSchema = z.object({
  projectId: z
    .string()
    .optional()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  organizationId: z
    .string()
    .optional()
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  repositoryId: z.string().describe('The ID or name of the repository'),
  path: z
    .string()
    .optional()
    .default('/')
    .describe('Path to the file or folder'),
  version: z
    .string()
    .optional()
    .describe('The version (branch, tag, or commit) to get content from'),
  versionType: z
    .enum(['branch', 'commit', 'tag'])
    .optional()
    .describe('Type of version specified (branch, commit, or tag)'),
});

/**
 * Schema for getting all repositories tree structure
 */
export const GetAllRepositoriesTreeSchema = z.object({
  organizationId: z
    .string()
    .optional()
    .describe(
      `The ID or name of the Azure DevOps organization (Default: ${defaultOrg})`,
    ),
  projectId: z
    .string()
    .optional()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  repositoryPattern: z
    .string()
    .optional()
    .describe(
      'Repository name pattern (wildcard characters allowed) to filter which repositories are included',
    ),
  depth: z
    .number()
    .int()
    .min(0)
    .max(10)
    .optional()
    .default(0)
    .describe(
      'Maximum depth to traverse within each repository (0 = unlimited)',
    ),
  pattern: z
    .string()
    .optional()
    .describe(
      'File pattern (wildcard characters allowed) to filter files by within each repository',
    ),
});

/**
 * Schema for getting a tree for a single repository
 */
export const GetRepositoryTreeSchema = z.object({
  projectId: z
    .string()
    .optional()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  organizationId: z
    .string()
    .optional()
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  repositoryId: z.string().describe('The ID or name of the repository'),
  path: z
    .string()
    .optional()
    .default('/')
    .describe('Path within the repository to start from'),
  depth: z
    .number()
    .int()
    .min(0)
    .max(10)
    .optional()
    .default(0)
    .describe('Maximum depth to traverse (0 = unlimited)'),
});

/**
 * Schema for creating a new branch
 */
export const CreateBranchSchema = z
  .object({
    projectId: z
      .string()
      .optional()
      .describe(`The ID or name of the project (Default: ${defaultProject})`),
    organizationId: z
      .string()
      .optional()
      .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
    repositoryId: z.string().describe('The ID or name of the repository'),
    sourceBranch: z
      .string()
      .describe(
        'Name of the branch to copy from (without "refs/heads/", e.g., "master")',
      ),
    newBranch: z
      .string()
      .describe(
        'Name of the new branch to create (without "refs/heads/", e.g., "feature/my-branch")',
      ),
  })
  .describe(
    'Create a new branch from an existing branch.\n' +
      '- Pass plain branch names (no "refs/heads/"). Example: sourceBranch="master", newBranch="codex/test1".\n' +
      '- When creating pull requests later, use fully-qualified refs (e.g., "refs/heads/codex/test1").',
  );

/**
 * Schema for creating a commit with multiple file changes
 */
export const CreateCommitSchema = z
  .object({
    projectId: z
      .string()
      .optional()
      .describe(`The ID or name of the project (Default: ${defaultProject})`),
    organizationId: z
      .string()
      .optional()
      .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
    repositoryId: z.string().describe('The ID or name of the repository'),
    branchName: z
      .string()
      .describe(
        'The branch to commit to (without "refs/heads/", e.g., "codex/test2-delete-main-py")',
      ),
    commitMessage: z.string().describe('Commit message'),
    changes: z
      .array(
        z.object({
          path: z
            .string()
            .optional()
            .describe(
              'Optional file path hint; defaults to the diff header path',
            ),
          patch: z
            .string()
            .describe(
              'Unified git diff patch. Supports add/modify/delete.\n' +
                '- Modify: include hunks with @@ headers using paths like "--- a/path" and "+++ b/path".\n' +
                '- Add: use "/dev/null" -> "b/path" with hunk content.\n' +
                '- Delete: use minimal form: "diff --git a/path b/path\\ndeleted file mode 100644\\n--- a/path\\n+++ /dev/null\\n" (no hunk required).',
            ),
        }),
      )
      .describe('List of file changes represented as unified git diffs'),
  })
  .describe(
    'Create a commit on an existing branch using one or more unified git diff patches.\n' +
      '- Use plain branch names (no "refs/heads/").\n' +
      '- The optional "path" is only a hint; the diff headers are authoritative.\n' +
      '- For file deletion, prefer the minimal deleted-file patch shown above.',
  );

/**
 * Schema for listing commits on a branch
 */
export const ListCommitsSchema = z.object({
  projectId: z
    .string()
    .optional()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  organizationId: z
    .string()
    .optional()
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  repositoryId: z.string().describe('The ID or name of the repository'),
  branchName: z.string().describe('Branch name to list commits from'),
  top: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of commits to return (Default: 10)'),
  skip: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Number of commits to skip from the newest'),
});
