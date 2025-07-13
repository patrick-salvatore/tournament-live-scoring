import type { Hole } from "./hole";

export type Course = {
  id: string;
  name: string;
  tees: any[];
  holes: Hole[];
};

export type CourseResponse = {
  id: string;
  meta: { holes?: Hole[]; tees: string[] };
  name: string;
};

export function toCourse(res: CourseResponse): Course {
  return {
    ...res,
    holes: res.meta.holes,
    tees: res.meta.tees,
  };
}
