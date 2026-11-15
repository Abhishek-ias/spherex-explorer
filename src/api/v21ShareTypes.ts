export type InvestigationShareRequest = {
  ra: string | number
  dec: string | number
  fov_arcmin: number
  detector: string | null
  earlier_epoch: string | null
  later_epoch: string | null
  selected_object_ra: number | null
  selected_object_dec: number | null
  active_view: string
  overlays_enabled: string[]
}

export type InvestigationShareResponse = {
  share_id: string
  share_query_string: string
  created_at: string
  state: unknown
}

type JsonContent<T> = { content: { 'application/json': T } }

export type BackendV21SharePaths = {
  '/api/share': {
    post: {
      requestBody: JsonContent<InvestigationShareRequest>
      responses: { 200: JsonContent<InvestigationShareResponse> }
    }
  }
  '/api/share/{share_id}': {
    get: {
      parameters: { path: { share_id: string } }
      responses: { 200: JsonContent<InvestigationShareResponse> }
    }
  }
}
