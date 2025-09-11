import { getPullRequestChanges } from './feature';
import { AzureDevOpsError } from '../../../shared/errors';

describe('getPullRequestChanges unit', () => {
  test('should retrieve changes and evaluations', async () => {
    const mockConnection: any = {
      getGitApi: jest.fn().mockResolvedValue({
        getPullRequestIterations: jest.fn().mockResolvedValue([{ id: 1 }]),
        getPullRequestIterationChanges: jest
          .fn()
          .mockResolvedValue({ changeEntries: [] }),
      }),
      getPolicyApi: jest.fn().mockResolvedValue({
        getPolicyEvaluations: jest.fn().mockResolvedValue([{ id: '1' }]),
      }),
    };

    const result = await getPullRequestChanges(mockConnection, {
      projectId: 'p',
      repositoryId: 'r',
      pullRequestId: 1,
    });

    expect(result.changes).toEqual({ changeEntries: [] });
    expect(result.evaluations).toHaveLength(1);
  });

  test('should throw when no iterations found', async () => {
    const mockConnection: any = {
      getGitApi: jest.fn().mockResolvedValue({
        getPullRequestIterations: jest.fn().mockResolvedValue([]),
      }),
    };

    await expect(
      getPullRequestChanges(mockConnection, {
        projectId: 'p',
        repositoryId: 'r',
        pullRequestId: 1,
      }),
    ).rejects.toThrow(AzureDevOpsError);
  });
});
