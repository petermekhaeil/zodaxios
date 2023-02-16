type Schema<TData> = {
  parse: (data: unknown) => TData;
};

type ConfigDefaults = {
  baseURL?: string;
};

interface RequestConfig<TData> {
  schema: Schema<TData>;
  responseType?: 'json' | 'text';
  url: string;
  method?: 'get' | 'post';
}

interface zodaxios {
  <TData>(
    configOrUrl: RequestConfig<TData> | string,
    config?: RequestConfig<TData>,
    method?: 'get' | 'post' | 'patch',
    data?: any
  ): Promise<{ data: TData }>;
  create(defaults?: ConfigDefaults): zodaxios;
  get: <TData>(
    url: string,
    config: Omit<RequestConfig<TData>, 'url'>
  ) => Promise<{ data: TData }>;
  post: <TData>(
    url: string,
    data: any,
    config: Omit<RequestConfig<TData>, 'url'>
  ) => Promise<{ data: TData }>;
  patch: <TData>(
    url: string,
    data: any,
    config: Omit<RequestConfig<TData>, 'url'>
  ) => Promise<{ data: TData }>;
}

function create(defaults: ConfigDefaults = {}) {
  const zodaxios: zodaxios = async (configOrUrl, config, method, body) => {
    let url: string;

    // zodaxios support both usages:
    // zodaxios('/', config);
    // zodaxios({ url: '/' });
    if (typeof configOrUrl !== 'string') {
      url = (config = configOrUrl).url;
    } else {
      url = configOrUrl;
    }

    const options = {
      ...defaults,
      ...config
    };

    const headers = {} as Record<string, string>;

    const responseType = options.responseType || 'json';

    if (options.baseURL) {
      url = url.replace(/^(?!.*\/\/)\/?/, options.baseURL + '/');
    }

    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      headers['content-type'] = 'application/json';
    }

    const response = await fetch(url, { method, body, headers });

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
  zodaxios.get = (url, config) => zodaxios(url, { ...config, url }, 'get');
  zodaxios.post = (url, data, config) =>
    zodaxios(url, { ...config, url }, 'post', data);
  zodaxios.patch = (url, data, config) =>
    zodaxios(url, { ...config, url }, 'patch', data);

  return zodaxios;
}

export default create();
