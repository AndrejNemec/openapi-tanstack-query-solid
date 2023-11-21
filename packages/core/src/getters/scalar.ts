import { SchemaObject } from 'openapi3-ts';
import { ContextSpecs, ScalarValue } from '../types';
import { escape, isString } from '../utils';
import { getArray } from './array';
import { getObject } from './object';
import { resolveExampleRefs } from '../resolvers';

/**
 * Return the typescript equivalent of open-api data type
 *
 * @param item
 * @ref https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#data-types
 */
export const getScalar = ({
  item,
  name,
  context,
}: {
  item: SchemaObject;
  name?: string;
  context: ContextSpecs;
}): ScalarValue => {
  const nullable = item.nullable ? ' | null' : '';
  const enumItems = item.enum?.filter((enumItem) => enumItem !== null);

  if (!item.type && item.items) {
    item.type = 'array';
  }

  switch (item.type) {
    case 'number':
    case 'integer': {
      let value =
        item.format === 'int64' && context.override.useBigInt
          ? 'bigint'
          : 'number';
      let isEnum = false;

      if (enumItems) {
        value = enumItems
          .map((enumItem: number | null) => `${enumItem}`)
          .join(' | ');
        isEnum = true;
      }

      return {
        value: value + nullable,
        isEnum,
        type: 'number',
        schemas: [],
        imports: [],
        isRef: false,
        hasReadonlyProps: item.readOnly || false,
        example: item.example,
        examples: resolveExampleRefs(item.examples, context),
      };
    }

    case 'boolean':
      return {
        value: 'boolean' + nullable,
        type: 'boolean',
        isEnum: false,
        schemas: [],
        imports: [],
        isRef: false,
        hasReadonlyProps: item.readOnly || false,
        example: item.example,
        examples: resolveExampleRefs(item.examples, context),
      };

    case 'array': {
      const { value, ...rest } = getArray({
        schema: item,
        name,
        context,
      });
      return {
        value: value + nullable,
        ...rest,
      };
    }

    case 'string': {
      let value = 'string';
      let isEnum = false;

      if (enumItems) {
        value = `${enumItems
          .map((enumItem: string | null) =>
            isString(enumItem) ? `'${escape(enumItem)}'` : `${enumItem}`,
          )
          .filter(Boolean)
          .join(` | `)}`;

        isEnum = true;
      }

      if (item.format === 'binary') {
        value = 'Blob';
      }

      if (context.override.useDates) {
        if (item.format === 'date' || item.format === 'date-time') {
          value = 'Date';
        }
      }

      return {
        value: value + nullable,
        isEnum,
        type: 'string',
        imports: [],
        schemas: [],
        isRef: false,
        hasReadonlyProps: item.readOnly || false,
        example: item.example,
        examples: resolveExampleRefs(item.examples, context),
      };
    }

    case 'null':
      return {
        value: 'null',
        isEnum: false,
        type: 'null',
        imports: [],
        schemas: [],
        isRef: false,
        hasReadonlyProps: item.readOnly || false,
      };

    case 'object':
    default: {
      if (enumItems) {
        const value = `${enumItems
          .map((enumItem: unknown) =>
            isString(enumItem) ? `'${escape(enumItem)}'` : `${enumItem}`,
          )
          .filter(Boolean)
          .join(` | `)}`;

        return {
          value: value + nullable,
          isEnum: true,
          type: 'string',
          imports: [],
          schemas: [],
          isRef: false,
          hasReadonlyProps: item.readOnly || false,
          example: item.example,
          examples: resolveExampleRefs(item.examples, context),
        };
      }

      const { value, ...rest } = getObject({
        item,
        name,
        context,
        nullable,
      });
      return { value: value, ...rest };
    }
  }
};
