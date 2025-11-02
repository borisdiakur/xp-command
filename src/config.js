import { copyFile, mkdir, readFile } from "node:fs/promises";

import yaml from "js-yaml";
import { homedir } from "os";
import { dirname } from "path";
import { join } from "path";
import { fileURLToPath } from "url";

import { getDatarefValue } from "./api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @typedef {Object} CommandConfig
 * @property {Command[]} commands - Array of command definitions
 */

/**
 * @typedef {Object} Command
 * @property {RegExp} pattern - Regular expression pattern to match commands
 * @property {'get' | 'set'} type - Operation type
 * @property {string} dataref - X-Plane dataref path
 * @property {Transform[]} transform - Array of transformation operations to apply
 */

/**
 * @typedef {'mult100' | 'round' | 'div100' | 'toFixed2'} Transform
 * Transform operations:
 * - mult100: Multiply by 100
 * - round: Round to nearest integer
 * - div100: Divide by 100
 * - toFixed2: Format to 2 decimal places
 */

const osHomedir = homedir();

/**
 * @return {Promise<CommandConfig>}
 */
export const getConfig = async () => {
  await mkdir(join(osHomedir, ".xp-command"), {
    recursive: true,
  });

  /** @type {string} */
  let aircraft;
  aircraft = /** @type {string} */ (
    await getDatarefValue("sim/aircraft/view/acf_ui_name")
  );
  const aircraftConfigPath = join(osHomedir, ".xp-command", `${aircraft}.yml`);

  let config;
  try {
    const file = await readFile(aircraftConfigPath, "utf8");
    config = yaml.load(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      await copyFile(join(__dirname, "config.yml"), aircraftConfigPath);
    } else {
      throw error;
    }

    const file = await readFile(aircraftConfigPath, "utf8");
    config = yaml.load(file);
  }

  return /** @type {CommandConfig} */ (config);
};
