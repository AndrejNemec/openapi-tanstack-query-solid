import fs from 'fs-extra';
import { generateModelsInline, generateMutatorImports } from '../generators';
import { OutputClient, WriteModeProps } from '../types';
import {
  camel,
  getFileInfo,
  isSyntheticDefaultImportsAllow,
  upath,
} from '../utils';
import { generateTarget } from './target';
import { getOrvalGeneratedTypes } from './types';

export const writeSplitMode = async ({
  builder,
  output,
  specsName,
  header,
  needSchema,
}: WriteModeProps): Promise<string[]> => {
  try {
    const { filename, dirname, extension } = getFileInfo(output.target, {
      backupFilename: camel(builder.info.title),
    });

    const {
      imports,
      implementation,
      implementationMSW,
      importsMSW,
      mutators,
      clientMutators,
      formData,
      formUrlEncoded,
      paramsSerializer,
    } = generateTarget(builder, output);

    let implementationData = header;
    let mswData = header;

    const relativeSchemasPath = output.schemas
      ? upath.relativeSafe(dirname, getFileInfo(output.schemas).dirname)
      : './' + filename + '.schemas';

    const isAllowSyntheticDefaultImports = isSyntheticDefaultImportsAllow(
      output.tsconfig,
    );

    implementationData += builder.imports({
      client: output.client,
      implementation,
      imports: [{ exports: imports, dependency: relativeSchemasPath }],
      specsName,
      hasSchemaDir: !!output.schemas,
      isAllowSyntheticDefaultImports,
      hasGlobalMutator: !!output.override.mutator,
      hasParamsSerializerOptions: !!output.override.paramsSerializerOptions,
      packageJson: output.packageJson,
    });
    mswData += builder.importsMock({
      implementation: implementationMSW,
      imports: [
        {
          exports: importsMSW,
          dependency: relativeSchemasPath,
        },
      ],
      specsName,
      hasSchemaDir: !!output.schemas,
      isAllowSyntheticDefaultImports,
    });

    const schemasPath = !output.schemas
      ? upath.join(dirname, filename + '.schemas' + extension)
      : undefined;

    if (schemasPath && needSchema) {
      const schemasData = header + generateModelsInline(builder.schemas);

      await fs.outputFile(
        upath.join(dirname, filename + '.schemas' + extension),
        schemasData,
      );
    }

    if (mutators) {
      implementationData += generateMutatorImports({
        mutators,
        implementation,
      });
    }

    if (clientMutators) {
      implementationData += generateMutatorImports({
        mutators: clientMutators,
      });
    }

    if (formData) {
      implementationData += generateMutatorImports({ mutators: formData });
    }

    if (formUrlEncoded) {
      implementationData += generateMutatorImports({
        mutators: formUrlEncoded,
      });
    }

    if (paramsSerializer) {
      implementationData += generateMutatorImports({
        mutators: paramsSerializer,
      });
    }

    if (implementation.includes('NonReadonly<')) {
      implementationData += getOrvalGeneratedTypes();
    }

    implementationData += `\n${implementation}`;
    mswData += `\n${implementationMSW}`;

    const implementationFilename =
      filename +
      extension;

    const implementationPath = upath.join(dirname, implementationFilename);
    await fs.outputFile(
      upath.join(dirname, implementationFilename),
      implementationData,
    );

    const mockPath = output.mock
      ? upath.join(dirname, filename + '.msw' + extension)
      : undefined;

    if (mockPath) {
      await fs.outputFile(mockPath, mswData);
    }

    return [
      implementationPath,
      ...(schemasPath ? [schemasPath] : []),
      ...(mockPath ? [mockPath] : []),
    ];
  } catch (e) {
    throw `Oups... 🍻. An Error occurred while splitting => ${e}`;
  }
};
