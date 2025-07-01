import client from "./client";
import type { Session } from "~/lib/session";

export async function createIdentity() {
  return client.post(`/v1/identity`).then((res) => res.data);
}

export async function getIdentity() {
  return client.get<Session>(`/v1/identity`).then((res) => res.data);
}
