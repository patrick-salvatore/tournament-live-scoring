import zod from "zod";

import { get, set } from "./utils";

const setCustomValidity = (ref: any, fieldPath: any, errors: any) => {
  if (ref && "reportValidity" in ref) {
    const error = get(errors, fieldPath) as any;
    ref.setCustomValidity((error && error.message) || "");
    ref.reportValidity();
  }
};

function parseIssues(zodErrors: zod.ZodIssue[]) {
  const errors = {} as any;

  for (; zodErrors.length; ) {
    const error = zodErrors[0];
    const { code, message, path } = error;
    const _path = path.join(".");

    if (!errors[_path]) {
      if ("unionErrors" in error) {
        const unionError = error.unionErrors[0].errors[0];

        errors[_path] = {
          message: unionError.message,
          type: unionError.code,
        };
      } else {
        errors[_path] = { message, type: code };
      }
    }

    if ("unionErrors" in error) {
      error.unionErrors.forEach((unionError) =>
        unionError.errors.forEach((e) => zodErrors.push(e))
      );
    }

    zodErrors.shift();
  }

  return errors;
}

const nestErrors = (errors: any) => {
  const fieldErrors = {};
  for (const path in errors) {
    // const field = get(options.fields, path);

    set(fieldErrors, path, errors[path]);
  }
  return fieldErrors;
};

export async function resolver(schema: any, values: any) {
  try {
    const data = await schema.parse(values);

    return {
      errors: {},
      values: Object.assign({}, values),
    };
  } catch (error: any) {
    throw {
      values: {},
      errors: nestErrors(parseIssues(error.errors)),
    };
  }
}
