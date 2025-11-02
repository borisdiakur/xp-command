# 🛩 xp-command

**Quick cockpit commands for X-Plane 12** - set your radios, altimeter, autopilot, and more from the terminal while flying.

---

## 🎯 What does this tool do?

During instrument flight in X-Plane 12, constantly clicking tiny cockpit buttons to adjust altimeter, transponder, or radio frequencies can be tricky without the appropriate hardware. This tool lets you type quick commands like `q1013` or `x7000` to instantly set instruments without touching the mouse.

**Example commands:**
- `q1013` → Set altimeter to 1013 hPa
- `x7000` → Set transponder to 7000
- `a250` → Set autopilot altitude to FL250
- `c1118900` → Set COM1 to 118.900 MHz

The tool remembers your command history and automatically creates aircraft-specific profiles which can then be adjusted to your specific needs.

---

## 🚀 Installation

### Step 1: Install Node.js

You need Node.js version 22 or higher installed on your system:

1. **Download Node.js**: Go to https://nodejs.org/en/download/ and download the **LTS version** (Long Term Support)
2. **Install**: Run the downloaded installer
3. **Verify**: Open Terminal and type:
   ```bash
   node --version
   ```
   You should see something like `v22.x.x`

### Step 2: Install xp-command globally

Open Terminal and run:

```bash
npm install -g xp-command
```

This installs xp-command globally so you can run it from anywhere.

---

## 🛠 X-Plane setup

You shouldn't need to perform any extra setup steps in X-Plane. There is no plugin that needs to be installed. If you still want to check if the Web API (which allows xp-command to communicate with X-Plane) is configured correctly, here is how you can do it:

1. In X-Plane 12, go to **Settings → Data Output**
2. Find **"Enable Web Server API"** and make sure it's enabled
3. Note the **port number** (default is `8086`)

---

## 🎮 Usage

### Starting the tool

1. **Load into an aircraft** in X-Plane 12
2. **Open Terminal** on your machine
3. **Run**:
   ```bash
   xp-command
   ```

You'll see a prompt:
```
🛩 █
```

Now you can enter commands!

### Using a custom port

If you changed the Web API port from 8086 to another port, you'll need to start xp-command accordingly:

```bash
xp-command --port 8090
```

### Exiting

Type `exit` or press `Ctrl+C`

---

## 📋 Pre-configured commands

All pre-configured commands work well with most aircraft I currently fly, but you may want to adjust them for **your** aircraft (see _Aircraft-specific profiles_ section below).

### Barometric pressure

| Command | Action                                  | Example      |
|---------|-----------------------------------------|--------------|
| `q`     | Get QNH in hPa/mb (copied to clipboard) | `q` → `1013` |
| `l`     | Get QNH in inHg (copied to clipboard)   | `l` → `2992` |
| `q####` | Set QNH in hPa/mb                       | `q1013`      |
| `l####` | Set QNH in inHg                         | `l2992`      |

### Autopilot

| Command  | Action                      | Example                   |
|----------|-----------------------------|---------------------------|
| `h###`   | Set heading                 | `h090` → 090°             |
| `a###`   | Set altitude (flight level) | `a250` → FL250 (25000 ft) |
| `a#####` | Set altitude (exact feet)   | `a03500` → 3500 ft        |
| `s###`   | Set speed in KIAS           | `s180` → 180 knots        |
| `s##`    | Set speed in Mach           | `s78` → Mach 0.78         |
| `v####`  | Set vertical speed          | `v1500` → 1500 ft/min     |

### Radios

| Command    | Action           | Format     | Example               |
|------------|------------------|------------|-----------------------|
| `c1#####`  | Set COM1 active  | No decimal | `c1118900` → 118.900  |
| `cs1#####` | Set COM1 standby | No decimal | `cs1121750` → 121.750 |
| `c2#####`  | Set COM2 active  | No decimal | `c2119200` → 119.200  |
| `cs2#####` | Set COM2 standby | No decimal | `cs2122800` → 122.800 |
| `n1#####`  | Set NAV1 active  | No decimal | `n1110500` → 110.500  |
| `ns1#####` | Set NAV1 standby | No decimal | `ns1116600` → 116.600 |
| `n2#####`  | Set NAV2 active  | No decimal | `n2113900` → 113.900  |
| `ns2#####` | Set NAV2 standby | No decimal | `ns2115700` → 115.700 |

**Radio frequency format:** Remove the decimal point. For `118.900`, type `118900`. For COM1 and COM2 you can omit the last digit – the value will be padded with 0.

### Transponder

| Command | Action          | Example |
|---------|-----------------|---------|
| `x####` | Set squawk code | `x7000` |

---

## ⚙️ Aircraft-specific profiles

The first time you run xp-command in a new aircraft, it automatically creates a configuration file at:

```
~/.xp-command/<Aircraft Name>.yml
```

### Customizing commands

You can edit these YAML files to add aircraft-specific commands or modify existing ones. Note that for changes to take effect you'll need to restart xp-command.

**Example**: Add a command to set heading with 10-degree increments:

```yaml
- pattern: "^hdg(\\d{2})$"  
  type: set
  dataref: sim/cockpit/autopilot/heading_mag
  transform:
    - mult10
```

**Key components:**
- `pattern`: Regular expression matching your command (`hdg18`)
- `type`: Either `get` (read value) or `set` (write value)
- `dataref`: X-Plane dataref path (find these in X-Plane's DataRef Editor)
- `transform`: Optional value conversions (multiply, divide, round, etc.)

**Finding datarefs**: Use [the DataRefTool plugin](https://datareftool.com) or check [X-Plane datarefs documentation](https://developer.x-plane.com/datarefs/).

#### Array Datarefs

Many X-Plane datarefs are arrays (e.g., for multiple engines, generators, radios). You can access specific array elements using `[index]` notation:

```yaml
# Check if right generator is on (index 1 = right, 0 = left)
- pattern: "^gr$"
  type: get
  dataref: sim/cockpit/electrical/generator_on[1]
```

## 🔄 Resetting Aircraft Profiles

If you've edited an aircraft configuration and xp-command crashes or stops working, you can reset to default settings by deleting the config files.

### Profile Location

Aircraft profiles are stored in:

**macOS/Linux:** `~/.xp-command/`  
**Windows:** `%USERPROFILE%\.xp-command\`

Each aircraft has its own `.yml` file named after the aircraft (e.g., `Cessna 172SP.yml`).

### Reset Single Aircraft

To reset one specific aircraft, delete its `.yml` file. Next time you load that aircraft and run a command, xp-command will create a fresh default configuration.

### Reset All Aircraft  

To start completely fresh, delete the entire `.xp-command` folder. This removes all custom aircraft configurations.
The tool will automatically recreate default configurations when you next fly each aircraft and run a command.

---

## 🔧 Troubleshooting

### "No connection - in aircraft?"

**Causes:**
- You're in the X-Plane menu (not loaded into cockpit)
- Web API is disabled in X-Plane settings
- X-Plane is not running
- Wrong port number

**Fix:**
1. Load into aircraft cockpit
2. Check **Settings → Data Output → Enable Web Server API** is checked
3. Verify port matches (default 8086)

### Command not recognized (red text)

**Causes:**
- Typo in command
- Command not defined for this aircraft
- Wrong number of digits

**Fix:**
- Check command format in this README
- Edit `~/.xp-command/<Aircraft>.yml` to add custom commands

### Values not changing in cockpit

**Causes:**
- Wrong dataref for your specific aircraft
- Aircraft systems override (e.g., autopilot off)

**Fix:**
- Check DataRef Editor to verify correct dataref path
- Ensure aircraft systems are in correct mode (e.g., autopilot engaged)

### xp-command crashes after parsing errors
  
**Cause:** Invalid YAML syntax when editing config files  
**Fix:** Create backups of problematic aircraft's `.yml` files and delete them or the entire profiles folder

---

## 🗑️ Uninstalling

### Uninstall npm package

Open Terminal and run:

```bash
npm uninstall -g xp-command
```

### Clean Up Data Files

**Aircraft profiles:**
- macOS/Linux: Delete `~/.xp-command/` folder
- Windows: Delete `%USERPROFILE%\.xp-command\` folder

**Command history:**
- macOS: Delete `~/Library/Preferences/xp-command-nodejs/` folder
- Linux: Delete `~/.config/xp-command-nodejs/` folder  
- Windows: Delete `%APPDATA%\xp-command-nodejs\` folder

**Complete removal:** Delete both the tool and all data files to fully uninstall xp-command from your system.

---

## 💡 How it works (technical overview)

1. **Web API connection**: Uses [X-Plane local REST Web API](https://developer.x-plane.com/article/x-plane-web-api/) 
2. **Dataref system**: Reads/writes X-Plane datarefs (internal simulator variables)
3. **Pattern matching**: Regular expressions match your commands to datarefs
4. **Transform pipeline**: Converts your input format to X-Plane's expected values
5. **Aircraft profiles**: YAML configs loaded based on current aircraft name
6. **Persistent history**: Stored using the [`conf`](https://github.com/sindresorhus/conf) package

---

## 📝 License

MIT License - See repository for details

---

## 🙏 Credits

This project was inspired by http://www.xpluginsdk.org/command_line.htm which unfortunately stopped working for me after upgrading to X-Plane 12.

---

## 🐛 Issues and contributions

Found a bug or want to add features? Submit issues or pull requests on the [GitHub repository](https://github.com/borisdiakur/xp-command).

---

**👋🏻 Happy flying!**