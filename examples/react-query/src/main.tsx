import * as React from 'react';
import ReactDOM from 'react-dom/client';
import zodaxios from '../../../src/index';
import { useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { z } from 'zod';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24 // 24 hours
    }
  }
});

const persister = createSyncStoragePersister({
  storage: window.localStorage
});

const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string()
});

const PostArraySchema = z.array(PostSchema);

function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await zodaxios.get(
        'https://jsonplaceholder.typicode.com/posts',
        { schema: PostArraySchema }
      );
      return data;
    }
  });
}

function Posts({
  setPostId
}: {
  setPostId: React.Dispatch<React.SetStateAction<number>>;
}) {
  const queryClient = useQueryClient();
  const { status, data, error, isFetching } = usePosts();

  return (
    <div>
      <h1>Posts</h1>
      <div>
        {status === 'loading' ? (
          'Loading...'
        ) : error instanceof Error ? (
          <span>Error: {error.message}</span>
        ) : (
          <>
            <div>
              {data?.map((post) => (
                <p key={post.id}>
                  <a
                    onClick={() => setPostId(post.id)}
                    href="#"
                    style={
                      // We can access the query data here to show bold links for
                      // ones that are cached
                      queryClient.getQueryData(['post', post.id])
                        ? {
                            fontWeight: 'bold',
                            color: 'green'
                          }
                        : {}
                    }>
                    {post.title}
                  </a>
                </p>
              ))}
            </div>
            <div>{isFetching ? 'Background Updating...' : ' '}</div>
          </>
        )}
      </div>
    </div>
  );
}

const getPostById = async (id: number) => {
  const { data } = await zodaxios.get(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
    { schema: PostSchema }
  );
  return data;
};

function usePost(postId: number) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId
  });
}

function Post({
  postId,
  setPostId
}: {
  postId: number;
  setPostId: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { status, data, error, isFetching } = usePost(postId);

  return (
    <div>
      <div>
        <a onClick={() => setPostId(-1)} href="#">
          Back
        </a>
      </div>
      {!postId || status === 'loading' ? (
        'Loading...'
      ) : error instanceof Error ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <h1>{data?.title}</h1>
          <div>
            <p>{data?.body}</p>
          </div>
          <div>{isFetching ? 'Background Updating...' : ' '}</div>
        </>
      )}
    </div>
  );
}

function App() {
  const [postId, setPostId] = React.useState(-1);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}>
      <p>
        As you visit the posts below, you will notice them in a loading state
        the first time you load them. However, after you return to this list and
        click on any posts you have already visited again, you will see them
        load instantly and background refresh right before your eyes!{' '}
        <strong>
          (You may need to throttle your network speed to simulate longer
          loading sequences)
        </strong>
      </p>
      {postId > -1 ? (
        <Post postId={postId} setPostId={setPostId} />
      ) : (
        <Posts setPostId={setPostId} />
      )}
      <ReactQueryDevtools initialIsOpen />
    </PersistQueryClientProvider>
  );
}

const rootElement = document.getElementById('root') as HTMLElement;
ReactDOM.createRoot(rootElement).render(<App />);
