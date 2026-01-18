import { spawn } from "child_process";

/**
 * @param {string|number} text
 */
export const copyToClipboard = async (text) => {
  const cmd =
    process.platform === "win32"
      ? { cmd: "clip", args: [] }
      : process.platform === "darwin"
        ? { cmd: "pbcopy", args: [] }
        : { cmd: "xclip", args: ["-selection", "clipboard"] };

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd.cmd, cmd.args);
    proc.stdin.write(
      String(text)
        .split("\n")
        .filter((line) => !!line.trim())
        .join("\n"),
    );
    proc.stdin.end();
    proc.on("close", resolve);
    proc.on("error", reject);
  });
};
