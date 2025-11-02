import { exec } from "child_process";

/**
 * @param {string|number} text
 */
export const copyToClipboard = async (text) => {
  const command =
    process.platform === "win32"
      ? `echo ${text} | clip`
      : process.platform === "darwin"
        ? `echo "${text}" | pbcopy`
        : `echo "${text}" | xclip -selection clipboard`;

  await new Promise((resolve) => {
    exec(command, () => {
      resolve();
    });
  });
};
