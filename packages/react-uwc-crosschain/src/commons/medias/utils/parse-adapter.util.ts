import get from "lodash.get";

export const parseAdapter = (path: string) => {
  try {
    return get(window, path);
  } catch {
    return;
  }
};
