import { GeneratorImport } from '@openapi-tanstack-query-solid/core';
import { SchemaObject } from 'openapi3-ts';

export interface MockDefinition {
  value: string;
  enums?: string[];
  imports: GeneratorImport[];
  name: string;
  overrided?: boolean;
  includedProperties?: string[];
}

export type MockSchemaObject = SchemaObject & {
  name: string;
  path?: string;
  isRef?: boolean;
};
