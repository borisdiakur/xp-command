#!/usr/bin/env node

import {
  createPrompt,
  isDownKey,
  isEnterKey,
  isUpKey,
  useKeypress,
  useState,
} from "@inquirer/core";
import chalk from "chalk";
import { program } from "commander";
import ora from "ora";
import { homedir } from "os";
import { join } from "path";

import packageJson from "../package.json" with { type: "json" };
import {
  activateCommands,
  getDatarefValues,
  initAPI,
  setDatarefValues,
} from "../src/api.js";
import { copyToClipboard } from "../src/clipboard.js";
import { editConfig, getConfig } from "../src/config.js";
import { clearLine, hideCursor, showCursor } from "../src/console.js";
import { isAPIError, isConfigError, isEconnRefused } from "../src/error.js";
import history from "../src/history.js";
import { Logger } from "../src/logger.js";
import { sleep } from "../src/sleep.js";

const osHomedir = homedir();
const logger = new Logger(join(osHomedir, ".xp-command", "log.txt"), {
  clearOnStart: true,
});

const PREFIX = "🛩 ";

program
  .version(packageJson.version)
  .description(`${PREFIX} ${packageJson.name}\n${packageJson.description}`)
  .option("-p, --port <number>", "server port number")
  .option("-r, --run <command>", "run a single command and exit")
  .helpOption("-h, --help", "display this help text");

/**
 * @param {string} command
 * @returns {Promise<boolean>} true if command succeeded, false otherwise
 */
const processCommand = async (command) => {
  const spinner = ora(`${PREFIX} ${chalk.cyan(command ?? "")}`).start();
  hideCursor();

  /** @type {import('../src/config.js').CommandConfig} */
  let config;
  try {
    config = await getConfig();
  } catch (error) {
    logger.error(error);
    if (isEconnRefused(error) || isAPIError(error)) {
      spinner.fail(chalk.red(`${PREFIX} No connection - in aircraft?`));
      hideCursor();
      await sleep(1500);
      showCursor();
      return false;
    }
    if (isConfigError(error)) {
      spinner.fail(
        chalk.red(
          `${PREFIX} Config error${typeof error.reason === "string" ? " - " + error.reason : ""}`,
        ),
      );
      hideCursor();
      await sleep(1500);
      showCursor();
      return false;
    }
  }

  if (command?.toLowerCase() === "config") {
    await editConfig();
    spinner.succeed(chalk.green(`${PREFIX} config`));
    hideCursor();
    await sleep(1500);
    clearLine();
    return true;
  }

  /**
   * @param {number|string|Array<number|string>} value
   * @param {import('../src/config.js').Transform} transform
   * @return {number|string|Array<number|string>}
   */
  const getTransformedValue = (value, transform) => {
    if (Array.isArray(value)) return value.slice();

    if (transform.startsWith("mult")) {
      const factor = parseFloat(transform.slice(4));
      if (isNaN(factor)) return value;
      return Number(value) * factor;
    }

    if (transform.toLowerCase().startsWith("tofixed")) {
      const digits = parseInt(transform.slice(7));
      if (isNaN(digits)) return value;
      return Number(Number(value).toFixed(digits));
    }

    if (transform === "round") {
      return Math.round(Number(value));
    }

    return value;
  };

  /** @type {Array<[RegExp, (regExpResult: Array<string> | null) => Promise<boolean>]>} */
  const matches = config.commands.map((c) => {
    if (!c.type) {
      return [
        new RegExp(c.pattern),
        async () => {
          spinner.fail(
            chalk.red(`${PREFIX} Missing type (must be get or set)!`),
          );
          hideCursor();
          await sleep(1500);
          clearLine();
          return false;
        },
      ];
    }

    switch (c.type) {
      case "get":
        return [
          new RegExp(c.pattern),
          async () => {
            if (!c.dataref) {
              spinner.fail(chalk.red(`${PREFIX} Missing dataref!`));
              hideCursor();
              await sleep(1500);
              clearLine();
              return false;
            }

            /** @type {number|string|Array<number|string>}*/
            let value = await getDatarefValues(c.dataref);
            c.transform?.forEach((t) => {
              value = getTransformedValue(value, t);
            });
            const asString = String(value);
            await copyToClipboard(asString);
            const lines = asString.split("\n");
            const firstLine = lines[0];
            spinner.succeed(
              chalk.green(
                `${PREFIX} ${lines.length > 1 ? firstLine + "..." : firstLine}`,
              ),
            );
            hideCursor();
            await sleep(1500);
            clearLine();
            return true;
          },
        ];
      case "set":
        return [
          new RegExp(c.pattern),
          async (regExpResult) => {
            if (!c.command && !c.dataref) {
              spinner.fail(
                chalk.red(`${PREFIX} Neither dataref nor command provided!`),
              );
              hideCursor();
              await sleep(1500);
              clearLine();
              return false;
            }

            if (c.command) {
              let value = String(regExpResult[1]);
              if (isNaN(Number(value))) {
                await activateCommands(c.command);
              } else {
                c.transform?.forEach((t) => {
                  value = String(getTransformedValue(value, t));
                });
                await activateCommands(c.command, Number(value));
              }
            }
            if (c.dataref) {
              let value = String(regExpResult[1]);
              if (isNaN(Number(value))) {
                const base64 = Buffer.from(value, "utf-8").toString("base64");
                await setDatarefValues(c.dataref, base64);
              } else {
                c.transform?.forEach((t) => {
                  value = String(getTransformedValue(value, t));
                });
                await setDatarefValues(c.dataref, Number(value));
              }
            }
            spinner.succeed(chalk.green(`${PREFIX} ${command}`));
            hideCursor();
            await sleep(1500);
            clearLine();
            return true;
          },
        ];
    }
  });

  for (const [regexp, cb] of matches) {
    const regexpResult = regexp.exec(command);
    if (regexpResult !== null) {
      try {
        const success = await cb(regexpResult);

        if (success) {
          spinner.succeed();
        }
        hideCursor();

        showCursor();
        return success;
      } catch (error) {
        logger.error(error);
        spinner.fail();
        hideCursor();

        if (error instanceof Error) {
          if (isEconnRefused(error)) {
            clearLine();
            spinner.fail(chalk.red(`${PREFIX} No connection - in aircraft?`));
            await sleep(1500);
          } else if (error.name === "APIError") {
            clearLine();
            spinner.fail(chalk.red(`${PREFIX} ${error.message}`));
            await sleep(1500);
          } else {
            throw error;
          }
        } else {
          throw error;
        }

        await sleep(500);
        showCursor();
        return false;
      }
    }
  }

  spinner.fail(chalk.red(`${PREFIX} ${command ?? ""}`));
  hideCursor();

  await sleep(1500);
  showCursor();
  return false;
};

const sayHello = () => {
  console.log(chalk.magenta("  👋 Hello!"));
};
const sayBye = () => {
  console.log(chalk.magenta("  👋 Bye!"));
};

const askForCommand = async () => {
  clearLine();

  const prompt = createPrompt((config, done) => {
    const [value, setValue] = useState();
    const [, setStatus] = useState("idle");

    useKeypress((key, readline) => {
      if (isEnterKey(key)) {
        setStatus("done");
        history.addCommand(value);
        done(value);
      } else if (isUpKey(key)) {
        const v = history.up();
        setValue(v);
        readline.line = v;
      } else if (isDownKey(key)) {
        const v = history.down();
        setValue(v);
        readline.line = v;
      } else {
        setValue(readline.line);
      }
    });

    return `${config[0].theme.prefix} ${config[0].message ?? ""} ${value ?? ""}`;
  });

  const command = await prompt(
    [
      {
        type: "input",
        name: "command",
        message: "",
        theme: {
          prefix: "  🛩",
        },
      },
    ],
    { clearPromptOnDone: true },
  );

  if (command?.toLowerCase() === "exit") {
    sayBye();
    return;
  }

  await processCommand(command);

  await askForCommand();
};

program.action(
  async (
    /** @type {{ port: number | undefined, run: string | undefined }} */ options,
  ) => {
    initAPI({ port: options.port ?? 8086 });

    if (options.run) {
      history.addCommand(options.run);
      const success = await processCommand(options.run);
      process.exit(success ? 0 : 1);
    }

    hideCursor();
    clearLine();
    sayHello();
    await sleep(1000);
    showCursor();

    await askForCommand();
  },
);

program.parse(process.argv);

process.on("uncaughtException", (error) => {
  if (error instanceof Error) {
    if (error.name === "ExitPromptError") {
      clearLine();
      sayBye();
      return;
    }
  }
  throw error;
});
