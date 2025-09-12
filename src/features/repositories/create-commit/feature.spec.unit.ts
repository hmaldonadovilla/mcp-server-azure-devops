import { Readable } from 'stream';
import { createCommit } from './feature';
import { AzureDevOpsError } from '../../../shared/errors';

describe('createCommit unit', () => {
  test('should create push with provided changes', async () => {
    const createPush = jest.fn().mockResolvedValue({});
    const mockConnection: any = {
      getGitApi: jest.fn().mockResolvedValue({
        getBranch: jest
          .fn()
          .mockResolvedValue({ commit: { commitId: 'base' } }),
        getItemContent: jest
          .fn()
          .mockResolvedValue(Readable.from(['console.log("hello");'])),
        createPush,
      }),
    };

    await createCommit(mockConnection, {
      projectId: 'p',
      repositoryId: 'r',
      branchName: 'main',
      commitMessage: 'msg',
      changes: [
        {
          path: '/file.ts',
          originalCode: 'console.log("hello");',
          newCode: 'console.log("world");',
        },
        { path: '/new.txt', newCode: 'hi' },
      ],
    });

    expect(createPush).toHaveBeenCalled();
    const payload = createPush.mock.calls[0][0];
    expect(payload.commits[0].changes).toHaveLength(2);
  });

  test('should throw when snippet not found', async () => {
    const mockConnection: any = {
      getGitApi: jest.fn().mockResolvedValue({
        getBranch: jest
          .fn()
          .mockResolvedValue({ commit: { commitId: 'base' } }),
        getItemContent: jest
          .fn()
          .mockResolvedValue(Readable.from(['nothing here'])),
      }),
    };

    await expect(
      createCommit(mockConnection, {
        projectId: 'p',
        repositoryId: 'r',
        branchName: 'main',
        commitMessage: 'msg',
        changes: [
          {
            path: '/file.ts',
            originalCode: 'console.log("hello");',
            newCode: 'console.log("world");',
          },
        ],
      }),
    ).rejects.toThrow(AzureDevOpsError);
  });
});
