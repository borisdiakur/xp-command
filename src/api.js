/** @type {number} */
let port;

/**
 * @typedef {{
 *   error_code: string
 *   error_message: string
 * }} APIError
 */

/**
 * @typedef {{
 *   port: number
 * }} APIOptions
 */

class CustomError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * @param {string} datarefString
 * @return {[string, number|null]}
 */
const parseDataref = (datarefString) => {
  // Regex pattern: captures base name and optional array index
  const pattern = /^(.+?)(?:\[(\d+)\])?$/;
  const match = datarefString.match(pattern);

  if (!match) {
    throw new CustomError("invalid_dataref");
  }

  return [match[1], match[2] ? parseInt(match[2]) : null];
};

/**
 * @param {string} datarefName
 * @return { Promise<number | null> }
 */
const getDatarefId = async (datarefName) => {
  const url = new URL(`http://localhost:${port}/api/v2/datarefs`);
  url.searchParams.set("filter[name]", datarefName);
  url.searchParams.set("fields", "id");

  const response = await fetch(url);
  const json = /** @type { {data:[{id: number }]} | APIError } */ (
    await response.json()
  );

  if ("error_code" in json) {
    throw new CustomError(json.error_code);
  }

  return json.data[0]?.id ?? null;
};

/**
 * @param {APIOptions} options
 */
export const initAPI = (options) => {
  port = options.port;
};

/**
 * @param {string} datarefNameWithOptionalIndex
 * @return {Promise<number|Array<number>|string>}
 */
export const getDatarefValue = async (datarefNameWithOptionalIndex) => {
  const [datarefName, index] = parseDataref(datarefNameWithOptionalIndex);

  const datarefId = await getDatarefId(datarefName);

  const url = new URL(
    `http://localhost:${port}/api/v2/datarefs/${datarefId}/value`,
  );
  if (typeof index === "number") {
    url.searchParams.set("index", String(index));
  }

  const response = await fetch(url);
  const json =
    /** @type { {data: number|Array<number>|string } | APIError } */ (
      await response.json()
    );

  if ("error_code" in json) {
    throw new CustomError(json.error_code);
  }

  if (typeof json.data === "string") {
    const decoded = Buffer.from(json.data, "base64")
      .toString("utf-8")
      .replaceAll("\x00", "")
      .trim();
    return decoded;
  }

  if (Array.isArray(json.data) && json.data.length === 1) {
    return JSON.stringify(json.data[0]);
  }

  return JSON.stringify(json.data);
};

/**
 * @param {string} datarefNameWithOptionalIndex
 * @param {number|string} value
 */
export const setDatarefValue = async (datarefNameWithOptionalIndex, value) => {
  const [datarefName, index] = parseDataref(datarefNameWithOptionalIndex);

  const datarefId = await getDatarefId(datarefName);

  const url = new URL(
    `http://localhost:${port}/api/v2/datarefs/${datarefId}/value`,
  );
  if (typeof index === "number") {
    url.searchParams.set("index", String(index));
  }

  const response = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify({ data: value }),
  });
  const json = /** @type { {data: number|string } | APIError } */ (
    await response.json()
  );

  if (json && "error_code" in json) {
    throw new CustomError(json.error_code);
  }

  return json;
};
