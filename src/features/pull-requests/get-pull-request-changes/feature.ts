import { WebApi } from 'azure-devops-node-api';
import { GitPullRequestIterationChanges } from 'azure-devops-node-api/interfaces/GitInterfaces';
import { PolicyEvaluationRecord } from 'azure-devops-node-api/interfaces/PolicyInterfaces';
import { AzureDevOpsError } from '../../../shared/errors';

export interface PullRequestChangesOptions {
  projectId: string;
  repositoryId: string;
  pullRequestId: number;
}

export interface PullRequestChangesResponse {
  changes: GitPullRequestIterationChanges;
  evaluations: PolicyEvaluationRecord[];
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

    return { changes, evaluations };
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    throw new Error(
      `Failed to get pull request changes: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
