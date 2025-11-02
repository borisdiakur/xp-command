/**
 * @param {number} ms
 */
export const sleep = async (ms) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
