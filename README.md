# zodaxios

HTTP client with schema validation using [Zod](https://zod.dev/).

- Lightweight using [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- No dependencies.
- [Axios](https://github.com/axios/axios) style API.

## Installation

```shell
npm install zodaxios
yarn add zodaxios
pnpm add zodaxios
```

## Usage

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
try {
  const { data } = await api.get('/', { schema });
} catch (error) {
  //     ^? error instanceof ZodError
}
```
