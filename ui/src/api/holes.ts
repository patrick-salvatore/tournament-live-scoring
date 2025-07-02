import type { UpdateHolePayload } from "~/lib/hole";

import client from "./client";

export async function updateHoleScores(payload: UpdateHolePayload[]) {
  return client.patch<UpdateHolePayload[]>(`/v1/holes`, payload);
}
