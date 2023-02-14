import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { z } from 'zod';
import zodaxios from '../src/index';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import fetch from 'cross-fetch';

global.fetch = fetch;

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

  expect(() => api.get('/', { schema })).rejects.toThrowError();
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

  expect(() => api.get('/', { schema })).rejects.toMatchObject(
    z.ZodError.create([
      {
        code: 'invalid_type',
        expected: 'number',
        received: 'string',
        path: ['name'],
        message: 'Expected number, received string'
      }
    ])
  );
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

  expect(() => api.get('/', { schema })).rejects.toMatchObject(
    z.ZodError.create([
      {
        code: 'invalid_type',
        expected: 'object',
        received: 'undefined',
        path: [],
        message: 'Required'
      }
    ])
  );
});

it.skip('should support baseURL when set in instance', async () => {});
it.skip('should support headers when set in instance', async () => {});
it.skip('should support auth when set in instance', async () => {});
it.skip('should support baseURL when set in request config', async () => {});
it.skip('should support headers when set in request config', async () => {});
it.skip('should support auth when set in request config', async () => {});
it.skip('should support request body (post)', async () => {});
it.skip('should support request body (patch)', async () => {});
it.skip('should support FormData', async () => {});
it.skip('should support params', async () => {});

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

it.skip('should support url as first parameter', async () => {});
it.skip('should support stream response type', async () => {});
