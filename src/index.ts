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
    method?: 'get' | 'post'
  ): Promise<{ data: TData }>;
  create(defaults?: ConfigDefaults): zodaxios;
  get: <TData>(
    url: string,
    config: Omit<RequestConfig<TData>, 'url'>
  ) => Promise<{ data: TData }>;
}

function create(defaults: ConfigDefaults = {}) {
  const zodaxios: zodaxios = async (configOrUrl, config, method) => {
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

    const responseType = options.responseType || 'json';

    if (options.baseURL) {
      url = url.replace(/^(?!.*\/\/)\/?/, options.baseURL + '/');
    }

    const response = await fetch(url, { method });

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

  return zodaxios;
}

export default create();
