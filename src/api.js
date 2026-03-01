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
 * @param {string} commandString
 * @param {number|string} [value]
 * @return {[string, number|null, number|null]}
 */
const parseCommand = (commandString, value) => {
  // Regex pattern: captures base name and optional duration and repeat count values
  const pattern = /^(.+?)(?:\[(\d+)\])?(?:\[(\d+|\$)\])?$/;
  const match = commandString.match(pattern);

  if (!match) {
    throw new CustomError("invalid_command");
  }

  let repeatCount = match[3] ? parseInt(match[3]) : null;
  if (isNaN(repeatCount)) {
    repeatCount = typeof value === "number" ? value : parseInt(value);
  }
  if (isNaN(repeatCount)) {
    repeatCount = 1;
  }

  return [match[1], match[2] ? parseInt(match[2]) : null, repeatCount];
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
 * @param {string} commandName
 * @return {Promise<number|string>}
 */
export const getCommandId = async (commandName) => {
  const url = new URL(`http://localhost:${port}/api/v2/commands`);
  url.searchParams.set("filter[name]", commandName);
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
 * @param {string} commandNameWithOptionalDuration
 * @param {number|string} [value]
 */
export const activateCommand = async (
  commandNameWithOptionalDuration,
  value,
) => {
  const [commandName, duration, repeatCount] = parseCommand(
    commandNameWithOptionalDuration,
    value,
  );

  if (commandName === "sleep") {
    if (duration) {
      await new Promise((resolve) => setTimeout(resolve, duration * 1000));
    }
    return;
  }

  const commandId = await getCommandId(commandName);

  const url = new URL(
    `http://localhost:${port}/api/v2/command/${commandId}/activate`,
  );

  for (let i = Math.max(1, repeatCount ?? 1); i--; ) {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ duration: duration || 0 }),
    });
    const json = /** @type { {data: number|string } | APIError } */ (
      await response.json()
    );

    if (json && "error_code" in json) {
      throw new CustomError(json.error_code);
    }
  }
};

/**
 * @param {string} datarefNameWithOptionalIndex
 * @return {Promise<number|string>}
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
 * @param {string|Array<string>} datarefNamesWithOptionalIndex
 * @return {Promise<number|string>}
 */
export const getDatarefValues = async (datarefNamesWithOptionalIndex) => {
  if (Array.isArray(datarefNamesWithOptionalIndex)) {
    return Promise.all(
      datarefNamesWithOptionalIndex.map((dataref) => getDatarefValue(dataref)),
    ).then((results) => {
      return results
        .map((v) => String(v))
        .join("\n")
        .trim();
    });
  }

  return getDatarefValue(datarefNamesWithOptionalIndex);
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

/**
 * @param {string|Array<string>} datarefNamesWithOptionalIndex
 * @param {number|string} value
 * @return {Promise<void>}
 */
export const setDatarefValues = async (
  datarefNamesWithOptionalIndex,
  value,
) => {
  if (Array.isArray(datarefNamesWithOptionalIndex)) {
    for (const dataref of datarefNamesWithOptionalIndex) {
      await setDatarefValue(dataref, value);
    }
  } else {
    await setDatarefValue(datarefNamesWithOptionalIndex, value);
  }
};

/**
 * @param {string|Array<string>} commandNamesWithOptionalDuration
 * @param {number|string} [value]
 * @return {Promise<void>}
 */
export const activateCommands = async (
  commandNamesWithOptionalDuration,
  value,
) => {
  if (Array.isArray(commandNamesWithOptionalDuration)) {
    for (const command of commandNamesWithOptionalDuration) {
      await activateCommand(command, value);
    }
  } else {
    await activateCommand(commandNamesWithOptionalDuration, value);
  }
};
