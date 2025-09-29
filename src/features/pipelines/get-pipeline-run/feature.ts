import { WebApi } from 'azure-devops-node-api';
import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { TypeInfo } from 'azure-devops-node-api/interfaces/PipelinesInterfaces';
import {
  AzureDevOpsAuthenticationError,
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import { defaultProject } from '../../../utils/environment';
import { GetPipelineRunOptions, Run } from '../types';

const API_VERSION = '7.1';

function coercePipelineId(id: unknown): number | undefined {
  if (typeof id === 'number') {
    return id;
  }

  if (typeof id === 'string') {
    const parsed = Number.parseInt(id, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}

async function resolvePipelineId(
  connection: WebApi,
  projectId: string,
  runId: number,
  providedPipelineId?: number,
): Promise<number | undefined> {
  if (typeof providedPipelineId === 'number') {
    return providedPipelineId;
  }

  try {
    const buildApi = await connection.getBuildApi();
    const build = (await buildApi.getBuild(projectId, runId)) as
      | Build
      | undefined;
    return coercePipelineId(build?.definition?.id);
  } catch {
    // Swallow errors here; we'll handle not-found later when the main request fails
    return undefined;
  }
}

export async function getPipelineRun(
  connection: WebApi,
  options: GetPipelineRunOptions,
): Promise<Run> {
  try {
    const pipelinesApi = await connection.getPipelinesApi();
    const projectId = options.projectId ?? defaultProject;
    const runId = options.runId;
    const resolvedPipelineId = await resolvePipelineId(
      connection,
      projectId,
      runId,
      options.pipelineId,
    );

    const baseUrl = connection.serverUrl.replace(/\/+$/, '');
    const encodedProject = encodeURIComponent(projectId);

    const requestOptions = pipelinesApi.createRequestOptions(
      'application/json',
      API_VERSION,
    );

    const buildRunUrl = (pipelineId?: number) => {
      const route =
        typeof pipelineId === 'number'
          ? `${encodedProject}/_apis/pipelines/${pipelineId}/runs/${runId}`
          : `${encodedProject}/_apis/pipelines/runs/${runId}`;
      const url = new URL(`${route}`, `${baseUrl}/`);
      url.searchParams.set('api-version', API_VERSION);
      return url;
    };

    const urlsToTry: URL[] = [];
    if (typeof resolvedPipelineId === 'number') {
      urlsToTry.push(buildRunUrl(resolvedPipelineId));
    }
    urlsToTry.push(buildRunUrl());

    let response: {
      statusCode: number;
      result: Run | null;
    } | null = null;

    for (const url of urlsToTry) {
      const attempt = await pipelinesApi.rest.get<Run | null>(
        url.toString(),
        requestOptions,
      );

      if (attempt.statusCode !== 404 && attempt.result) {
        response = attempt;
        break;
      }
    }

    if (!response || !response.result) {
      throw new AzureDevOpsResourceNotFoundError(
        `Pipeline run ${runId} not found in project ${projectId}`,
      );
    }

    const run = pipelinesApi.formatResponse(
      response.result,
      TypeInfo.Run,
      false,
    ) as Run as Run;

    if (!run) {
      throw new AzureDevOpsResourceNotFoundError(
        `Pipeline run ${runId} not found in project ${projectId}`,
      );
    }

    if (typeof options.pipelineId === 'number') {
      const runPipelineId = coercePipelineId(run.pipeline?.id);
      if (runPipelineId !== options.pipelineId) {
        throw new AzureDevOpsResourceNotFoundError(
          `Run ${runId} does not belong to pipeline ${options.pipelineId}`,
        );
      }
    }

    return run;
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('authentication') ||
        message.includes('unauthorized') ||
        message.includes('401')
      ) {
        throw new AzureDevOpsAuthenticationError(
          `Failed to authenticate: ${error.message}`,
        );
      }

      if (
        message.includes('not found') ||
        message.includes('does not exist') ||
        message.includes('404')
      ) {
        throw new AzureDevOpsResourceNotFoundError(
          `Pipeline run or project not found: ${error.message}`,
        );
      }
    }

    throw new AzureDevOpsError(
      `Failed to get pipeline run: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
