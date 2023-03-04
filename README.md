# zodaxios

HTTP client with schema validation using [Zod](https://zod.dev/).

- Lightweight using [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- No dependencies.
- [Axios](https://github.com/axios/axios) style API.

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
import zodaxios from 'zodaxios';

const api = zodaxios.create({
  baseURL: 'https://example.com'
});

const schema = z.object({
  name: z.string()
});

const { data } = await api.get('/api', { schema });
```

## Request Methods

### zodaxios.get

```ts
get(url: string, config: RequestConfig): Promise<Response>;
```

**Example:**

```js
const { data } = await api.get('/api');
```

### zodaxios.post

```ts
post(url: string, data: any, config: RequestConfig): Promise<Response>;
```

**Example:**

```js
const { data } = await api.post('/api', { name: 'zodaxios' });
```

### zodaxios.put

```ts
put(url: string, data: any, config: RequestConfig): Promise<Response>;
```

**Example:**

```js
const { data } = await api.put('/api', { name: 'zodaxios' });
```

### zodaxios.patch

```ts
patch(url: string, data: any, config: RequestConfig): Promise<Response>;
```

**Example:**

```js
const { data } = await api.patch('/api', { name: 'zodaxios' });
```

### zodaxios.delete

```ts
delete(url: string, config: RequestConfig): Promise<Response>;
```

**Example:**

```js
const { data } = await api.delete('/api');
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
