# zodaxios

HTTP client with schema validation using [Zod](https://zod.dev/).

- 🚀 Lightweight.
- 🎉 No dependencies.
- 🤖 Compatible with [Axios](https://github.com/axios/axios) API.
- 🔄 Supports Interceptors.

## Example

```js
import zodaxios from 'zodaxios';

const schema = z.object({
  name: z.string()
});

const { data } = await zodaxios('/api', { schema });
//      ^? { name: string }
```

## Creating an instance

```js
import zodaxios from 'zodaxios';

const api = zodaxios.create({
  baseURL: 'https://example.com'
});

const schema = z.object({
  name: z.string()
});

const { data } = await api.get('/api', { schema });
```

## Handling errors

```js
import zodaxios, { ZodaxiosError } from 'zodaxios';

try {
  const { data } = await api.get('/api', { schema });
} catch (error) {
  if (error instanceof ZodaxiosError) {
    // Zod validation failed. The schema did not match
    // the response data from the server.
    console.log('Validation failed', { error });
  } else if (error.response) {
    // The server responded with an error
    console.log('Error from server', { response });
  }
}
```

## Interceptors

```js
// Add a request interceptor
zodaxios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
zodaxios.interceptors.response.use(
  function (response) {
    // Do something with response data
    return response;
  },
  function (error) {
    // Do something with response error
    return Promise.reject(error);
  }
);
```
