import { getPullRequestChecks } from './feature';
import { GitStatusState } from 'azure-devops-node-api/interfaces/GitInterfaces';
import { PolicyEvaluationStatus } from 'azure-devops-node-api/interfaces/PolicyInterfaces';
import { AzureDevOpsError } from '../../../shared/errors';

describe('getPullRequestChecks', () => {
  it('returns status checks and policy evaluations with pipeline references', async () => {
    const statusRecords: any[] = [
      {
        id: 10,
        state: GitStatusState.Failed,
        description: 'CI build',
        context: { name: 'CI', genre: 'continuous-integration' },
        targetUrl:
          'https://dev.azure.com/org/project/_apis/pipelines/55/runs/123?view=results',
        creationDate: new Date('2024-01-01T00:00:00Z'),
        updatedDate: new Date('2024-01-01T01:00:00Z'),
      },
      {
        id: 11,
        state: GitStatusState.Succeeded,
        description: 'Lint checks',
        context: { name: 'Lint', genre: 'validation' },
        targetUrl:
          'https://dev.azure.com/org/project/_build/results?buildId=456&definitionId=789',
        creationDate: new Date('2024-02-01T00:00:00Z'),
        updatedDate: new Date('2024-02-01T01:00:00Z'),
      },
    ];

    const evaluationRecords: any[] = [
      {
        evaluationId: 'eval-1',
        status: PolicyEvaluationStatus.Rejected,
        configuration: {
          id: 7,
          revision: 3,
          isBlocking: true,
          isEnabled: true,
          type: {
            id: 'policy-guid',
            displayName: 'Build',
          },
          settings: {
            displayName: 'CI Build',
            buildDefinitionId: 987,
          },
        },
        context: {
          buildId: 456,
          targetUrl:
            'https://dev.azure.com/org/project/_build/results?buildId=456',
          message: 'Build failed',
        },
      },
    ];

    const mockConnection: any = {
      getGitApi: jest.fn().mockResolvedValue({
        getPullRequestStatuses: jest.fn().mockResolvedValue(statusRecords),
      }),
      getPolicyApi: jest.fn().mockResolvedValue({
        getPolicyEvaluations: jest.fn().mockResolvedValue(evaluationRecords),
      }),
    };

    const result = await getPullRequestChecks(mockConnection, {
      projectId: 'project',
      repositoryId: 'repo',
      pullRequestId: 42,
    });

    expect(result.statuses).toHaveLength(2);
    expect(result.statuses[0].state).toBe('failed');
    expect(result.statuses[0].pipeline?.pipelineId).toBe(55);
    expect(result.statuses[0].pipeline?.runId).toBe(123);
    expect(result.statuses[1].pipeline?.buildId).toBe(456);
    expect(result.statuses[1].pipeline?.definitionId).toBe(789);

    expect(result.policyEvaluations).toHaveLength(1);
    expect(result.policyEvaluations[0].status).toBe('rejected');
    expect(result.policyEvaluations[0].pipeline?.definitionId).toBe(987);
    expect(result.policyEvaluations[0].pipeline?.buildId).toBe(456);
    expect(result.policyEvaluations[0].targetUrl).toContain('buildId=456');
  });

  it('re-throws Azure DevOps errors', async () => {
    const azureError = new AzureDevOpsError('Azure failure');
    const mockConnection: any = {
      getGitApi: jest.fn().mockRejectedValue(azureError),
      getPolicyApi: jest.fn(),
    };

    await expect(
      getPullRequestChecks(mockConnection, {
        projectId: 'project',
        repositoryId: 'repo',
        pullRequestId: 1,
      }),
    ).rejects.toBe(azureError);
  });

  it('wraps unexpected errors', async () => {
    const mockConnection: any = {
      getGitApi: jest.fn().mockRejectedValue(new Error('boom')),
      getPolicyApi: jest.fn(),
    };

    await expect(
      getPullRequestChecks(mockConnection, {
        projectId: 'project',
        repositoryId: 'repo',
        pullRequestId: 1,
      }),
    ).rejects.toThrow('Failed to get pull request checks: boom');
  });
});
