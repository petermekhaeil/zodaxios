type Schema<TData> = {
  parse: (data: unknown) => TData;
};

type ConfigDefaults = {
  baseURL?: string;
};

interface RequestConfig<TData> {
  schema?: Schema<TData>;
  responseType?: 'json' | 'text';
  url?: string;
  method?: 'get' | 'post';
}

type Response<TData> = {
  data: TData;
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
    method?: 'get' | 'post' | 'patch',
    data?: any
  ): Promise<Response<TData>>;
  create(defaults?: ConfigDefaults): Zodaxios;
  get: BodylessMethod;
  post: BodyMethod;
  patch: BodyMethod;
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

    const headers = {} as Record<string, string>;

    const responseType = options.responseType || 'json';

    if (options.baseURL) {
      config.url = (config.url || '').replace(
        /^(?!.*\/\/)\/?/,
        options.baseURL + '/'
      );
    }

    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      headers['content-type'] = 'application/json';
    }

    const response = await fetch(config.url, { method, body, headers });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    let data = undefined;

    try {
      data = await response[responseType]();
    } catch {}

    return {
      data: options.schema?.parse(data) ?? data
    };
  };

  zodaxios.create = create;
  zodaxios.get = (url, config) => zodaxios(url, config, 'get');
  zodaxios.post = (url, data, config) => zodaxios(url, config, 'post', data);
  zodaxios.patch = (url, data, config) => zodaxios(url, config, 'patch', data);

  return zodaxios;
}

export default create();
