import {
  AggregateCreateNodesError,
  CreateNodesContextV2,
  CreateNodesResult,
  CreateNodesV2,
} from '@nx/devkit';
import { dirname } from 'node:path';

const processFile = (
  file: string,
  context: CreateNodesContextV2,
  port: number
) => {
  // Extract the project root from the file path
  const projectRoot = dirname(file);

  // Extract project name from the path (e.g., "apps/official-journal-web" -> "official-journal-web")
  const projectName = projectRoot.split('/').pop() || projectRoot;

  return {
    projects: {
      [projectName]: {
        // This is how Nx recognizes the project
        root: projectRoot,
        targets: {
          serve: {
            executor: '@nx/next:server',
            defaultConfiguration: 'development',
            options: {
              buildTarget: `${projectName}:build`,
              dev: true,
              port: port,
              host: 'localhost',
            },
            configurations: {
              development: {
                buildTarget: `${projectName}:build:development`,
                dev: true,
              },
              production: {
                buildTarget: `${projectName}:build:production`,
                dev: false,
              },
            },
          },
        },
      },
    },
  };
};

export const createNodesV2: CreateNodesV2 = [
  '**/next.config.{js,ts,mjs,mts,cjs,cts}',
  async (configFiles, options, context) => {
    // Extracted from https://github.com/nrwl/nx/blob/master/packages/nx/src/project-graph/plugins/utils.ts#L7
    const results: Array<[file: string, value: CreateNodesResult]> = [];
    const errors: Array<[file: string, error: Error]> = [];

    await Promise.all(
      // iterate over the config files
      configFiles.map(async (file, index) => {
        try {
          // create a dynamic port for each file starting from 4200
          const value = processFile(file, context, 4200 + index);
          if (value) {
            results.push([file, value] as const);
          }
        } catch (e) {
          errors.push([file, e as Error] as const);
        }
      })
    );

    if (errors.length > 0) {
      throw new AggregateCreateNodesError(errors, results);
    }

    return results;
  },
];
