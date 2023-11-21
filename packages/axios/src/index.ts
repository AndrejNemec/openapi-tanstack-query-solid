import {
  ClientBuilder,
  ClientDependenciesBuilder,
  ClientFooterBuilder,
  ClientGeneratorsBuilder,
  ClientHeaderBuilder,
  ClientTitleBuilder,
  generateFormDataAndUrlEncodedFunction,
  generateMutatorConfig,
  generateMutatorRequestOptions,
  generateOptions,
  generateVerbImports,
  GeneratorDependency,
  GeneratorOptions,
  GeneratorVerbOptions,
  isSyntheticDefaultImportsAllow,
  pascal,
  sanitize,
  toObjectString,
  VERBS_WITH_BODY,
} from '@otqs/core';

const AXIOS_DEPENDENCIES: GeneratorDependency[] = [
  {
    exports: [
      {
        name: 'axios',
        default: true,
        values: true,
        syntheticDefaultImport: true,
      },
      { name: 'AxiosRequestConfig' },
      { name: 'AxiosResponse' },
    ],
    dependency: 'axios',
  },
];

const PARAMS_SERIALIZER_DEPENDENCIES: GeneratorDependency[] = [
  {
    exports: [
      {
        name: 'qs',
        default: true,
        values: true,
        syntheticDefaultImport: true,
      },
    ],
    dependency: 'qs',
  },
];

const returnTypesToWrite: Map<string, (title?: string) => string> = new Map();

export const getAxiosDependencies: ClientDependenciesBuilder = (
  hasGlobalMutator,
  hasParamsSerializerOptions: boolean,
) => [
  ...(!hasGlobalMutator ? AXIOS_DEPENDENCIES : []),
  ...(hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : []),
];

const generateAxiosImplementation = (
  {
    headers,
    queryParams,
    operationName,
    response,
    mutator,
    body,
    props,
    verb,
    override,
    formData,
    formUrlEncoded,
    paramsSerializer,
  }: GeneratorVerbOptions,
  { route, context }: GeneratorOptions,
) => {
  const isRequestOptions = override?.requestOptions !== false;
  const isFormData = override?.formData !== false;
  const isFormUrlEncoded = override?.formUrlEncoded !== false;
  const isExactOptionalPropertyTypes =
    !!context.tsconfig?.compilerOptions?.exactOptionalPropertyTypes;

  const isSyntheticDefaultImportsAllowed = isSyntheticDefaultImportsAllow(
    context.tsconfig,
  );

  const bodyForm = generateFormDataAndUrlEncodedFunction({
    formData,
    formUrlEncoded,
    body,
    isFormData,
    isFormUrlEncoded,
  });
  const isBodyVerb = VERBS_WITH_BODY.includes(verb);

  if (mutator) {
    const mutatorConfig = generateMutatorConfig({
      route,
      body,
      headers,
      queryParams,
      response,
      verb,
      isFormData,
      isFormUrlEncoded,
      isBodyVerb,
      hasSignal: false,
      isExactOptionalPropertyTypes,
    });

    const requestOptions = isRequestOptions
      ? generateMutatorRequestOptions(
          override?.requestOptions,
          mutator.hasSecondArg,
        )
      : '';

    returnTypesToWrite.set(
      operationName,
      (title?: string) =>
        `export type ${pascal(
          operationName,
        )}Result = NonNullable<Awaited<ReturnType<${
          title
            ? `ReturnType<typeof ${title}>['${operationName}']`
            : `typeof ${operationName}`
        }>>>`,
    );

    const propsImplementation =
      mutator.bodyTypeName && body.definition
        ? toObjectString(props, 'implementation').replace(
            new RegExp(`(\\w*):\\s?${body.definition}`),
            `$1: ${mutator.bodyTypeName}<${body.definition}>`,
          )
        : toObjectString(props, 'implementation');

    return `const ${operationName} = (\n    ${propsImplementation}\n ${
      isRequestOptions && mutator.hasSecondArg
        ? `options?: SecondParameter<typeof ${mutator.name}>,`
        : ''
    }) => {${bodyForm}
      return ${mutator.name}<${response.definition.success || 'unknown'}>(
      ${mutatorConfig},
      ${requestOptions});
    }
  `;
  }

  const options = generateOptions({
    route,
    body,
    headers,
    queryParams,
    response,
    verb,
    requestOptions: override?.requestOptions,
    isFormData,
    isFormUrlEncoded,
    paramsSerializer,
    paramsSerializerOptions: override?.paramsSerializerOptions,
    isExactOptionalPropertyTypes,
    hasSignal: false,
  });

  returnTypesToWrite.set(
    operationName,
    () =>
      `export type ${pascal(operationName)}Result = AxiosResponse<${
        response.definition.success || 'unknown'
      }>`,
  );

  return `const ${operationName} = <TData = AxiosResponse<${
    response.definition.success || 'unknown'
  }>>(\n    ${toObjectString(props, 'implementation')} ${
    isRequestOptions ? `options?: AxiosRequestConfig\n` : ''
  } ): Promise<TData> => {${bodyForm}
    return axios${
      !isSyntheticDefaultImportsAllowed ? '.default' : ''
    }.${verb}(${options});
  }
`;
};

export const generateAxiosTitle: ClientTitleBuilder = (title) => {
  const sanTitle = sanitize(title);
  return `get${pascal(sanTitle)}`;
};

export const generateAxiosHeader: ClientHeaderBuilder = ({
  title,
  isRequestOptions,
  isMutator,
  noFunction,
}) => `
${
  isRequestOptions && isMutator
    ? `// eslint-disable-next-line
  type SecondParameter<T extends (...args: any) => any> = T extends (
  config: any,
  args: infer P,
) => any
  ? P
  : never;\n\n`
    : ''
}
  ${!noFunction ? `export const ${title} = () => {\n` : ''}`;

export const generateAxiosFooter: ClientFooterBuilder = ({
  operationNames,
  title,
  noFunction,
  hasMutator,
  hasAwaitedType,
}) => {
  let footer = '';

  if (!noFunction) {
    footer += `return {${operationNames.join(',')}}};\n`;
  }

  if (hasMutator && !hasAwaitedType) {
    footer += `\ntype AwaitedInput<T> = PromiseLike<T> | T;\n
    type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
\n`;
  }

  operationNames.forEach((operationName) => {
    if (returnTypesToWrite.has(operationName)) {
      const func = returnTypesToWrite.get(operationName)!;
      footer += func(!noFunction ? title : undefined) + '\n';
    }
  });

  return footer;
};

export const generateAxios = (
  verbOptions: GeneratorVerbOptions,
  options: GeneratorOptions,
) => {
  const imports = generateVerbImports(verbOptions);
  const implementation = generateAxiosImplementation(verbOptions, options);

  return { implementation, imports };
};

export const generateAxiosFunctions: ClientBuilder = async (
  verbOptions,
  options,
) => {
  const { implementation, imports } = generateAxios(verbOptions, options);

  return {
    implementation: 'export ' + implementation,
    imports,
  };
};

const axiosClientBuilder: ClientGeneratorsBuilder = {
  client: generateAxios,
  header: generateAxiosHeader,
  dependencies: getAxiosDependencies,
  footer: generateAxiosFooter,
  title: generateAxiosTitle,
};

const axiosFunctionsClientBuilder: ClientGeneratorsBuilder = {
  client: generateAxiosFunctions,
  header: (options) => generateAxiosHeader({ ...options, noFunction: true }),
  dependencies: getAxiosDependencies,
  footer: (options) => generateAxiosFooter({ ...options, noFunction: true }),
  title: generateAxiosTitle,
};

const builders: Record<'axios' | 'axios-functions', ClientGeneratorsBuilder> = {
  axios: axiosClientBuilder,
  'axios-functions': axiosFunctionsClientBuilder,
};

export const builder =
  ({ type = 'axios-functions' }: { type?: 'axios' | 'axios-functions' } = {}) =>
  () =>
    builders[type];

export default builder;
