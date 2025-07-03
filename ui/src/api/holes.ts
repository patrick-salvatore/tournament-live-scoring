import type { UpdateHolePayload } from "~/lib/hole";

import client from "./client";

export async function updateHoles(payload: UpdateHolePayload[]) {
  return client.put<UpdateHolePayload[]>(`/v1/holes`, payload).then(res => res.data);
}
