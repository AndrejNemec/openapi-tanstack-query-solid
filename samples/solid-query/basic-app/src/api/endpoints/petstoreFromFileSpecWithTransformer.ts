/**
 * Generated by openapi-tanstack-query-solid v1.0.1 🍺
 * Do not edit manually.
 * Swagger Petstore
 * OpenAPI spec version: 1.0.0
 */
import {
  createInfiniteQuery,
  createMutation,
  createQuery,
} from '@tanstack/solid-query';
import type {
  CreateInfiniteQueryResult,
  CreateQueryResult,
  InfiniteData,
  MutationFunction,
  QueryFunction,
  QueryKey,
  SolidInfiniteQueryOptions,
  SolidMutationOptions,
  SolidQueryOptions,
} from '@tanstack/solid-query';
import type {
  CreatePetsBody,
  Error,
  ListPetsParams,
  Pet,
  Pets,
} from '../model';
import { customInstance } from '../mutator/custom-instance';
import type { ErrorType } from '../mutator/custom-instance';

// https://stackoverflow.com/questions/49579094/typescript-conditional-types-filter-out-readonly-properties-pick-only-requir/49579497#49579497
type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? A
  : B;

type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P
  >;
}[keyof T];

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;
type DistributeReadOnlyOverUnions<T> = T extends any ? NonReadonly<T> : never;

type Writable<T> = Pick<T, WritableKeys<T>>;
type NonReadonly<T> = [T] extends [UnionToIntersection<T>]
  ? {
      [P in keyof Writable<T>]: T[P] extends object
        ? NonReadonly<NonNullable<T[P]>>
        : T[P];
    }
  : DistributeReadOnlyOverUnions<T>;

/**
 * @summary List all pets
 */
export const listPets = (params?: ListPetsParams) => {
  return customInstance<Pets>({ url: `/pets`, method: 'GET', params });
};

export const getListPetsQueryKey = (params?: ListPetsParams) => {
  return [`/pets`, ...(params ? [params] : [])] as const;
};

export const getListPetsInfiniteQueryOptions = <
  TData = InfiniteData<
    Awaited<ReturnType<typeof listPets>>,
    ListPetsParams['limit']
  >,
  TError = ErrorType<Error>,
>(
  params?: ListPetsParams,
  options?: {
    query?: Partial<
      SolidInfiniteQueryOptions<
        Awaited<ReturnType<typeof listPets>>,
        TError,
        TData,
        Awaited<ReturnType<typeof listPets>>,
        QueryKey,
        ListPetsParams['limit']
      >
    >;
  },
) => {
  const { query: queryOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getListPetsQueryKey(params);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof listPets>>,
    QueryKey,
    ListPetsParams['limit']
  > = ({ pageParam }) =>
    listPets({ ...params, limit: pageParam || params?.['limit'] });

  return { queryKey, queryFn, ...queryOptions } as SolidInfiniteQueryOptions<
    Awaited<ReturnType<typeof listPets>>,
    TError,
    TData,
    Awaited<ReturnType<typeof listPets>>,
    QueryKey,
    ListPetsParams['limit']
  > & { initialData?: undefined };
};

export type ListPetsInfiniteQueryResult = NonNullable<
  Awaited<ReturnType<typeof listPets>>
>;
export type ListPetsInfiniteQueryError = ErrorType<Error>;

/**
 * @summary List all pets
 */
export const createListPetsInfinite = <
  TData = InfiniteData<
    Awaited<ReturnType<typeof listPets>>,
    ListPetsParams['limit']
  >,
  TError = ErrorType<Error>,
>(
  options: () => {
    params?: ListPetsParams;
    options?: {
      query?: Partial<
        SolidInfiniteQueryOptions<
          Awaited<ReturnType<typeof listPets>>,
          TError,
          TData,
          Awaited<ReturnType<typeof listPets>>,
          QueryKey,
          ListPetsParams['limit']
        >
      >;
    };
  },
): CreateInfiniteQueryResult<TData, TError> => {
  const query = createInfiniteQuery(() => {
    const opts = options();
    return getListPetsInfiniteQueryOptions(opts['params'], opts['options']);
  }) as CreateInfiniteQueryResult<TData, TError>;

  return query;
};

export const getListPetsQueryOptions = <
  TData = Awaited<ReturnType<typeof listPets>>,
  TError = ErrorType<Error>,
>(
  params?: ListPetsParams,
  options?: {
    query?: Partial<
      SolidQueryOptions<Awaited<ReturnType<typeof listPets>>, TError, TData>
    >;
  },
) => {
  const { query: queryOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getListPetsQueryKey(params);

  const queryFn: QueryFunction<Awaited<ReturnType<typeof listPets>>> = () =>
    listPets(params);

  return { queryKey, queryFn, ...queryOptions } as SolidQueryOptions<
    Awaited<ReturnType<typeof listPets>>,
    TError,
    TData
  > & { initialData?: undefined };
};

export type ListPetsQueryResult = NonNullable<
  Awaited<ReturnType<typeof listPets>>
>;
export type ListPetsQueryError = ErrorType<Error>;

/**
 * @summary List all pets
 */
export const createListPets = <
  TData = Awaited<ReturnType<typeof listPets>>,
  TError = ErrorType<Error>,
>(
  options: () => {
    params?: ListPetsParams;
    options?: {
      query?: Partial<
        SolidQueryOptions<Awaited<ReturnType<typeof listPets>>, TError, TData>
      >;
    };
  },
): CreateQueryResult<TData, TError> => {
  const query = createQuery(() => {
    const opts = options();
    return getListPetsQueryOptions(opts['params'], opts['options']);
  }) as CreateQueryResult<TData, TError>;

  return query;
};

/**
 * @summary Create a pet
 */
export const createPets = (createPetsBody: CreatePetsBody) => {
  return customInstance<Pet>({
    url: `/pets`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: createPetsBody,
  });
};

export const getCreatePetsMutationOptions = <
  TError = ErrorType<Error>,
  TContext = unknown,
>(options?: {
  mutation?: SolidMutationOptions<
    Awaited<ReturnType<typeof createPets>>,
    TError,
    { data: CreatePetsBody },
    TContext
  >;
}): SolidMutationOptions<
  Awaited<ReturnType<typeof createPets>>,
  TError,
  { data: CreatePetsBody },
  TContext
> => {
  const { mutation: mutationOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createPets>>,
    { data: CreatePetsBody }
  > = (props) => {
    const { data } = props ?? {};

    return createPets(data);
  };

  return { mutationFn, ...mutationOptions };
};

export type CreatePetsMutationResult = NonNullable<
  Awaited<ReturnType<typeof createPets>>
>;
export type CreatePetsMutationBody = CreatePetsBody;
export type CreatePetsMutationError = ErrorType<Error>;

/**
 * @summary Create a pet
 */
export const createCreatePets = <TError = ErrorType<Error>, TContext = unknown>(
  options?: () => {
    mutation?: SolidMutationOptions<
      Awaited<ReturnType<typeof createPets>>,
      TError,
      { data: CreatePetsBody },
      TContext
    >;
  },
) => {
  return createMutation(() => {
    const opts = options?.();
    return getCreatePetsMutationOptions(opts);
  });
};

/**
 * @summary Update a pet
 */
export const updatePets = (pet: NonReadonly<Pet>) => {
  return customInstance<Pet>({
    url: `/pets`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data: pet,
  });
};

export const getUpdatePetsMutationOptions = <
  TError = ErrorType<Error>,
  TContext = unknown,
>(options?: {
  mutation?: SolidMutationOptions<
    Awaited<ReturnType<typeof updatePets>>,
    TError,
    { data: NonReadonly<Pet> },
    TContext
  >;
}): SolidMutationOptions<
  Awaited<ReturnType<typeof updatePets>>,
  TError,
  { data: NonReadonly<Pet> },
  TContext
> => {
  const { mutation: mutationOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updatePets>>,
    { data: NonReadonly<Pet> }
  > = (props) => {
    const { data } = props ?? {};

    return updatePets(data);
  };

  return { mutationFn, ...mutationOptions };
};

export type UpdatePetsMutationResult = NonNullable<
  Awaited<ReturnType<typeof updatePets>>
>;
export type UpdatePetsMutationBody = NonReadonly<Pet>;
export type UpdatePetsMutationError = ErrorType<Error>;

/**
 * @summary Update a pet
 */
export const createUpdatePets = <TError = ErrorType<Error>, TContext = unknown>(
  options?: () => {
    mutation?: SolidMutationOptions<
      Awaited<ReturnType<typeof updatePets>>,
      TError,
      { data: NonReadonly<Pet> },
      TContext
    >;
  },
) => {
  return createMutation(() => {
    const opts = options?.();
    return getUpdatePetsMutationOptions(opts);
  });
};

/**
 * @summary Info for a specific pet
 */
export const showPetById = (petId: string, signal?: AbortSignal) => {
  return customInstance<Pet>({ url: `/pets/${petId}`, method: 'GET', signal });
};

export const getShowPetByIdQueryKey = (petId: string) => {
  return [`/pets/${petId}`] as const;
};

export const getShowPetByIdQueryOptions = <
  TData = Awaited<ReturnType<typeof showPetById>>,
  TError = ErrorType<Error>,
>(
  petId: string,
  options?: {
    query?: Partial<
      SolidQueryOptions<Awaited<ReturnType<typeof showPetById>>, TError, TData>
    >;
  },
) => {
  const { query: queryOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getShowPetByIdQueryKey(petId);

  const queryFn: QueryFunction<Awaited<ReturnType<typeof showPetById>>> = ({
    signal,
  }) => showPetById(petId, signal);

  return {
    queryKey,
    queryFn,
    enabled: !!petId,
    ...queryOptions,
  } as SolidQueryOptions<
    Awaited<ReturnType<typeof showPetById>>,
    TError,
    TData
  > & { initialData?: undefined };
};

export type ShowPetByIdQueryResult = NonNullable<
  Awaited<ReturnType<typeof showPetById>>
>;
export type ShowPetByIdQueryError = ErrorType<Error>;

/**
 * @summary Info for a specific pet
 */
export const createShowPetById = <
  TData = Awaited<ReturnType<typeof showPetById>>,
  TError = ErrorType<Error>,
>(
  options: () => {
    petId: string;
    options?: {
      query?: Partial<
        SolidQueryOptions<
          Awaited<ReturnType<typeof showPetById>>,
          TError,
          TData
        >
      >;
    };
  },
): CreateQueryResult<TData, TError> => {
  const query = createQuery(() => {
    const opts = options();
    return getShowPetByIdQueryOptions(opts['petId'], opts['options']);
  }) as CreateQueryResult<TData, TError>;

  return query;
};
