[![npm version](https://badge.fury.io/js/otqs.svg)](https://badge.fury.io/js/otqs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## OpenAPI Generator for Tanstack Query with Solid Integration

<h3 align="center">
  This project is fork of <a href="https://orval.dev" target="_blank">orval.dev</a>.
</h3>

### Code Generation

`otqs` is able to generate client with appropriate type-signatures (TypeScript) from any valid OpenAPI v3 or Swagger v2 specification, either in `yaml` or `json` formats.

`Generate`, `valid`, `cache` and `mock` in your SolidJS applications all with your OpenAPI specification.

---

### Installation

- **NPM:** ```npm install otqs```
- **YARN:** ```yarn add otqs```
- **PNPM:** ```pnpm install otqs```
---
### Configuration

#### **This package generates code that depends on the axios, @tanstack-query/solid, and solid-js packages.**
- **NPM:** ```npm install axios @tanstack/solid-query solid-js```
- **YARN:** ```yarn add axios @tanstack/solid-query solid-js```
- **PNPM:** ```pnpm install axios @tanstack/solid-query solid-js```


**More details:** [solid-query](https://github.com/AndrejNemec/openapi-tanstack-query-solid/tree/master/samples/solid-query/basic-app)

**otqs.config.ts**:
```ts
import { defineConfig } from 'otqs';

export default defineConfig({
  petstore: {
    output: {
      mode: 'split',
      target: 'src/api/endpoints/petstore-endpoints.ts',
      schemas: 'src/api/model',
      client: 'solid-query',
      mock: true,
      prettier: true,
      override: {
        //Optional
        mutator: {
          path: './src/api/mutator/custom-instance.ts',
          name: 'customInstance',
        },
        operations: {
          listPets: {
            query: {
              useQuery: true,
              useInfinite: true,
              useInfiniteQueryParam: 'limit',
            },
          }
        }
      }
    },
    input: {
      target: './petstore.yaml' //or json format
    },
  },
});

```
**custom-instance.ts**:
```ts
import Axios, { AxiosError, AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = Axios.create({ baseURL: '' });

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
    const source = Axios.CancelToken.source();
    const promise = AXIOS_INSTANCE({ ...config, cancelToken: source.token }).then(
        ({ data }) => data,
    );

    // @ts-ignore
    promise.cancel = () => {
        source.cancel('Query was cancelled by Vue Query');
    };

    return promise;
};

export default customInstance;

export interface ErrorType<Error> extends AxiosError<Error> {}
```
---

### Usage

Command for generate open-api sdk:
```bash
otqs
```
---
### Example

- [solid-query](https://github.com/AndrejNemec/openapi-tanstack-query-solid/tree/master/samples/solid-query/basic-app)