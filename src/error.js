/**
 * @param {unknown} error
 */
export const isEconnRefused = (error) => {
  return Boolean(
    error instanceof Error &&
      error.cause &&
      typeof error.cause === "object" &&
      "code" in error.cause &&
      error.cause.code === "ECONNREFUSED",
  );
};

/**
 * @param {unknown} error
 */
export const isConfigError = (error) => {
  return Boolean(error instanceof Error && error.name === "YAMLException");
};

/**
 * @param {unknown} error
 */
export const isAPIError = (error) => {
  return Boolean(error instanceof Error && error.name === "APIError");
};
