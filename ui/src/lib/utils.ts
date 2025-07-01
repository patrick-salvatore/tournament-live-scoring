export function tryCatch<A>(f: () => A): A | string {
  try {
    const value = f();
    return value;
  } catch (reason) {
    return reason instanceof Error ? reason.message : String(reason);
  }
}

export const groupByIdMap = <
  E extends Record<string, any>,
  K extends keyof E = keyof E
>(
  arr: Array<E>,
  idKey: K
): Record<E[K], Array<E>> => {
  const out = {} as Record<E[K], Array<E>>;

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const key = item[idKey];

    if (!out[key]) {
      out[key] = [];
    }

    out[key].push(item);
  }

  return out;
};

export const reduceToByIdMap = <
  E extends Record<string, any>,
  K extends keyof E = keyof E
>(
  arr: Array<E>,
  idKey: K
): Record<E[K], E> =>
  arr.reduce(
    (acc, el) => ({ ...acc, [el[idKey as string]]: el }),
    {} as Record<K, E>
  );

export const mapArrayByIndex = <E extends Record<string, any>>(
  arr: Array<E>
): Record<number, E> =>
  arr.reduce((acc, el, i) => ({ ...acc, [i]: el }), {} as Record<number, E>);

export function calculateHandicapStrokesDetailed(
  playerHandicap: number,
  courseRating: number,
  courseSlope: number,
  awardedHandicapPercent: number,
  coursePar: number
) {
  const courseHandicap = (playerHandicap * courseSlope) / 113;
  const adjustedHandicap = courseHandicap * (awardedHandicapPercent / 100);
  const strokesReceived = Math.round(adjustedHandicap);

  return {
    playerHandicap,
    courseRating,
    courseSlope,
    awardedHandicapPercent,
    coursePar,
    courseHandicap: Math.round(courseHandicap * 10) / 10, // round to 1 decimal
    adjustedHandicap: Math.round(adjustedHandicap * 10) / 10,
    strokesReceived,
  };
}

export const getStrokeHole = ({
  playerHandicap,
  slope,
  awardedHandicap,
  holeHandicap,
}: {
  playerHandicap: number;
  slope: number;
  awardedHandicap: number;
  holeHandicap: number;
}) => {
  const courseHandicap = Math.round(
    ((Math.round(playerHandicap) * slope!) / 113) * awardedHandicap!
  );
  return courseHandicap >= holeHandicap;
};
