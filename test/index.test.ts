import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { z } from 'zod';
import zodaxios, { ZodaxiosError } from '../src/index';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import fetch, { Headers } from 'cross-fetch';

global.fetch = fetch;
global.Headers = Headers;

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('should return schema on success 200', async () => {
  server.use(
    rest.get('https://example.com', (req, res, ctx) => {
      return res(ctx.json({ name: 'zodaxios' }), ctx.status(200));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string()
  });

  const { data } = await api.get('/', { schema });

  expect(data).toEqual({ name: 'zodaxios' });
});

it('should throw error on 404', async () => {
  server.use(
    rest.get('https://example.com', (req, res, ctx) => {
      return res(ctx.json({}), ctx.status(404));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string()
  });

  try {
    await api.get('/', { schema });
  } catch (e) {
    expect(e.response.config).toEqual({ schema, url: 'https://example.com/' });
    expect(e.response.status).toEqual(404);
    expect(e.response.headers.get('content-type')).toEqual('application/json');
  }
});

it('should throw error if schema does not match', async () => {
  server.use(
    rest.get('https://example.com', (req, res, ctx) => {
      return res(ctx.json({ name: 'zodaxios' }), ctx.status(200));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.number()
  });

  try {
    await api.get('/', { schema });
  } catch (e) {
    const expectedError = z.ZodError.create([
      {
        code: 'invalid_type',
        expected: 'number',
        received: 'string',
        path: ['name'],
        message: 'Expected number, received string'
      }
    ]);
    expect(e).instanceOf(ZodaxiosError);
    expect((e as ZodaxiosError).cause).toBeInstanceOf(z.ZodError);
    expect((e as ZodaxiosError).cause).toEqual(expectedError);
    expect((e as ZodaxiosError).message).toBe(expectedError.message);
  }
});

it('should handle text response', async () => {
  server.use(
    rest.get('https://example.com', (req, res, ctx) => {
      return res(ctx.body('text content'), ctx.status(200));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.string();

  const { data } = await api.get('/', { schema, responseType: 'text' });

  expect(data).toEqual('text content');
});

it('should return error for failed json parse', async () => {
  server.use(
    rest.get('https://example.com', (req, res, ctx) => {
      return res(ctx.body('text content'), ctx.status(200));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string()
  });

  try {
    await api.get('/', { schema });
  } catch (e) {
    const expectedError = z.ZodError.create([
      {
        code: 'invalid_type',
        expected: 'object',
        received: 'undefined',
        path: [],
        message: 'Required'
      }
    ]);
    expect(e).instanceOf(ZodaxiosError);
    expect((e as ZodaxiosError).cause).toBeInstanceOf(z.ZodError);
    expect((e as ZodaxiosError).cause).toEqual(expectedError);
    expect((e as ZodaxiosError).message).toBe(expectedError.message);
  }
});

it('should support config as first parameter', async () => {
  server.use(
    rest.get('https://example.com', (req, res, ctx) => {
      return res(ctx.json({ name: 'zodaxios' }), ctx.status(200));
    })
  );

  const schema = z.object({
    name: z.string()
  });

  const { data } = await zodaxios({
    url: 'https://example.com/',
    method: 'get',
    schema
  });

  expect(data).toEqual({ name: 'zodaxios' });
});

it('should support request body (post)', async () => {
  server.use(
    rest.post('https://example.com', async (req, res, ctx) => {
      const body = await req.json();
      return res(ctx.status(200), ctx.json(body));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string()
  });

  const { data } = await api.post('/', { name: 'zodaxios' }, { schema });

  expect(data).toEqual({ name: 'zodaxios' });
});

it('should support request body (patch)', async () => {
  server.use(
    rest.patch('https://example.com', async (req, res, ctx) => {
      const body = await req.json();
      return res(ctx.status(200), ctx.json(body));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string()
  });

  const { data } = await api.patch('/', { name: 'zodaxios' }, { schema });

  expect(data).toEqual({ name: 'zodaxios' });
});

it('should support request body (put)', async () => {
  server.use(
    rest.put('https://example.com', async (req, res, ctx) => {
      const body = await req.json();
      return res(ctx.status(200), ctx.json(body));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string()
  });

  const { data } = await api.put('/', { name: 'zodaxios' }, { schema });

  expect(data).toEqual({ name: 'zodaxios' });
});

it('should support params', async () => {
  server.use(
    rest.get('https://example.com/api', (req, res, ctx) => {
      const params = Object.fromEntries(req.url.searchParams);
      return res(ctx.json(params), ctx.status(200));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string()
  });

  const params = { name: 'zodaxios' };

  const { data } = await api.get('/api', {
    schema,
    params
  });

  expect(data).toEqual({ name: 'zodaxios' });
});

it('should merge params', async () => {
  server.use(
    rest.get('https://example.com/api', (req, res, ctx) => {
      const params = Object.fromEntries(req.url.searchParams);
      return res(ctx.json(params), ctx.status(200));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string(),
    id: z.string()
  });

  const params = { name: 'zodaxios' };

  const { data } = await api.get('/api?id=1', {
    schema,
    params
  });

  expect(data).toEqual({ id: '1', name: 'zodaxios' });
});

it('should accept URLSearchParams as params', async () => {
  server.use(
    rest.get('https://example.com/api', (req, res, ctx) => {
      const params = Object.fromEntries(req.url.searchParams);
      return res(ctx.json(params), ctx.status(200));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string(),
    id: z.string()
  });

  const params = new URLSearchParams({ name: 'zodaxios' });

  const { data } = await api.get('/api?id=1', {
    schema,
    params
  });

  expect(data).toEqual({ id: '1', name: 'zodaxios' });
});

it('should support delete request', async () => {
  server.use(
    rest.delete('https://example.com', async (req, res, ctx) => {
      return res(ctx.json({ name: 'zodaxios' }), ctx.status(200));
    })
  );

  const api = zodaxios.create({
    baseURL: 'https://example.com'
  });

  const schema = z.object({
    name: z.string()
  });

  const { data } = await api.delete('/', { schema });

  expect(data).toEqual({ name: 'zodaxios' });
});

it.skip('should support baseURL when set in instance', async () => {});
it.skip('should support headers when set in instance', async () => {});
it.skip('should support auth when set in instance', async () => {});
it.skip('should support baseURL when set in request config', async () => {});
it.skip('should support headers when set in request config', async () => {});
it.skip('should support auth when set in request config', async () => {});
it.skip('should support FormData', async () => {});
it.skip('should support url as first parameter', async () => {});
it.skip('should support stream response type', async () => {});
