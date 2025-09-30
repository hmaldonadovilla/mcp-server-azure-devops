# Pipeline Tools

This document describes the tools available for working with Azure DevOps pipelines.

## Table of Contents

- [`list_pipelines`](#list_pipelines) - List pipelines in a project
- [`get_pipeline`](#get_pipeline) - Get details of a specific pipeline
- [`list_pipeline_runs`](#list_pipeline_runs) - List recent runs for a pipeline
- [`get_pipeline_run`](#get_pipeline_run) - Get details for a specific pipeline run
- [`pipeline_timeline`](#pipeline_timeline) - Retrieve the timeline for a pipeline run
- [`get_pipeline_log`](#get_pipeline_log) - Retrieve log output for a pipeline run
- [`trigger_pipeline`](#trigger_pipeline) - Trigger a pipeline run

## list_pipelines

Lists pipelines in a project.

### Parameters

| Parameter   | Type   | Required | Description                                               |
| ----------- | ------ | -------- | --------------------------------------------------------- |
| `projectId` | string | No       | The ID or name of the project (Default: from environment) |
| `orderBy`   | string | No       | Order by field and direction (e.g., "createdDate desc")   |
| `top`       | number | No       | Maximum number of pipelines to return                     |

### Response

Returns an array of pipeline objects:

```json
{
  "count": 2,
  "value": [
    {
      "id": 4,
      "revision": 2,
      "name": "Node.js build pipeline",
      "folder": "\\",
      "url": "https://dev.azure.com/organization/project/_apis/pipelines/4"
    },
    {
      "id": 1,
      "revision": 1,
      "name": "Sample Pipeline",
      "folder": "\\",
      "url": "https://dev.azure.com/organization/project/_apis/pipelines/1"
    }
  ]
}
```

### Error Handling

- Returns `AzureDevOpsResourceNotFoundError` if the project does not exist
- Returns `AzureDevOpsAuthenticationError` if authentication fails
- Returns generic error messages for other failures

### Example Usage

```javascript
// Using default project from environment
const result = await callTool('list_pipelines', {});

// Specifying project and limiting results
const limitedResult = await callTool('list_pipelines', {
  projectId: 'my-project',
  top: 10,
  orderBy: 'name asc',
});
```

## get_pipeline

Gets details of a specific pipeline.

### Parameters

| Parameter         | Type   | Required | Description                                                       |
| ----------------- | ------ | -------- | ----------------------------------------------------------------- |
| `projectId`       | string | No       | The ID or name of the project (Default: from environment)         |
| `pipelineId`      | number | Yes      | The numeric ID of the pipeline to retrieve                        |
| `pipelineVersion` | number | No       | The version of the pipeline to retrieve (latest if not specified) |

### Response

Returns a pipeline object with the following structure:

```json
{
  "id": 4,
  "revision": 2,
  "name": "Node.js build pipeline",
  "folder": "\\",
  "url": "https://dev.azure.com/organization/project/_apis/pipelines/4",
  "_links": {
    "self": {
      "href": "https://dev.azure.com/organization/project/_apis/pipelines/4"
    },
    "web": {
      "href": "https://dev.azure.com/organization/project/_build/definition?definitionId=4"
    }
  },
  "configuration": {
    "path": "azure-pipelines.yml",
    "repository": {
      "id": "bd0e8130-7fba-4f3b-8559-54760b6e7248",
      "type": "azureReposGit"
    },
    "type": "yaml"
  }
}
```

### Error Handling

- Returns `AzureDevOpsResourceNotFoundError` if the pipeline or project does not exist
- Returns `AzureDevOpsAuthenticationError` if authentication fails
- Returns generic error messages for other failures

### Example Usage

```javascript
// Get latest version of a pipeline
const result = await callTool('get_pipeline', {
  pipelineId: 4,
});

// Get specific version of a pipeline
const versionResult = await callTool('get_pipeline', {
  projectId: 'my-project',
  pipelineId: 4,
  pipelineVersion: 2,
});
```

## list_pipeline_runs

Lists recent runs for a specific pipeline.

### Parameters

| Parameter            | Type   | Required | Description                                                                 |
| -------------------- | ------ | -------- | --------------------------------------------------------------------------- |
| `projectId`          | string | No       | The ID or name of the project (Default: from environment)                   |
| `pipelineId`         | number | Yes      | The numeric ID of the pipeline to query                                     |
| `top`                | number | No       | Maximum number of runs to return (1-100, default 50)                        |
| `continuationToken`  | string | No       | Token to retrieve the next page of results                                  |
| `branch`             | string | No       | Filter by branch (accepts shorthand like `main` or full ref `refs/heads/*`) |
| `state`              | string | No       | Filter by current run state (`notStarted`, `inProgress`, `completed`, etc.) |
| `result`             | string | No       | Filter by final run result (`succeeded`, `failed`, etc.)                    |
| `createdFrom`        | string | No       | Only include runs created at or after this ISO 8601 timestamp               |
| `createdTo`          | string | No       | Only include runs created at or before this ISO 8601 timestamp              |
| `orderBy`            | string | No       | Sort order for creation date (`createdDate desc` or `createdDate asc`)      |

### Response

Returns an object containing the runs and, when applicable, a continuation token:

```json
{
  "runs": [
    {
      "id": 987,
      "name": "20240220.1",
      "state": "completed",
      "result": "succeeded",
      "createdDate": "2024-02-20T16:30:15.06Z",
      "pipeline": {
        "id": 4,
        "name": "Node.js build pipeline"
      }
    }
  ],
  "continuationToken": "eyJwYWdlIjoyfQ=="
}
```

### Error Handling

- Returns `AzureDevOpsResourceNotFoundError` if the pipeline or project does not exist
- Returns `AzureDevOpsAuthenticationError` if authentication fails
- Returns generic error messages for other failures

### Example Usage

```javascript
// List the 20 most recent runs on main
const recentRuns = await callTool('list_pipeline_runs', {
  pipelineId: 4,
  top: 20,
  branch: 'main',
});

// Fetch the next page using the continuation token
const nextPage = await callTool('list_pipeline_runs', {
  pipelineId: 4,
  continuationToken: recentRuns.continuationToken,
});
```

## get_pipeline_run

Gets details for a specific pipeline run. Optionally validates that the run belongs to a particular pipeline.

### Parameters

| Parameter    | Type   | Required | Description                                                           |
| -------------| ------ | -------- | --------------------------------------------------------------------- |
| `projectId`  | string | No       | The ID or name of the project (Default: from environment)             |
| `runId`      | number | Yes      | The numeric ID of the pipeline run to retrieve                        |
| `pipelineId` | number | No       | Optional guard to ensure the run belongs to the specified pipeline ID |

### Response

Returns a pipeline run object including pipeline metadata, result, timing, and variables:

```json
{
  "id": 987,
  "name": "20240220.1",
  "state": "completed",
  "result": "succeeded",
  "createdDate": "2024-02-20T16:30:15.06Z",
  "finishedDate": "2024-02-20T16:34:02.47Z",
  "pipeline": {
    "id": 4,
    "name": "Node.js build pipeline"
  }
}
```

### Error Handling

- Returns `AzureDevOpsResourceNotFoundError` if the run or project does not exist, or if it fails the pipeline guard
- Returns `AzureDevOpsAuthenticationError` if authentication fails
- Returns generic error messages for other failures

### Example Usage

```javascript
// Retrieve a run and ensure it belongs to pipeline 4
const run = await callTool('get_pipeline_run', {
  pipelineId: 4,
  runId: 987,
});
```

## pipeline_timeline

Retrieves the timeline for a pipeline run, optionally filtering the returned records by state or result.

### Parameters

| Parameter    | Type             | Required | Description                                                                 |
| -------------| ---------------- | -------- | --------------------------------------------------------------------------- |
| `projectId`  | string           | No       | The ID or name of the project (Default: from environment)                   |
| `runId`      | number           | Yes      | The numeric ID of the pipeline run                                          |
| `timelineId` | string           | No       | Optional timeline identifier to target a specific timeline instance         |
| `pipelineId` | number           | No       | Optional pipeline numeric ID for reference                                  |
| `state`      | string or array  | No       | Filter timeline records by state (`pending`, `inProgress`, `completed`)     |
| `result`     | string or array  | No       | Filter timeline records by result (`succeeded`, `failed`, `skipped`, etc.)  |

### Response

Returns the timeline object from Azure DevOps, including the filtered `records` collection:

```json
{
  "id": "a1b2c3d4",
  "changeId": 14,
  "lastChangedOn": "2024-02-20T16:33:59.9Z",
  "records": [
    {
      "id": "stage-job",
      "type": "Job",
      "name": "Build",
      "state": "completed",
      "result": "succeeded",
      "startTime": "2024-02-20T16:30:30.0Z",
      "finishTime": "2024-02-20T16:33:45.5Z"
    }
  ]
}
```

### Error Handling

- Returns `AzureDevOpsResourceNotFoundError` if the timeline or project does not exist
- Returns `AzureDevOpsAuthenticationError` if authentication fails
- Returns generic error messages for other failures

### Example Usage

```javascript
// Retrieve only failed records for a run
const timeline = await callTool('pipeline_timeline', {
  runId: 987,
  result: 'failed',
});
```

## get_pipeline_log

Retrieves the contents of a specific pipeline log. Logs can be returned as plain text or structured JSON.

### Parameters

| Parameter    | Type   | Required | Description                                                                   |
| -------------| ------ | -------- | ----------------------------------------------------------------------------- |
| `projectId`  | string | No       | The ID or name of the project (Default: from environment)                     |
| `runId`      | number | Yes      | The numeric ID of the pipeline run                                            |
| `logId`      | number | Yes      | The log identifier provided in the timeline records                           |
| `format`     | string | No       | `plain` (default) to receive newline-delimited text or `json` for structured data |
| `startLine`  | number | No       | Optional start line when retrieving a segment of the log                      |
| `endLine`    | number | No       | Optional end line when retrieving a segment of the log                        |
| `pipelineId` | number | No       | Optional pipeline numeric ID for reference                                    |

### Response

Depending on the requested format, returns either a string containing the log lines separated by `\n`, or a JSON object:

```json
// Plain text format
"Downloading dependencies\nRunning tests\nAll tests passed"

// JSON format
[
  {
    "line": 1,
    "content": "Downloading dependencies"
  }
]
```

### Error Handling

- Returns `AzureDevOpsResourceNotFoundError` if the log or project does not exist
- Returns `AzureDevOpsAuthenticationError` if authentication fails
- Returns generic error messages for other failures

### Example Usage

```javascript
// Fetch a portion of a log as plain text
const logSnippet = await callTool('get_pipeline_log', {
  runId: 987,
  logId: 42,
  startLine: 1,
  endLine: 100,
});

// Retrieve the same log as structured JSON
const logJson = await callTool('get_pipeline_log', {
  runId: 987,
  logId: 42,
  format: 'json',
});
```

## trigger_pipeline

Triggers a run of a specific pipeline. Allows specifying the branch to run on and passing variables to customize the pipeline execution.

### Parameters

| Parameter            | Type   | Required | Description                                                           |
| -------------------- | ------ | -------- | --------------------------------------------------------------------- |
| `projectId`          | string | No       | The ID or name of the project (Default: from environment)             |
| `pipelineId`         | number | Yes      | The numeric ID of the pipeline to trigger                             |
| `branch`             | string | No       | The branch to run the pipeline on (e.g., "main", "feature/my-branch") |
| `variables`          | object | No       | Variables to pass to the pipeline run                                 |
| `templateParameters` | object | No       | Parameters for template-based pipelines                               |
| `stagesToSkip`       | array  | No       | Stages to skip in the pipeline run                                    |

#### Variables Format

```json
{
  "myVariable": {
    "value": "my-value",
    "isSecret": false
  },
  "secretVariable": {
    "value": "secret-value",
    "isSecret": true
  }
}
```

### Response

Returns a run object with details about the triggered pipeline run:

```json
{
  "id": 12345,
  "name": "20230215.1",
  "createdDate": "2023-02-15T10:30:00Z",
  "url": "https://dev.azure.com/organization/project/_apis/pipelines/runs/12345",
  "_links": {
    "self": {
      "href": "https://dev.azure.com/organization/project/_apis/pipelines/runs/12345"
    },
    "web": {
      "href": "https://dev.azure.com/organization/project/_build/results?buildId=12345"
    }
  },
  "state": 1,
  "result": null,
  "variables": {
    "myVariable": {
      "value": "my-value"
    }
  }
}
```

### Error Handling

- Returns `AzureDevOpsResourceNotFoundError` if the pipeline or project does not exist
- Returns `AzureDevOpsAuthenticationError` if authentication fails
- Returns generic error messages for other failures

### Example Usage

```javascript
// Trigger a pipeline on the default branch
// In this case, use default project from environment variables
const result = await callTool('trigger_pipeline', {
  pipelineId: 4,
});

// Trigger a pipeline on a specific branch with variables
const runWithOptions = await callTool('trigger_pipeline', {
  projectId: 'my-project',
  pipelineId: 4,
  branch: 'feature/my-branch',
  variables: {
    deployEnvironment: {
      value: 'staging',
      isSecret: false,
    },
  },
});
```
