import { WebApi } from 'azure-devops-node-api';
import { GitPullRequestIterationChanges } from 'azure-devops-node-api/interfaces/GitInterfaces';
import { PolicyEvaluationRecord } from 'azure-devops-node-api/interfaces/PolicyInterfaces';
import { createTwoFilesPatch } from 'diff';
import { AzureDevOpsError } from '../../../shared/errors';

export interface PullRequestChangesOptions {
  projectId: string;
  repositoryId: string;
  pullRequestId: number;
}

export interface PullRequestChangesResponse {
  changes: GitPullRequestIterationChanges;
  evaluations: PolicyEvaluationRecord[];
  files: Array<{ path: string; patch: string }>;
}

/**
 * Retrieve changes and policy evaluation status for a pull request
 */
export async function getPullRequestChanges(
  connection: WebApi,
  options: PullRequestChangesOptions,
): Promise<PullRequestChangesResponse> {
  try {
    const gitApi = await connection.getGitApi();
    const iterations = await gitApi.getPullRequestIterations(
      options.repositoryId,
      options.pullRequestId,
      options.projectId,
    );
    if (!iterations || iterations.length === 0) {
      throw new AzureDevOpsError('No iterations found for pull request');
    }
    const latest = iterations[iterations.length - 1];
    const changes = await gitApi.getPullRequestIterationChanges(
      options.repositoryId,
      options.pullRequestId,
      latest.id!,
      options.projectId,
    );

    const files = await Promise.all(
      (changes.changeEntries || []).map(async (entry) => {
        const path = entry.item?.path || '';
        let base = '';
        let head = '';

        if (entry.item?.originalObjectId) {
          const stream = await gitApi.getBlobContent(
            options.repositoryId,
            entry.item.originalObjectId,
            options.projectId,
          );
          base = await streamToString(stream);
        }

        if (entry.item?.objectId) {
          const stream = await gitApi.getBlobContent(
            options.repositoryId,
            entry.item.objectId,
            options.projectId,
          );
          head = await streamToString(stream);
        }

        const patch = createTwoFilesPatch(path, path, base, head);
        return { path, patch };
      }),
    );

    const policyApi = await connection.getPolicyApi();
    const artifactId = `vstfs:///CodeReview/CodeReviewId/${options.projectId}/${options.pullRequestId}`;
    const evaluations = await policyApi.getPolicyEvaluations(
      options.projectId,
      artifactId,
    );

    return { changes, evaluations, files };
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    throw new Error(
      `Failed to get pull request changes: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}
