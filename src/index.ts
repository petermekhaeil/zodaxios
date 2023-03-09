type Schema<TData> = {
  safeParseAsync(
    data: unknown
  ): Promise<{ success: true; data: TData } | { success: false; error: Error }>;
};

type RawHeaders = {
  [key: string]: string;
};

type ConfigDefaults = {
  baseURL?: string;
  headers?: RawHeaders;
};

interface RequestConfig<TData = any> {
  schema?: Schema<TData>;
  responseType?: 'json' | 'text';
  url?: string;
  method?: 'get' | 'post' | 'patch' | 'put' | 'delete';
  params?: Record<string, string> | URLSearchParams;
  withCredentials?: boolean;
  baseURL?: string;
  headers?: RawHeaders;
  // default status >= 200 && status < 300
  validateStatus?: (status: number) => boolean;
}

type Response<TData = any> = {
  config: RequestConfig<TData>;
  headers: Headers;
  data: TData;
  status: number;
};

type BodyMethod = <TData>(
  url: string,
  data?: any,
  config?: Omit<RequestConfig<TData>, 'url'>
) => Promise<Response<TData>>;

type BodylessMethod = <TData>(
  url: string,
  config?: Omit<RequestConfig<TData>, 'url'>
) => Promise<Response<TData>>;

interface Zodaxios {
  <TData>(
    configOrUrl: RequestConfig<TData> | string,
    config?: RequestConfig<TData>,
    method?: 'get' | 'post' | 'patch' | 'put' | 'delete',
    data?: any
  ): Promise<Response<TData>>;
  create(defaults?: ConfigDefaults): Zodaxios;
  get: BodylessMethod;
  delete: BodylessMethod;
  post: BodyMethod;
  patch: BodyMethod;
  put: BodyMethod;
  interceptors: {
    request: Interceptor<RequestConfig>;
    response: Interceptor<Response>;
  };
}

export class ZodaxiosError extends Error {
  constructor(
    message: string,
    public readonly config?: RequestConfig<any>,
    public readonly data?: unknown,
    public readonly cause?: Error
  ) {
    super(message);
  }
}

class Interceptor<Value> {
  handlers: Array<{
    done: (value: Value) => Value;
    error?: Function;
  } | null>;

  constructor() {
    this.handlers = [];
  }

  use(done: (value: Value) => Value, error?: Function) {
    return this.handlers.push({ done, error }) - 1;
  }

  eject(id: number) {
    this.handlers[id] = null;
  }
}

function create(defaults: ConfigDefaults = {}) {
  const zodaxios: Zodaxios = async (configOrUrl, config, method, body) => {
    // zodaxios support both usages:
    // zodaxios('/', config);
    // zodaxios({ url: '/' });
    if (typeof configOrUrl === 'string') {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }

    config = {
      ...defaults,
      ...config
    };

    // There should be a way in TS to be certain there is
    // a value because it cannot be undefined by this stage.
    if (!config.url) {
      throw new Error('Missing URL. Please see documentation on usage.');
    }

    const headers: RawHeaders = {};

    const responseType = config.responseType || 'json';

    zodaxios.interceptors.request.handlers.map((handler) => {
      if (handler && config) {
        const result = handler.done(config);

        config = {
          ...config,
          ...result
        };
      }
    });

    if (config.baseURL) {
      config.url = (config.url || '').replace(
        /^(?!.*\/\/)\/?/,
        config.baseURL + '/'
      );
    }

    if (config.params) {
      config.url +=
        (config.url.indexOf('?') === -1 ? '?' : '&') +
        new URLSearchParams(config.params);
    }

    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      headers['content-type'] = 'application/json';
    }

    const mergedHeaders = { ...config.headers, ...headers };

    const res = await fetch(config.url, {
      method,
      body,
      headers: mergedHeaders,
      credentials: config.withCredentials ? 'include' : undefined
    });

    let response = {
      config,
      headers: res.headers,
      status: res.status,
      data: undefined as any
    };

    const ok = config.validateStatus
      ? config.validateStatus(res.status)
      : res.ok;

    if (!ok) {
      zodaxios.interceptors.response.handlers.map((handler) => {
        if (handler && handler.error) {
          handler.error(res);
        }
      });

      const error = Promise.reject({ response });

      zodaxios.interceptors.request.handlers.map((handler) => {
        if (handler && handler.error) {
          handler.error(error);
        }
      });

      return error;
    }

    try {
      response.data = await res[responseType]();
    } catch {}

    zodaxios.interceptors.response.handlers.map((handler) => {
      if (handler) {
        response = handler.done(response);
      }
    });

    if (responseType === 'json' && config.schema) {
      let parsed = await config.schema.safeParseAsync(response.data);

      if (!parsed.success) {
        throw new ZodaxiosError(
          parsed.error.message,
          config,
          response.data,
          parsed.error
        );
      }

      response.data = parsed.data;
    }

    return response;
  };

  zodaxios.create = create;
  zodaxios.get = (url, config) => zodaxios(url, config, 'get');
  zodaxios.delete = (url, config) => zodaxios(url, config, 'delete');
  zodaxios.post = (url, data, config) => zodaxios(url, config, 'post', data);
  zodaxios.patch = (url, data, config) => zodaxios(url, config, 'patch', data);
  zodaxios.put = (url, data, config) => zodaxios(url, config, 'put', data);

  zodaxios.interceptors = {
    request: new Interceptor(),
    response: new Interceptor()
  };

  return zodaxios;
}

export default create();
