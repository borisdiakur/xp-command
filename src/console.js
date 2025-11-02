export const clearLine = (dy = -1) => {
  process.stdout.moveCursor(0, dy);
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
};

export const hideCursor = () => {
  process.stdout.write("\x1B[?25l");
};
export const showCursor = () => {
  process.stdout.write("\x1B[?25h");
};
