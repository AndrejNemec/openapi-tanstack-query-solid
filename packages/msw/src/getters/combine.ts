import {
  ContextSpecs,
  GeneratorImport,
  isReference,
  MockOptions,
} from '@otqs/core';
import omit from 'lodash.omit';
import { resolveMockValue } from '../resolvers';
import { MockSchemaObject } from '../types';

export const combineSchemasMock = ({
  item,
  separator,
  mockOptions,
  operationId,
  tags,
  combine,
  context,
  imports,
  existingReferencedProperties,
}: {
  item: MockSchemaObject;
  separator: 'allOf' | 'oneOf' | 'anyOf';
  operationId: string;
  mockOptions?: MockOptions;
  tags: string[];
  combine?: {
    separator: 'allOf' | 'oneOf' | 'anyOf';
    includedProperties: string[];
  };
  context: ContextSpecs;
  imports: GeneratorImport[];
  // This is used to prevent recursion when combining schemas
  // When an element is added to the array, it means on this iteration, we've already seen this property
  existingReferencedProperties: string[];
}) => {
  let combineImports: GeneratorImport[] = [];
  let includedProperties: string[] = (combine?.includedProperties ?? []).slice(
    0,
  );
  const itemResolvedValue =
    isReference(item) || item.properties
      ? resolveMockValue({
          schema: omit(item, separator) as MockSchemaObject,
          combine: {
            separator: 'allOf',
            includedProperties: [],
          },
          mockOptions,
          operationId,
          tags,
          context,
          imports,
          existingReferencedProperties,
        })
      : undefined;

  includedProperties.push(...(itemResolvedValue?.includedProperties ?? []));
  combineImports.push(...(itemResolvedValue?.imports ?? []));

  const value = (item[separator] ?? []).reduce((acc, val, index, arr) => {
    const resolvedValue = resolveMockValue({
      schema: {
        ...val,
        name: item.name,
        path: item.path ? item.path : '#',
      },
      combine: {
        separator,
        includedProperties:
          separator !== 'oneOf'
            ? includedProperties
            : itemResolvedValue?.includedProperties ?? [],
      },
      mockOptions,
      operationId,
      tags,
      context,
      imports,
      existingReferencedProperties,
    });

    combineImports.push(...resolvedValue.imports);
    includedProperties.push(...(resolvedValue.includedProperties ?? []));

    const isLastElement = index === arr.length - 1;

    let currentValue = resolvedValue.value;

    if (itemResolvedValue?.value && separator === 'oneOf') {
      currentValue = `${resolvedValue.value.slice(0, -1)},${
        itemResolvedValue.value
      }}`;
    }

    if (itemResolvedValue?.value && separator !== 'oneOf' && isLastElement) {
      currentValue = `${currentValue}${
        itemResolvedValue?.value ? `,${itemResolvedValue.value}` : ''
      }`;
    }

    const isObjectBounds =
      !combine || (combine.separator === 'oneOf' && separator === 'allOf');

    if (!index && isObjectBounds) {
      if (
        resolvedValue.enums ||
        separator === 'oneOf' ||
        separator === 'anyOf' ||
        resolvedValue.type === 'array'
      ) {
        if (arr.length === 1) {
          return `faker.helpers.arrayElement([${currentValue}])`;
        }
        return `faker.helpers.arrayElement([${currentValue},`;
      }

      if (arr.length === 1) {
        if (resolvedValue.type && resolvedValue.type !== 'object') {
          return currentValue;
        }
        return `{${currentValue}}`;
      }

      return `{${currentValue},`;
    }

    if (isLastElement) {
      if (
        resolvedValue.enums ||
        separator === 'oneOf' ||
        separator === 'anyOf' ||
        resolvedValue.type === 'array'
      ) {
        return `${acc}${currentValue}${!combine ? '])' : ''}`;
      }

      return `${acc}${currentValue}${isObjectBounds ? '}' : ''}`;
    }

    if (!currentValue) {
      return acc;
    }

    return `${acc}${currentValue},`;
  }, '');

  return {
    value,
    imports: combineImports,
    name: item.name,
    includedProperties,
  };
};
