import { MeiliSearch } from 'meilisearch'

export const useMeilisearch = () => {
  const config = useRuntimeConfig()

  const client = new MeiliSearch({
    host: config.public.meilisearch.hostURL,
    apiKey: config.public.meilisearch.searchApiKey,
  })

  return client
}