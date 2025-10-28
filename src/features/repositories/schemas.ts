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
              [
                'Unified git diff for a single file.',
                'MUST include `diff --git`, `--- a/...`, `+++ b/...`, and complete hunk headers.',
                'CRITICAL: Every hunk header must have line numbers in format: @@ -oldStart,oldLines +newStart,newLines @@',
                'Do NOT use @@ without the line range numbers - this will cause parsing failures.',
                'Include 3-5 context lines before and after changes for proper patch application.',
                'Use `/dev/null` with `---` for new files, or with `+++` for deleted files.',
                '',
                'Example modify patch:',
                '```diff',
                'diff --git a/charts/bcs-mcp-server/templates/service-api.yaml b/charts/bcs-mcp-server/templates/service-api.yaml',
                '--- a/charts/bcs-mcp-server/templates/service-api.yaml',
                '+++ b/charts/bcs-mcp-server/templates/service-api.yaml',
                '@@ -4,7 +4,7 @@ spec:',
                ' spec:',
                '   type: {{ .Values.service.type }}',
                '   ports:',
                '-    - port: 8080',
                '+    - port: 9090',
                '     targetPort: deployment-port',
                '     protocol: TCP',
                '     name: http',
                '```',
              ].join('\n'),
            ),
        }),
      )
      .describe('List of file changes represented as unified git diffs'),
  })
  .describe(
    [
      'Create a commit on an existing branch using one or more unified git diff patches.',
      '- Provide plain branch names (no "refs/heads/").',
      '- Each patch MUST be a complete, valid unified diff with ALL hunk headers in the format: @@ -oldStart,oldLines +newStart,newLines @@',
      '- CRITICAL: Every @@ marker MUST include the line numbers. Do NOT use @@ without line ranges.',
      '- Each hunk should include sufficient context lines (typically 3-5 lines before and after changes).',
      '- Use a single continuous hunk per file when possible to avoid coordination issues.',
      '- Optional `path` field is only a hint; the diff headers (--- a/... and +++ b/...) control the actual file path.',
      '- For deletions, use: `--- a/filepath` and `+++ /dev/null`',
      '- For additions, use: `--- /dev/null` and `+++ b/filepath`',
      '',
      'Example input:',
      '```json',
      '{',
      '  "projectId": "GHQ_B2B_Delta",',
      '  "repositoryId": "bees-microservices",',
      '  "branchName": "feature/runtime-hardening",',
      '  "commitMessage": "chore: align service ports",',
      '  "changes": [',
      '    {',
      '      "patch": "diff --git a/charts/bcs-mcp-server/templates/service-api.yaml b/charts/bcs-mcp-server/templates/service-api.yaml\\n--- a/charts/bcs-mcp-server/templates/service-api.yaml\\n+++ b/charts/bcs-mcp-server/templates/service-api.yaml\\n@@ -4,7 +4,7 @@ spec:\\n spec:\\n   type: {{ .Values.service.type }}\\n   ports:\\n-    - port: 8080\\n+    - port: 9090\\n       targetPort: deployment-port\\n       protocol: TCP\\n       name: http\\n"',
      '    }',
      '  ]',
      '}',
      '```',
      '',
      'COMMON MISTAKES TO AVOID:',
      '- ❌ Using @@ without line numbers: "@@ ... @@"',
      '- ❌ Multiple hunks without proper headers for each hunk',
      '- ❌ Missing context lines around changes',
      '- ✅ Always use: "@@ -startLine,lineCount +startLine,lineCount @@"',
    ].join('\n'),
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
