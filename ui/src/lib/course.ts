import type { Hole } from "./hole";

export type Course = {
  id: string;
  name: string;
  slope: number;
  courseRate: number;
  par: number;
  holeLayout: Hole[];
  created: string;
  updated: string;
};
