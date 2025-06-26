import { getPocketBase } from "./pocketbase";

export const getTournaments = () =>
  getPocketBase().collection("tournaments").getFullList({});
