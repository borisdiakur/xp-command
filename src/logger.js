// logger.js
import fs from "node:fs";
import path from "node:path";

/**
 * @typedef {"debug" | "info" | "warn" | "error"} LogLevel
 */

/**
 * @typedef {Object} LoggerOptions
 * @property {boolean} [clearOnStart]
 */

export class Logger {
  /**
   * @param {string} filePath
   * @param {LoggerOptions} [options]
   */
  constructor(filePath, options = {}) {
    /** @private */
    this.filePath = filePath;

    /** @private */
    this.options = options;

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (options.clearOnStart && fs.existsSync(filePath)) {
      // clear file on app start
      fs.truncateSync(filePath, 0);
    }

    /**
     * @private
     * @type {fs.WriteStream}
     */
    this.stream = fs.createWriteStream(filePath, { flags: "a" });
  }

  /**
   * @private
   * @param {LogLevel} level
   * @param {string} msg
   */
  write(level, msg) {
    const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${msg}\n`;
    this.stream.write(line);
  }

  /**
   * @param {string} msg
   */
  debug(msg) {
    this.write("debug", msg);
  }

  /**
   * @param {string} msg
   */
  info(msg) {
    this.write("info", msg);
  }

  /**
   * @param {string} msg
   */
  warn(msg) {
    this.write("warn", msg);
  }

  /**
   * @param {string} msg
   */
  error(msg) {
    this.write("error", msg);
  }
}
