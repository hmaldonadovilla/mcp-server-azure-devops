import { WebApi } from 'azure-devops-node-api';
import {
  GitVersionType,
  GitRefUpdate,
  GitChange,
  VersionControlChangeType,
  ItemContentType,
} from 'azure-devops-node-api/interfaces/GitInterfaces';
import { AzureDevOpsError } from '../../../shared/errors';
import { CreateCommitOptions } from '../types';

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  return await new Promise<string>((resolve, reject) => {
    stream.on('data', (c) => chunks.push(Buffer.from(c)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Create a commit with multiple file changes
 */
export async function createCommit(
  connection: WebApi,
  options: CreateCommitOptions,
): Promise<void> {
  try {
    const gitApi = await connection.getGitApi();
    const branch = await gitApi.getBranch(
      options.repositoryId,
      options.branchName,
      options.projectId,
    );
    const baseCommit = branch?.commit?.commitId;
    if (!baseCommit) {
      throw new AzureDevOpsError(`Branch '${options.branchName}' not found`);
    }

    const changes: GitChange[] = [];

    for (const file of options.changes) {
      if (file.delete) {
        changes.push({
          changeType: VersionControlChangeType.Delete,
          item: { path: file.path },
        });
        continue;
      }

      if (file.originalCode) {
        const stream = await gitApi.getItemContent(
          options.repositoryId,
          file.path,
          options.projectId,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
          { version: options.branchName, versionType: GitVersionType.Branch },
          true,
        );
        const original = stream ? await streamToString(stream) : '';
        if (!original.includes(file.originalCode)) {
          throw new AzureDevOpsError(
            `Original code snippet not found in ${file.path}`,
          );
        }
        const updated = original.replace(file.originalCode, file.newCode ?? '');
        changes.push({
          changeType: VersionControlChangeType.Edit,
          item: { path: file.path },
          newContent: {
            content: updated,
            contentType: ItemContentType.RawText,
          },
        });
      } else {
        changes.push({
          changeType: VersionControlChangeType.Add,
          item: { path: file.path },
          newContent: {
            content: file.newCode || '',
            contentType: ItemContentType.RawText,
          },
        });
      }
    }

    const commit = {
      comment: options.commitMessage,
      changes,
    };

    const refUpdate: GitRefUpdate = {
      name: `refs/heads/${options.branchName}`,
      oldObjectId: baseCommit,
    };

    await gitApi.createPush(
      { commits: [commit], refUpdates: [refUpdate] },
      options.repositoryId,
      options.projectId,
    );
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    throw new Error(
      `Failed to create commit: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
