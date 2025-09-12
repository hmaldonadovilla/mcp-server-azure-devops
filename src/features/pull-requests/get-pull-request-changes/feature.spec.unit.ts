import { Readable } from 'stream';
import { getPullRequestChanges } from './feature';
import { AzureDevOpsError } from '../../../shared/errors';

describe('getPullRequestChanges unit', () => {
  test('should retrieve changes, evaluations, and file patches', async () => {
    const mockConnection: any = {
      getGitApi: jest.fn().mockResolvedValue({
        getPullRequestIterations: jest.fn().mockResolvedValue([{ id: 1 }]),
        getPullRequestIterationChanges: jest.fn().mockResolvedValue({
          changeEntries: [
            {
              item: {
                path: '/file.txt',
                objectId: 'new',
                originalObjectId: 'old',
              },
            },
          ],
        }),
        getBlobContent: jest.fn().mockImplementation((_, sha: string) => {
          const content = sha === 'old' ? 'old line\n' : 'new line\n';
          return Promise.resolve(Readable.from([content]));
        }),
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

    expect(result.evaluations).toHaveLength(1);
    expect(result.files).toHaveLength(1);
    const patch = result.files[0].patch;
    expect(patch).toContain('-old line');
    expect(patch).toContain('+new line');
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
