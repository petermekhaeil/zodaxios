type Schema<TData> = {
  safeParseAsync(
    data: unknown
  ): Promise<{ success: true; data: TData } | { success: false; error: Error }>;
};

type ConfigDefaults = {
  baseURL?: string;
};

interface RequestConfig<TData> {
  schema?: Schema<TData>;
  responseType?: 'json' | 'text';
  url?: string;
  method?: 'get' | 'post' | 'patch' | 'put';
  params?: Record<string, string> | URLSearchParams;
  withCredentials?: boolean;
}

type Response<TData> = {
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
    method?: 'get' | 'post' | 'patch' | 'put',
    data?: any
  ): Promise<Response<TData>>;
  create(defaults?: ConfigDefaults): Zodaxios;
  get: BodylessMethod;
  post: BodyMethod;
  patch: BodyMethod;
  put: BodyMethod;
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

    const options = {
      ...defaults,
      ...config
    };

    // There should be a way in TS to be certain there is
    // a value because it cannot be undefined by this stage.
    if (!config.url) {
      throw new Error('Missing URL. Please see documentation on usage.');
    }

    const headers = new Headers();

    const responseType = options.responseType || 'json';

    if (options.baseURL) {
      config.url = (config.url || '').replace(
        /^(?!.*\/\/)\/?/,
        options.baseURL + '/'
      );
    }

    if (options.params) {
      config.url +=
        (config.url.indexOf('?') === -1 ? '?' : '&') +
        new URLSearchParams(options.params);
    }

    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      headers.set('content-type', 'application/json');
    }

    const res = await fetch(config.url, {
      method,
      body,
      headers,
      credentials: options.withCredentials ? 'include' : undefined
    });

    let response = {
      config,
      headers: res.headers,
      status: res.status,
      data: undefined as any
    };

    if (!res.ok) {
      return Promise.reject({ response });
    }

    try {
      response.data = await res[responseType]();
    } catch {}

    if (responseType === 'json' && options.schema) {
      let parsed = await options.schema.safeParseAsync(response.data);

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
  zodaxios.post = (url, data, config) => zodaxios(url, config, 'post', data);
  zodaxios.patch = (url, data, config) => zodaxios(url, config, 'patch', data);
  zodaxios.put = (url, data, config) => zodaxios(url, config, 'put', data);

  return zodaxios;
}

export default create();
