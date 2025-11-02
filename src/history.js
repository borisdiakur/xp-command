import Conf from "conf";

class CliHistory {
  /** @type {Conf} */
  config;

  /** @type {number} */
  index;

  constructor() {
    this.config = new Conf({
      projectName: "xp-command",
    });

    this.index = this.getHistory().length - 1;
  }

  /**
   * @param {string} command
   * @returns {void}
   */
  addCommand(command) {
    const history = this.getHistory();

    const filtered = history.filter((cmd) => cmd !== command);
    filtered.push(command);
    const trimmed = filtered.slice(-100);

    this.config.set("history", trimmed);
    this.index = trimmed.length - 1;
  }

  getHistory() {
    return /** @type {Array<string>} */ (this.config.get("history") ?? []);
  }

  clear() {
    this.config.set("history", []);
    this.index = 0;
  }

  up() {
    this.index = Math.max(0, this.index - 1);
    return this.getHistory()[this.index + 1] ?? "";
  }

  down() {
    this.index = Math.min(this.getHistory().length - 1, this.index + 1);
    return this.getHistory()[this.index + 1] ?? "";
  }
}

export default new CliHistory();
