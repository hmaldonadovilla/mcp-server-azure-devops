import { WebApi } from 'azure-devops-node-api';
import {
  GitPullRequestIterationChanges,
  GitChange,
} from 'azure-devops-node-api/interfaces/GitInterfaces';
import { PolicyEvaluationRecord } from 'azure-devops-node-api/interfaces/PolicyInterfaces';
import { AzureDevOpsError } from '../../../shared/errors';
import { createTwoFilesPatch } from 'diff';

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

    const policyApi = await connection.getPolicyApi();
    const artifactId = `vstfs:///CodeReview/CodeReviewId/${options.projectId}/${options.pullRequestId}`;
    const evaluations = await policyApi.getPolicyEvaluations(
      options.projectId,
      artifactId,
    );

    const changeEntries = changes.changeEntries ?? [];

    const getBlobText = async (objId?: string): Promise<string> => {
      if (!objId) return '';
      const blob = await gitApi.getBlob(
        options.repositoryId,
        objId,
        options.projectId,
      );
      const content = (blob as any).content as string | undefined;
      return content ? Buffer.from(content, 'base64').toString('utf8') : '';
    };

    const files = await Promise.all(
      changeEntries.map(async (entry: GitChange) => {
        const path = entry.item?.path || entry.originalPath || '';
        const [oldContent, newContent] = await Promise.all([
          getBlobText(entry.item?.originalObjectId),
          getBlobText(entry.item?.objectId),
        ]);
        const patch = createTwoFilesPatch(
          entry.originalPath || path,
          path,
          oldContent,
          newContent,
        );
        return { path, patch };
      }),
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
