import {
    camel,
    ClientBuilder,
    ClientDependenciesBuilder,
    ClientHeaderBuilder,
    generateFormDataAndUrlEncodedFunction,
    generateMutator,
    generateMutatorConfig,
    generateMutatorRequestOptions,
    generateOptions,
    generateVerbImports,
    GeneratorDependency,
    GeneratorMutator,
    GeneratorOptions,
    GeneratorVerbOptions,
    GetterParams,
    GetterProps,
    GetterPropType,
    GetterResponse,
    isObject,
    isSyntheticDefaultImportsAllow,
    mergeDeep,
    OutputClient,
    OutputClientFunc,
    PackageJson,
    pascal,
    QueryOptions,
    stringify,
    toObjectString,
    Verbs,
    VERBS_WITH_BODY,
    jsDoc,
    GetterQueryParam,
    compareVersions,
} from '@openapi-tanstack-query-solid/core';
import omitBy from 'lodash.omitby';
import {
    normalizeQueryOptions,
} from './utils';

const AXIOS_DEPENDENCIES: GeneratorDependency[] = [
    {
        exports: [
            {
                name: 'axios',
                default: true,
                values: true,
                syntheticDefaultImport: true,
            },
            {name: 'AxiosRequestConfig'},
            {name: 'AxiosResponse'},
            {name: 'AxiosError'},
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

const SOLID_QUERY_DEPENDENCIES: GeneratorDependency[] = [
    {
        exports: [
            {name: 'createQuery', values: true},
            {name: 'createInfiniteQuery', values: true},
            {name: 'createMutation', values: true},
            {name: 'CreateQueryOptions'},
            {name: 'CreateInfiniteQueryOptions'},
            {name: 'CreateMutationOptions'},
            {name: 'QueryFunction'},
            {name: 'MutationFunction'},
            {name: 'CreateQueryResult'},
            {name: 'QueryKey'},
            {name: 'QueryClient'},
            {name: 'InfiniteData'},
            {name: 'SolidQueryOptions'},
            {name: 'SolidMutationOptions'},
            {name: 'SolidInfiniteQueryOptions'},
            {name: 'CreateInfiniteQueryResult'},
        ],
        dependency: '@tanstack/solid-query',
    }
];

export const getSolidQueryDependencies: ClientDependenciesBuilder = (
    hasGlobalMutator,
    hasParamsSerializerOptions,
    packageJson,
) => {
    return [
        ...(!hasGlobalMutator ? AXIOS_DEPENDENCIES : []),
        ...(hasParamsSerializerOptions ? PARAMS_SERIALIZER_DEPENDENCIES : []),
        ...(SOLID_QUERY_DEPENDENCIES),
    ];
};

const generateRequestOptionsArguments = ({
                                             isRequestOptions,
                                             hasSignal,
                                         }: {
    isRequestOptions: boolean;
    hasSignal: boolean;
}) => {
    if (isRequestOptions) {
        return 'options?: AxiosRequestConfig\n';
    }

    return hasSignal ? 'signal?: AbortSignal\n' : '';
};

const generateQueryRequestFunction = (
    {
        headers,
        queryParams,
        operationName,
        response,
        mutator,
        body,
        props: _props,
        verb,
        formData,
        formUrlEncoded,
        paramsSerializer,
        override,
    }: GeneratorVerbOptions,
    {route, context}: GeneratorOptions,
    outputClient: OutputClient | OutputClientFunc,
) => {
    let props = _props;
    const isRequestOptions = override.requestOptions !== false;
    const isFormData = override.formData !== false;
    const isFormUrlEncoded = override.formUrlEncoded !== false;
    const hasSignal = !!override.query.signal;

    const isSyntheticDefaultImportsAllowed = isSyntheticDefaultImportsAllow(
        context.tsconfig,
    );
    const isExactOptionalPropertyTypes =
        !!context.tsconfig?.compilerOptions?.exactOptionalPropertyTypes;
    const isBodyVerb = VERBS_WITH_BODY.includes(verb);

    const bodyForm = generateFormDataAndUrlEncodedFunction({
        formData,
        formUrlEncoded,
        body,
        isFormData,
        isFormUrlEncoded,
    });

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
            hasSignal,
            isExactOptionalPropertyTypes,
        });

        let bodyDefinition = body.definition.replace('[]', '\\[\\]');
        let propsImplementation =
            mutator?.bodyTypeName && body.definition
                ? toObjectString(props, 'implementation').replace(
                    new RegExp(`(\\w*):\\s?${bodyDefinition}`),
                    `$1: ${mutator.bodyTypeName}<${body.definition}>`,
                )
                : toObjectString(props, 'implementation');

        const requestOptions = isRequestOptions
            ? generateMutatorRequestOptions(
                override.requestOptions,
                mutator.hasSecondArg,
            )
            : '';

        if (mutator.isHook) {
            return `export const use${pascal(operationName)}Hook = () => {
        const ${operationName} = ${mutator.name}<${
                response.definition.success || 'unknown'
            }>();

        return (\n    ${propsImplementation}\n ${
                isRequestOptions && mutator.hasSecondArg
                    ? `options?: SecondParameter<ReturnType<typeof ${mutator.name}>>,`
                    : ''
            }${
                !isBodyVerb && hasSignal ? 'signal?: AbortSignal\n' : ''
            }) => {${bodyForm}
        return ${operationName}(
          ${mutatorConfig},
          ${requestOptions});
        }
      }
    `;
        }

        return `export const ${operationName} = (\n    ${propsImplementation}\n ${
            isRequestOptions && mutator.hasSecondArg
                ? `options?: SecondParameter<typeof ${mutator.name}>,`
                : ''
        }${!isBodyVerb && hasSignal ? 'signal?: AbortSignal\n' : ''}) => {
      ${bodyForm}
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
        hasSignal,
    });

    const optionsArgs = generateRequestOptionsArguments({
        isRequestOptions,
        hasSignal,
    });

    const queryProps = toObjectString(props, 'implementation');

    return `export const ${operationName} = (\n    ${queryProps} ${optionsArgs} ): Promise<AxiosResponse<${
        response.definition.success || 'unknown'
    }>> => {${bodyForm}
    return axios${
        !isSyntheticDefaultImportsAllowed ? '.default' : ''
    }.${verb}(${options});
  }
`;
};

type QueryType = 'infiniteQuery' | 'query';

const QueryType = {
    INFINITE: 'infiniteQuery' as QueryType,
    QUERY: 'query' as QueryType
};

const INFINITE_QUERY_PROPERTIES = ['getNextPageParam', 'getPreviousPageParam'];

const generateQueryOptions = ({
                                  params,
                                  options,
                                  type,
                              }: {
    params: GetterParams;
    options?: object | boolean;
    type: QueryType;
}) => {
    if (options === false) {
        return '';
    }

    const queryConfig = isObject(options)
        ? ` ${stringify(
            omitBy(
                options,
                (_, key) =>
                    (type !== QueryType.INFINITE) &&
                    INFINITE_QUERY_PROPERTIES.includes(key),
            ),
        )?.slice(1, -1)}`
        : '';

    if (!params.length) {
        if (options) {
            return `${queryConfig} ...queryOptions`;
        }

        return '...queryOptions';
    }

    return `${
        !isObject(options) || !options.hasOwnProperty('enabled')
            ? `enabled: !!(${params.map(({name}) => name).join(' && ')}),`
            : ''
    }${queryConfig} ...queryOptions`;
};

const getQueryArgumentsRequestType = (mutator?: GeneratorMutator) => {
    if (!mutator) {
        return `axios?: AxiosRequestConfig`;
    }

    if (mutator.hasSecondArg && !mutator.isHook) {
        return `request?: SecondParameter<typeof ${mutator.name}>`;
    }

    if (mutator.hasSecondArg && mutator.isHook) {
        return `request?: SecondParameter<ReturnType<typeof ${mutator.name}>>`;
    }

    return '';
};

const getQueryOptionsDefinition = ({
                                       operationName,
                                       definitions,
                                       mutator,
                                       type,
                                       queryParams,
                                       queryParam,
                                       isReturnType,
                                   }: {
    operationName: string;
    definitions: string;
    mutator?: GeneratorMutator;
    type?: QueryType;
    queryParams?: GetterQueryParam;
    queryParam?: string;
    isReturnType: boolean;
}) => {
    const isMutatorHook = mutator?.isHook;
    const prefix = 'Solid';
    const partialOptions = !isReturnType;

    if (type) {
        const funcReturnType = `Awaited<ReturnType<${
            isMutatorHook
                ? `ReturnType<typeof use${pascal(operationName)}Hook>`
                : `typeof ${operationName}`
        }>>`;

        return `${partialOptions ? 'Partial<' : ''}${prefix}${pascal(
            type,
        )}Options<${funcReturnType}, TError, TData${
            type === QueryType.INFINITE &&
            queryParam &&
            queryParams
                ? `, ${funcReturnType}, QueryKey, ${queryParams?.schema.name}['${queryParam}']`
                : ''
        }>${partialOptions ? '>' : ''}`;
    }

    return `${prefix}MutationOptions<Awaited<ReturnType<${
        isMutatorHook
            ? `ReturnType<typeof use${pascal(operationName)}Hook>`
            : `typeof ${operationName}`
    }>>, TError,${definitions ? `{${definitions}}` : 'TVariables'}, TContext>`;
};

const generateQueryArguments = ({
                                    operationName,
                                    definitions,
                                    mutator,
                                    isRequestOptions,
                                    type,
                                    queryParams,
                                    queryParam,
                                }: {
    operationName: string;
    definitions: string;
    mutator?: GeneratorMutator;
    isRequestOptions: boolean;
    type?: QueryType;
    queryParams?: GetterQueryParam;
    queryParam?: string;
}) => {
    const definition = getQueryOptionsDefinition({
        operationName,
        definitions,
        mutator,
        type,
        queryParams,
        queryParam,
        isReturnType: false,
    });

    if (!isRequestOptions) {
        return `${type ? 'queryOptions' : 'mutationOptions'}?: ${definition}`;
    }

    const requestType = getQueryArgumentsRequestType(mutator);

    return `options?: { ${
        type ? 'query' : 'mutation'
    }?:${definition}, ${requestType}}\n`;
};

const generateQueryReturnType = ({
                                     outputClient,
                                     type,
                                     isMutatorHook,
                                     operationName
                                 }: {
    outputClient: OutputClient | OutputClientFunc;
    type: QueryType;
    isMutatorHook?: boolean;
    operationName: string;
}) => {
    switch (outputClient) {
        case OutputClient.SOLID_QUERY:
            return ` Create${pascal(
                type,
            )}Result<TData, TError>`;
    }
};

const getQueryOptions = ({
                             isRequestOptions,
                             mutator,
                             isExactOptionalPropertyTypes,
                             hasSignal,
                         }: {
    isRequestOptions: boolean;
    mutator?: GeneratorMutator;
    isExactOptionalPropertyTypes: boolean;
    hasSignal: boolean;
}) => {
    if (!mutator && isRequestOptions) {
        if (!hasSignal) {
            return 'axiosOptions';
        }
        return `{ ${
            isExactOptionalPropertyTypes ? '...(signal ? { signal } : {})' : 'signal'
        }, ...axiosOptions }`;
    }

    if (mutator?.hasSecondArg && isRequestOptions) {
        if (!hasSignal) {
            return 'requestOptions';
        }

        return 'requestOptions, signal';
    }

    if (hasSignal) {
        return 'signal';
    }

    return '';
};

const getHookOptions = ({
                            isRequestOptions,
                            mutator,
                        }: {
    isRequestOptions: boolean;
    mutator?: GeneratorMutator;
}) => {
    if (!isRequestOptions) {
        return '';
    }

    let value = 'const {query: queryOptions';

    if (!mutator) {
        value += ', axios: axiosOptions';
    }

    if (mutator?.hasSecondArg) {
        value += ', request: requestOptions';
    }

    value += '} = options ?? {};';

    return value;
};

const getQueryFnArguments = ({
                                 hasQueryParam,
                                 hasSignal,
                             }: {
    hasQueryParam: boolean;
    hasSignal: boolean;
}) => {
    if (!hasQueryParam && !hasSignal) {
        return '';
    }

    if (hasQueryParam) {
        if (hasSignal) {
            return '{ signal, pageParam }';
        }

        return '{ pageParam }';
    }

    return '{ signal }';
};

const generateQueryImplementation = ({
                                         queryOption: {name, queryParam, options, type},
                                         operationName,
                                         queryKeyFnName,
                                         queryProperties,
                                         queryKeyProperties,
                                         queryParams,
                                         params,
                                         props,
                                         mutator,
                                         queryOptionsMutator,
                                         queryKeyMutator,
                                         isRequestOptions,
                                         response,
                                         outputClient,
                                         isExactOptionalPropertyTypes,
                                         hasSignal,
                                         route,
                                         doc,
                                         usePrefetch,
                                     }: {
    queryOption: {
        name: string;
        options?: object | boolean;
        type: QueryType;
        queryParam?: string;
    };
    isRequestOptions: boolean;
    operationName: string;
    queryKeyFnName: string;
    queryProperties: string;
    queryKeyProperties: string;
    params: GetterParams;
    props: GetterProps;
    response: GetterResponse;
    queryParams?: GetterQueryParam;
    mutator?: GeneratorMutator;
    queryOptionsMutator?: GeneratorMutator;
    queryKeyMutator?: GeneratorMutator;
    outputClient: OutputClient | OutputClientFunc;
    isExactOptionalPropertyTypes: boolean;
    hasSignal: boolean;
    route: string;
    doc?: string;
    usePrefetch?: boolean;
}) => {
    const queryProps = toObjectString(props, 'implementation')

    const hasInfiniteQueryParam = queryParam && queryParams?.schema.name;

    const httpFunctionProps = queryParam
        ? props
            .map((param) => {
                if (
                    param.type === GetterPropType.NAMED_PATH_PARAMS
                )
                    return param.destructured;
                return param.name === 'params'
                    ? `{...params, ${queryParam}: pageParam || ${`params?.['${queryParam}']`}}`
                    : param.name;
            })
            .join(',')
        : queryProperties;

    const returnType = generateQueryReturnType({
        outputClient,
        type,
        isMutatorHook: mutator?.isHook,
        operationName
    });

    let errorType = `AxiosError<${response.definition.errors || 'unknown'}>`;

    if (mutator) {
        errorType = mutator.hasErrorType
            ? `${mutator.default ? pascal(operationName) : ''}ErrorType<${
                response.definition.errors || 'unknown'
            }>`
            : response.definition.errors || 'unknown';
    }

    const dataType = mutator?.isHook
        ? `ReturnType<typeof use${pascal(operationName)}Hook>`
        : `typeof ${operationName}`;

    const queryArguments = generateQueryArguments({
        operationName,
        definitions: '',
        mutator,
        isRequestOptions,
        type,
        queryParams,
        queryParam,
    });

    const queryOptions = getQueryOptions({
        isRequestOptions,
        isExactOptionalPropertyTypes,
        mutator,
        hasSignal,
    });

    const hookOptions = getHookOptions({
        isRequestOptions,
        mutator,
    });

    const queryFnArguments = getQueryFnArguments({
        hasQueryParam:
            !!queryParam && props.some(({type}) => type === 'queryParam'),
        hasSignal,
    });

    const queryOptionFnReturnType = getQueryOptionsDefinition({
        operationName,
        definitions: '',
        mutator,
        type,
        queryParams,
        queryParam,
        isReturnType: true,
    });

    const queryOptionsImp = generateQueryOptions({
        params,
        options,
        type,
    });

    const queryOptionsFnName = camel(
        queryKeyMutator || queryOptionsMutator || mutator?.isHook
            ? `use-${name}-queryOptions`
            : `get-${name}-queryOptions`,
    );

    const queryOptionsVarName = isRequestOptions ? 'queryOptions' : 'options';

    const infiniteParam =
        queryParams && queryParam
            ? `, ${queryParams?.schema.name}['${queryParam}']`
            : '';
    const TData = (type === QueryType.INFINITE)
            ? `InfiniteData<Awaited<ReturnType<${dataType}>>${infiniteParam}>`
            : `Awaited<ReturnType<${dataType}>>`;

    const queryOptionsFn = `export const ${queryOptionsFnName} = <TData = ${TData}, TError = ${errorType}>(${queryProps} ${queryArguments}) => {

${hookOptions}

  const queryKey =  ${
        !queryKeyMutator
            ? `${'queryOptions?.queryKey ?? '
            }${queryKeyFnName}(${queryKeyProperties});`
            : `${queryKeyMutator.name}({ ${queryProperties} }${
                queryKeyMutator.hasSecondArg
                    ? `, { url: \`${route}\`, queryOptions }`
                    : ''
            });`
    }

  ${
        mutator?.isHook
            ? `const ${operationName} =  use${pascal(operationName)}Hook();`
            : ''
    }

    const queryFn: QueryFunction<Awaited<ReturnType<${
        mutator?.isHook
            ? `ReturnType<typeof use${pascal(operationName)}Hook>`
            : `typeof ${operationName}`
    }>>${hasInfiniteQueryParam
            ? `, QueryKey, ${queryParams?.schema.name}['${queryParam}']`
            : ''
    }> = (${queryFnArguments}) => ${operationName}(${httpFunctionProps}${
        httpFunctionProps ? ', ' : ''
    }${queryOptions});


      ${
        queryOptionsMutator
            ? `const customOptions = ${
                queryOptionsMutator.name
            }({...queryOptions, queryKey, queryFn}${
                queryOptionsMutator.hasSecondArg ? `, { ${queryProperties} }` : ''
            }${
                queryOptionsMutator.hasThirdArg ? `, { url: \`${route}\` }` : ''
            });`
            : ''
    }

   return  ${
        !queryOptionsMutator
            ? `{ queryKey, queryFn, ${queryOptionsImp}}`
            : 'customOptions'
    } as ${queryOptionFnReturnType} ${
        '& { initialData?: undefined }'
    }
}`;

    const operationPrefix = 'create';

    const definition = toObjectString(props, 'definition')
    const createQueryOptions = `
        options: () => {${definition} ${queryArguments}}
    `

    return `
${queryOptionsFn}

export type ${pascal(
        name,
    )}QueryResult = NonNullable<Awaited<ReturnType<${dataType}>>>
export type ${pascal(name)}QueryError = ${errorType}

${doc}export const ${camel(
        `${operationPrefix}-${name}`,
    )} = <TData = ${TData}, TError = ${errorType}>(\n ${createQueryOptions}\n  ): ${returnType} => {

  const query = ${camel(
        `${operationPrefix}-${type}`,
    )}(() => {
    const opts = options();
    return ${queryOptionsFnName}(${queryProperties && queryProperties.length ? queryProperties.trim().split(',').map(item => `opts['${item}']`).join(',') : ''}${
        queryProperties ? ',' : ''
    }${isRequestOptions ? `opts['options']` : `opts['queryOptions']`})
  }) as ${returnType};

  return query;
}\n
${
        usePrefetch
            ? `${doc}export const ${camel(
                `prefetch-${name}`,
            )} = async <TData = Awaited<ReturnType<${dataType}>>, TError = ${errorType}>(\n queryClient: QueryClient, ${queryProps} ${queryArguments}\n  ): Promise<QueryClient> => {

  const ${queryOptionsVarName} = ${queryOptionsFnName}(${queryProperties}${
                queryProperties ? ',' : ''
            }${isRequestOptions ? 'options' : 'queryOptions'})

  await queryClient.${camel(`prefetch-${type}`)}(${queryOptionsVarName});

  return queryClient;
}\n`
            : ''
    }
`;
};

const generateQueryHook = async (
    {
        queryParams,
        operationName,
        body,
        props: _props,
        verb,
        params,
        override,
        mutator,
        response,
        operationId,
        summary,
        deprecated,
    }: GeneratorVerbOptions,
    {route, override: {operations = {}}, context, output}: GeneratorOptions,
    outputClient: OutputClient | OutputClientFunc,
) => {
    let props = _props;
    const query = override?.query;
    const isRequestOptions = override?.requestOptions !== false;
    const operationQueryOptions = operations[operationId]?.query;
    const isExactOptionalPropertyTypes =
        !!context.tsconfig?.compilerOptions?.exactOptionalPropertyTypes;

    const hasSolidQuery = outputClient === OutputClient.SOLID_QUERY;

    const doc = jsDoc({summary, deprecated});

    let implementation = '';
    let mutators = undefined;

    const isQuery =
        (Verbs.GET === verb &&
            (override.query.useQuery || override.query.useInfinite)) ||
        operationQueryOptions?.useInfinite ||
        operationQueryOptions?.useQuery;

    if (isQuery) {
        const queryKeyMutator = query.queryKey
            ? await generateMutator({
                output,
                mutator: query.queryKey,
                name: `${operationName}QueryKey`,
                workspace: context.workspace,
                tsconfig: context.tsconfig,
            })
            : undefined;

        const queryOptionsMutator = query.queryOptions
            ? await generateMutator({
                output,
                mutator: query.queryOptions,
                name: `${operationName}QueryOptions`,
                workspace: context.workspace,
                tsconfig: context.tsconfig,
            })
            : undefined;

        const queryProperties = props
            .map((param) => {
                if (
                    param.type === GetterPropType.NAMED_PATH_PARAMS
                )
                    return param.destructured;
                return param.type === GetterPropType.BODY
                    ? body.implementation
                    : param.name;
            })
            .join(',');

        const queryKeyProperties = props
            .filter((prop) => prop.type !== GetterPropType.HEADER)
            .map((param) => {
                if (
                    param.type === GetterPropType.NAMED_PATH_PARAMS
                )
                    return param.destructured;
                return param.type === GetterPropType.BODY
                    ? body.implementation
                    : param.name;
            })
            .join(',');

        const queries = [
            ...(query?.useInfinite
                ? [
                    {
                        name: camel(`${operationName}-infinite`),
                        options: query?.options,
                        type: QueryType.INFINITE,
                        queryParam: query?.useInfiniteQueryParam,
                    },
                ]
                : []),
            ...((!query?.useQuery && !query?.useInfinite) || query?.useQuery
                ? [
                    {
                        name: operationName,
                        options: query?.options,
                        type: QueryType.QUERY,
                    },
                ]
                : []),
        ];

        const queryKeyFnName = camel(`get-${operationName}-queryKey`);
        let queryKeyProps = toObjectString(
            props.filter((prop) => prop.type !== GetterPropType.HEADER),
            'implementation',
        );

        const routeString = `\`${route}\``;

        const queryKeyFn = `export const ${queryKeyFnName} = (${queryKeyProps}) => {
    return [${routeString}${queryParams ? ', ...(params ? [params]: [])' : ''}${
            body.implementation ? `, ${body.implementation}` : ''
        }] as const;
    }`;

        implementation += `${!queryKeyMutator ? queryKeyFn : ''}

    ${queries.reduce(
            (acc, queryOption) =>
                acc +
                generateQueryImplementation({
                    queryOption,
                    operationName,
                    queryKeyFnName,
                    queryProperties,
                    queryKeyProperties,
                    params,
                    props,
                    mutator,
                    isRequestOptions,
                    queryParams,
                    response,
                    outputClient,
                    isExactOptionalPropertyTypes,
                    hasSignal: !!query.signal,
                    queryOptionsMutator,
                    queryKeyMutator,
                    route,
                    doc,
                    usePrefetch: query.usePrefetch,
                }),
            '',
        )}
`;

        mutators =
            queryOptionsMutator || queryKeyMutator
                ? [
                    ...(queryOptionsMutator ? [queryOptionsMutator] : []),
                    ...(queryKeyMutator ? [queryKeyMutator] : []),
                ]
                : undefined;
    }

    const isMutation =
        (verb !== Verbs.GET && override.query.useMutation) ||
        operationQueryOptions?.useMutation;

    if (isMutation) {
        const mutationOptionsMutator = query.mutationOptions
            ? await generateMutator({
                output,
                mutator: query.mutationOptions,
                name: `${operationName}MutationOptions`,
                workspace: context.workspace,
                tsconfig: context.tsconfig,
            })
            : undefined;

        const definitions = props
            .map(({definition, type}) =>
                type === GetterPropType.BODY
                    ? mutator?.bodyTypeName
                        ? `data: ${mutator.bodyTypeName}<${body.definition}>`
                        : `data: ${body.definition}`
                    : definition,
            )
            .join(';');

        const properties = props
            .map(({name, type}) => (type === GetterPropType.BODY ? 'data' : name))
            .join(',');

        let errorType = `AxiosError<${response.definition.errors || 'unknown'}>`;

        if (mutator) {
            errorType = mutator.hasErrorType
                ? `${mutator.default ? pascal(operationName) : ''}ErrorType<${
                    response.definition.errors || 'unknown'
                }>`
                : response.definition.errors || 'unknown';
        }

        const dataType = mutator?.isHook
            ? `ReturnType<typeof use${pascal(operationName)}Hook>`
            : `typeof ${operationName}`;

        const mutationOptionFnReturnType = getQueryOptionsDefinition({
            operationName,
            definitions,
            mutator,
            isReturnType: true,
        });

        const mutationArguments = generateQueryArguments({
            operationName,
            definitions,
            mutator,
            isRequestOptions
        });

        const mutationOptionsFnName = camel(
            mutationOptionsMutator || mutator?.isHook
                ? `use-${operationName}-mutationOptions`
                : `get-${operationName}-mutationOptions`,
        );

        const mutationOptionsVarName = isRequestOptions
            ? 'mutationOptions'
            : 'options';

        const mutationOptionsFn = `export const ${mutationOptionsFnName} = <TError = ${errorType},
    ${!definitions ? `TVariables = void,` : ''}
    TContext = unknown>(${mutationArguments}): ${mutationOptionFnReturnType} => {
 ${
            isRequestOptions
                ? `const {mutation: mutationOptions${
                    !mutator
                        ? `, axios: axiosOptions`
                        : mutator?.hasSecondArg
                            ? ', request: requestOptions'
                            : ''
                }} = options ?? {};`
                : ''
        }

      ${
            mutator?.isHook
                ? `const ${operationName} =  use${pascal(operationName)}Hook()`
                : ''
        }


      const mutationFn: MutationFunction<Awaited<ReturnType<${dataType}>>, ${
            definitions ? `{${definitions}}` : 'TVariables'
        }> = (${properties ? 'props' : ''}) => {
          ${properties ? `const {${properties}} = props ?? {};` : ''}

          return  ${operationName}(${properties}${properties ? ',' : ''}${
            isRequestOptions
                ? !mutator
                    ? `axiosOptions`
                    : mutator?.hasSecondArg
                        ? 'requestOptions'
                        : ''
                : ''
        })
        }

        ${
            mutationOptionsMutator
                ? `const customOptions = ${
                    mutationOptionsMutator.name
                }({...mutationOptions, mutationFn}${
                    mutationOptionsMutator.hasThirdArg
                        ? `, { url: \`${route}\` }`
                        : ''
                });`
                : ''
        }


   return  ${
            !mutationOptionsMutator
                ? '{ mutationFn, ...mutationOptions }'
                : 'customOptions'
        }}`;

        const operationPrefix = 'create'

        const mutationPropsSegments = mutationArguments.split('options?:')
        const mutationProps = `${isRequestOptions ? 'options' : 'mutationOptions'}?: () => ${mutationPropsSegments[1]}`

        implementation += `
${mutationOptionsFn}

    export type ${pascal(
            operationName,
        )}MutationResult = NonNullable<Awaited<ReturnType<${dataType}>>>
    ${
            body.definition
                ? `export type ${pascal(operationName)}MutationBody = ${
                    mutator?.bodyTypeName
                        ? `${mutator.bodyTypeName}<${body.definition}>`
                        : body.definition
                }`
                : ''
        }
    export type ${pascal(operationName)}MutationError = ${errorType}

    ${doc}export const ${camel(
            `${operationPrefix}-${operationName}`,
        )} = <TError = ${errorType},
    ${!definitions ? `TVariables = void,` : ''}
    TContext = unknown>(${mutationProps}) => {

      return ${operationPrefix}Mutation(() => {
        const opts = ${
            isRequestOptions ? 'options' : 'mutationOptions'
        }?.();
        return ${mutationOptionsFnName}(opts)
      });
    }
    `;

        mutators = mutationOptionsMutator
            ? [...(mutators ?? []), mutationOptionsMutator]
            : mutators;
    }

    return {
        implementation,
        mutators,
    };
};

export const generateQueryHeader: ClientHeaderBuilder = ({
                                                             isRequestOptions,
                                                             isMutator,
                                                             hasAwaitedType,
                                                         }) => {
    return `${
        !hasAwaitedType
            ? `type AwaitedInput<T> = PromiseLike<T> | T;\n
      type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;\n\n`
            : ''
    }
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
`;
};

export const generateQuery: ClientBuilder = async (
    verbOptions,
    options,
    outputClient,
) => {
    const imports = generateVerbImports(verbOptions);
    const functionImplementation = generateQueryRequestFunction(
        verbOptions,
        options,
        outputClient,
    );
    const {implementation: hookImplementation, mutators} =
        await generateQueryHook(verbOptions, options, outputClient);

    return {
        implementation: `${functionImplementation}\n\n${hookImplementation}`,
        imports,
        mutators,
    };
};

const dependenciesBuilder: Record<
    'solid-query',
    ClientDependenciesBuilder
> = {
    'solid-query': getSolidQueryDependencies,
};

export const builder =
    ({
         type = 'react-query',
         options: queryOptions,
     }: {
        type?: 'react-query' | 'vue-query' | 'svelte-query' | 'solid-query';
        options?: QueryOptions;
    } = {}) =>
        () => {
            const client: ClientBuilder = (verbOptions, options, outputClient) => {
                if (queryOptions) {
                    const normalizedQueryOptions = normalizeQueryOptions(
                        queryOptions,
                        options.context.workspace,
                    );
                    verbOptions.override.query = mergeDeep(
                        normalizedQueryOptions,
                        verbOptions.override.query,
                    );
                    options.override.query = mergeDeep(
                        normalizedQueryOptions,
                        verbOptions.override.query,
                    );
                }
                return generateQuery(verbOptions, options, outputClient);
            };

            return {
                client: client,
                header: generateQueryHeader,
                dependencies: dependenciesBuilder[type],
            };
        };

export default builder;
