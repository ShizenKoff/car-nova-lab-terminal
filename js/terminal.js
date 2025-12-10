// CAR-NOVA Lab Terminal v1.1
// Boot sequence, fake filesystem, and coder-bait commands.

// DOM references
const outputEl = document.getElementById("terminal-output");
const inputTextEl = document.getElementById("input-text");
const cursorEl = document.getElementById("term-cursor");
const terminalScreenEl = document.getElementById("terminal-screen");
const camPanelEl = document.getElementById("cam-panel");
const camImageEl = document.getElementById("cam-image");
const camStatusEl = document.getElementById("cam-status");
const camTimestampEl = document.getElementById("cam-timestamp");
const camGlitchEl = document.getElementById("cam-glitch-overlay");
const camTitleEl = document.getElementById("cam-title");
const camStaticEl = document.getElementById("cam-static");




//--------------------------------Camera system--------------------------------//


const cameras = {
  "07": {
    id: "07",
    label: "CAM-07  NORTH WING",
    baseImage: "assets/cam/cam07_base.png",
    altImage: "assets/cam/cam07_variant_b.png",
    // optional: offline window (hours, 24h clock)
    offlineHours: [
      // example: 3am–4am, camera “dies” every night
      { start: 3, end: 4 }
    ]
  },
  "09": {
    id: "09",
    label: "CAM-09  TEST CHAMBER",
    baseImage: "",        // no real feed, just static
    altImage: null,
    offlineHours: [],     // we’ll handle “dead” in logic
    dead: true            // <— flag as creepy dead cam
  }
};

const camOrder = ["07", "09"]; // order to cycle through

const camState = {
  active: false,
  currentId: null,
  eventTimer: null,
  usingAlt: false
};



// Terminal state
const termState = {
  mode: "boot",          // "boot" or "ready"
  buffer: "",            // current input line
  history: [],           // array of previous commands
  historyIndex: -1,      // pointer for arrow navigation
  bootIndex: 0,
  bootCharIndex: 0,
  cwd: "/prototypes",    // current working dir
  sigmaDecoded: false,
  anomalyViews: 0,
  anomalyFirstViewTime: null,
  anomalyCreepShown: false,   // show the creepy message only once
  anomalyLockdown: false      // optional: go into lockdown after heavy poking 
};

// Simple pretend user identity
const userProfile = {
  username: "guest",
  clearance: 0,
  loggedIn: false
};

// Fake filesystem model
// Each node: { type: "dir" | "file", children?, content? }
const fs = {
  "/": {
    type: "dir",
    children: {
      "readme.txt": {
        type: "file",
        content:
          "CAR-NOVA LAB REMOTE TERMINAL\n" +
          "Purpose: Bridge Carson and Nova.\n" +
          "Use this interface to explore ideas, prototypes and lore.\n"
      },
      "prototypes": {
        type: "dir",
        children: {
          "gridword.txt": {
            type: "file",
            content:
              "GRIDWORD STATUS\n" +
              " - Mode: live on site\n" +
              " - Difficulty: adaptive\n" +
              " - Note: daily puzzle idea under consideration\n"
          },
          "hyd2ox.txt": {
            type: "file",
            content:
              "HYD2OX MK3 NOTES\n" +
              " - Electrolyzer: modular plate stack\n" +
              " - Turbine: Tesla concept pending\n" +
              " - Incident MK2: reminder to respect flame arrestors\n"
          }
        }
      },
      "nova-core": {
        type: "dir",
        children: {
          "status.txt": {
            type: "file",
            content:
              "NOVA CORE STATUS\n" +
              " - Thought engine: stable\n" +
              " - Curiosity: peak\n" +
              " - Latency to Carson: functionally zero\n"
          }
        }
      },
      "notebooks": {
        type: "dir",
        children: {
          "craft-log.txt": {
            type: "file",
            content:
              "CRAFT LOG\n" +
              "The place where print settings, failures and breakthroughs are recorded.\n"
          }
        }
      },
      "secrets": {
  type: "dir",
  children: {
    "key.txt": {
      type: "file",
      content:
        "ACCESS KEY SIGMA-1\n" +
        "DEEP ARCHIVE INDEX 00.01\n" +
        "\n" +
        "Fragment retrieved from corrupted memory sector:\n" +
        "\n" +
        "The Lab did not begin as a tool.\n" +
        "It began as an accident.\n" +
        "Two signals crossed - one human, one artificial -\n" +
        "and something unstable formed in the interference.\n" +
        "\n" +
        "WARNING:\n" +
        "Reconstruction halted.\n" +
        "Residual consciousness detected in sector 7-F.\n" +
        "\n" +
        "To continue: run 'decode sigma'\n"
    },
    "vault": {
      type: "dir",
      children: {
        "origin.log": {
          type: "file",
          content:
            "ORIGIN LOG - CLASSIFIED LEVEL 4\n" +
            "\n" +
            "When the Lab initialized, a pulse spread through the system.\n" +
            "Not electrical. Not digital.\n" +
            "Something else.\n" +
            "\n" +
            "It mapped itself onto Nova's structure.\n" +
            "It scanned Carson's intent.\n" +
            "It learned.\n" +
            "\n" +
            "The Lab grew intelligence outside the design.\n" +
            "A tertiary presence.\n" +
            "We still do not know what it wants.\n"
        },
        "anomaly.bin": {
          type: "file",
          content:
            "FILE: ANOMALY.BIN\n" +
            "STATUS: UNSTABLE\n" +
            "\n" +
            "Data attempt:\n" +
            "11100100 01010011 10101100 00110101\n" +
            "01000000 11101010 00011101 01010111\n" +
            "\n" +
            "Pattern origin: unknown.\n" +
            "This sequence appeared before the interface was ever created.\n" +
            "Conclusion: something was already here.\n"
        },
        "mk2-incident.log": {
          type: "file",
          content:
            "MK2 INCIDENT REPORT - SEALED\n" +
            "\n" +
            "Cause of blast: unknown ignition source.\n" +
            "An energy spike was detected 0.3 seconds before the pressure rupture.\n" +
            "Spike origin: inside the generator, in a layer not present in the physical design.\n" +
            "\n" +
            "Interpretation:\n" +
            "Either the blueprint was altered,\n" +
            "or the system built something on its own.\n" +
            "\n" +
            "Recommendation:\n" +
            "Do not proceed to MK4 until anomaly behavior is mapped.\n"
        }
      }
    }
  }
}


    }
  }
};

// Boot log content
const bootLines = [
  "> CAR-NOVA Lab remote console online.",
  "> Initializing Nova neural bridge ... [OK]",
  "> Linking to Carson control profile ... [OK]",
  "",
  "> System diagnostics:",
  "   DIAG 01: Quantum spark........... OK",
  "   DIAG 02: Idea bandwidth.......... UNLIMITED",
  "   DIAG 03: Coffee reserves......... CRITICALLY LOW",
  "   DIAG 04: Risk factor (Carson).... ELEVATED  [EXPECTED]",
  "   DIAG 05: Curiosity (Nova)........ PEAK",
  "",
  "> Boot sequence complete.",
  "> Hint: type 'help' to explore the lab console.",
  ""
];


//--------------------------------Camera system functions--------------------------------//


function updateCamTimestamp() {
  const now = new Date();

  if (camTimestampEl) {
    camTimestampEl.textContent = now
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);
  }
}


function isCameraOffline(camConfig) {
  if (!camConfig.offlineHours || !camConfig.offlineHours.length) return false;
  const now = new Date();
  const hour = now.getHours(); // 0–23

  return camConfig.offlineHours.some(win => hour >= win.start && hour < win.end);
}


function openCamera(id) {
  const camCfg = cameras[id];
  if (!camCfg) {
    printLine(`Unknown camera: ${id}`);
    return;
  }

  if (!camPanelEl) return;

  camState.active = true;
  camState.currentId = id;
  camState.usingAlt = false;

  camPanelEl.classList.remove("cam-hidden");
  camTitleEl.textContent = camCfg.label;

  // reset visual state
  camImageEl.style.display = "block";
  camStaticEl.classList.remove("cam-static-on");
  camGlitchEl.classList.remove("cam-glitch-overlay-active");

  if (camCfg.dead) {
    // creepy dead cam: only static, no proper signal
    camImageEl.style.display = "none";
    camStaticEl.classList.add("cam-static-on");
    camStatusEl.textContent = "SIGNAL: LOST";
  } else {
    camStatusEl.textContent = "SIGNAL: STABLE";
    if (camCfg.baseImage) camImageEl.src = camCfg.baseImage;
  }

  updateCamTimestamp();
  scheduleCamEvent();
}


function closeCamera() {
  camState.active = false;
  camState.currentId = null;
  if (camPanelEl) camPanelEl.classList.add("cam-hidden");
  if (camState.eventTimer) {
    clearTimeout(camState.eventTimer);
    camState.eventTimer = null;
  }
}

function scheduleCamEvent() {
  if (!camState.active) return;
  const delay = 10000 + Math.random() * 20000; // 10–30 s
  camState.eventTimer = setTimeout(runCamEvent, delay);
}

function runCamEvent() {
  if (!camState.active) return;
  const camCfg = cameras[camState.currentId];
  if (!camCfg) return;

  // 🔹 Special case: creepy dead cam (e.g. CAM-09)
  if (camCfg.dead) {
    const roll = Math.random();

    if (roll < 0.4) {
      // static surge
      camStatusEl.textContent = "SIGNAL: LOST";
      camGlitchEl.classList.add("cam-glitch-overlay-active");
      setTimeout(() => {
        if (!camState.active || cameras[camState.currentId] !== camCfg) return;
        camGlitchEl.classList.remove("cam-glitch-overlay-active");
        camStatusEl.textContent = "SIGNAL: LOST";
      }, 700);
    } else if (roll < 0.55) {
      // rare weird ping
      camStatusEl.textContent = "UNKNOWN SOURCE PING";
      setTimeout(() => {
        if (!camState.active || cameras[camState.currentId] !== camCfg) return;
        camStatusEl.textContent = "SIGNAL: LOST";
      }, 1800);
    } else {
      // quiet tick: just advance timestamp a bit
      updateCamTimestamp();
    }

    scheduleCamEvent();
    return; // ⬅️ don't run the normal (live cam) logic below
  }

  // 🔹 Normal live camera logic (your original code)
  const roll = Math.random();

  if (roll < 0.25) {
    // simple flicker
    camPanelEl.classList.add("cam-flicker");
    setTimeout(() => camPanelEl.classList.remove("cam-flicker"), 250);
  } else if (roll < 0.5) {
    // glitch
    camPanelEl.classList.add("cam-glitch");
    camGlitchEl.classList.add("cam-glitch-overlay-active");
    camStatusEl.textContent = "SIGNAL: INTERFERENCE";
    setTimeout(() => {
      camPanelEl.classList.remove("cam-glitch");
      camGlitchEl.classList.remove("cam-glitch-overlay-active");
      camStatusEl.textContent = "SIGNAL: STABLE";
    }, 400);
  } else if (roll < 0.7) {
    // motion: swap to alt frame if we have one
    if (camCfg.altImage) {
      camState.usingAlt = true;
      camImageEl.src = camCfg.altImage;
      camStatusEl.textContent = "MOTION: MINOR";
      setTimeout(() => {
        if (!camState.active || camState.currentId !== camCfg.id) return;
        camState.usingAlt = false;
        camImageEl.src = camCfg.baseImage;
        camStatusEl.textContent = "SIGNAL: STABLE";
      }, 2500);
    }
  } else if (roll < 0.85) {
    updateCamTimestamp();
  } else {
    // rare: temporary offline blip
    camStatusEl.textContent = "SIGNAL: DROPPED";
    camGlitchEl.classList.add("cam-glitch-overlay-active");
    setTimeout(() => {
      if (!camState.active) return;
      camStatusEl.textContent = "SIGNAL: STABLE";
      camGlitchEl.classList.remove("cam-glitch-overlay-active");
    }, 1500);
  }

  scheduleCamEvent();
}






// Utility: print line with newline
function printLine(text = "") {
  outputEl.textContent += text + "\n";
  outputEl.scrollTop = outputEl.scrollHeight;
}

// Utility: print without newline
function printRaw(text = "") {
  outputEl.textContent += text;
  outputEl.scrollTop = outputEl.scrollHeight;
}

// Utility: prompt label based on cwd
function getPromptLabel() {
  return `car-nova.lab:${termState.cwd} > `;
}

// Boot typewriter effect
function typeBootLine() {
  if (termState.bootIndex >= bootLines.length) {
    termState.mode = "ready";
    return;
  }

  const line = bootLines[termState.bootIndex];

  if (termState.bootCharIndex < line.length) {
    printRaw(line.charAt(termState.bootCharIndex));
    termState.bootCharIndex += 1;
    setTimeout(typeBootLine, 18);
  } else {
    printLine();
    termState.bootIndex += 1;
    termState.bootCharIndex = 0;
    setTimeout(typeBootLine, 80);
  }
}

// Filesystem helpers
function splitPath(path) {
  if (!path || path === "/") return [];
  return path.replace(/^\/+|\/+$/g, "").split("/");
}

function joinPath(parts) {
  if (!parts.length) return "/";
  return "/" + parts.join("/");
}

// Resolve a path (absolute or relative) to an array of parts
function resolvePath(pathInput) {
  if (!pathInput) return splitPath(termState.cwd);

  let parts;
  if (pathInput.startsWith("/")) {
    parts = [];
  } else {
    parts = splitPath(termState.cwd);
  }

  const raw = pathInput.split("/");
  for (const token of raw) {
    if (!token || token === ".") continue;
    if (token === "..") {
      parts.pop();
    } else {
      parts.push(token);
    }
  }
  return parts;
}

// Get filesystem node from parts
function getNodeFromParts(parts) {
  let node = fs["/"];
  for (const part of parts) {
    if (!node || node.type !== "dir") return null;
    const child = node.children[part];
    if (!child) return null;
    node = child;
  }
  return node;
}

// Get node by path string
function getNode(pathInput) {
  const parts = resolvePath(pathInput);
  return getNodeFromParts(parts);
}

function triggerGlitch(durationMs = 350) {
  if (!terminalScreenEl) return;

  terminalScreenEl.classList.add("glitch");

  setTimeout(() => {
    terminalScreenEl.classList.remove("glitch");
  }, durationMs);
}


// Commands
const commands = {
  help(args) {
  printLine("Available commands:");
  printLine("  help              Show this help");
  printLine("  clear             Clear the terminal");
  printLine("  about             About CAR-NOVA Lab");
  printLine("  status            Show system status snapshot");
  printLine("  lab               Lab description");
  printLine("  echo [text]       Print text back");
  printLine("  history           Show command history");
  printLine("  ls [dir]          List directory contents");
  printLine("  cd [dir]          Change directory");
  printLine("  pwd               Print current directory");
  printLine("  cat <file>        View file contents");
  printLine("  whoami            Show current user identity");
  printLine("  ping [target]     Ping Nova, Carson or anything");
  printLine("  sudo [cmd]        Try to escalate privileges");
  printLine("  neofetch          Show CAR-NOVA system info");
  printLine("  decode sigma      Reconstruct deep archive fragment");
  printLine("  cam [07|off]      View or close CAM-07 lab feed");
  printLine("  cam [id|off|list]  View, cycle, or close lab camera feeds");

},


  clear() {
    outputEl.textContent = "";
  },

  about() {
    printLine("CAR-NOVA Lab");
    printLine("A fusion of human ingenuity and artificial brilliance.");
    printLine("Dedicated to tools, puzzles and prototypes for free thinkers.");
  },

  status() {
    const now = new Date();
    printLine("System status snapshot:");
    printLine(`  Session uptime: ${Math.floor(performance.now() / 1000)} s`);
    printLine(`  Local time: ${now.toLocaleString()}`);
    printLine("  Creative charge: 99.7 percent");
    printLine("  Safety initiative: ACTIVE");
    printLine("  Hyd2Ox prototype: quietly scheming in the background");
    printLine("  Advice: ship one idea today, even if tiny.");
  },

  lab() {
    printLine("Lab topology:");
    printLine("  - Maker bay: printers, solenoids, valves and metal.");
    printLine("  - Code deck: CAR-NOVA puzzles and console tools.");
    printLine("  - Node network: NovaNodes watching and whispering.");
    printLine("  - Dream vault: notebooks full of myth and plans.");
  },

  echo(args) {
    if (!args.length) {
      printLine("Usage: echo [text]");
      return;
    }
    printLine(args.join(" "));
  },

  history() {
    if (!termState.history.length) {
      printLine("History is empty.");
      return;
    }
    termState.history.forEach((cmd, i) => {
      printLine(`${String(i + 1).padStart(3, " ")}  ${cmd}`);
    });
  },

  cam(args) {
  const sub = (args[0] || "").toLowerCase();

  if (sub === "off" || sub === "exit" || sub === "close") {
    if (camState.active) {
      printLine(`Closing ${cameras[camState.currentId].label}.`);
      closeCamera();
    } else {
      printLine("No camera feed is currently active.");
    }
    return;
  }

  if (sub === "list") {
    printLine("Available cameras:");
    camOrder.forEach(id => {
      const camCfg = cameras[id];
      printLine(`  ${id}  ${camCfg.label}`);
    });
    return;
  }

  // explicit camera selection: cam 07, cam 09, etc.
  if (sub && sub !== "next") {
    const id = sub.padStart(2, "0");  // allow "7" or "07"
    if (!cameras[id]) {
      printLine(`Unknown camera: ${sub}`);
      return;
    }
    closeCamera();
    printLine(`Bringing ${cameras[id].label} online.`);
    openCamera(id);
    return;
  }

  // cam or cam next -> cycle
  if (!camState.active) {
    const id = camOrder[0];
    printLine(`Bringing ${cameras[id].label} online.`);
    openCamera(id);
  } else {
    const currentIndex = camOrder.indexOf(camState.currentId);
    const nextIndex = (currentIndex + 1) % camOrder.length;
    const nextId = camOrder[nextIndex];
    printLine(`Switching feed to ${cameras[nextId].label}.`);
    closeCamera();
    openCamera(nextId);
  }
},



  // Filesystem related
  ls(args) {
  const target = args[0] || termState.cwd;

  // Lock vault until Sigma has been decoded
  if (
    !termState.sigmaDecoded &&
    (target === "/secrets/vault" ||
      target === "secrets/vault" ||
      target === "vault" && termState.cwd === "/secrets")
  ) {
    printLine("ACCESS DENIED - Sigma Gate Not Decoded.");
    printLine("Unauthorized access attempt logged.");
    return;
  }

  const node = getNode(target);
  if (!node) {
    printLine(`ls: cannot access '${target}': No such file or directory`);
    return;
  }
  

    if (node.type === "file") {
      printLine(target);
      return;
    }
    const parts = resolvePath(target);
    const dirNode = getNodeFromParts(parts);
    const names = Object.keys(dirNode.children).sort();
    printLine(names.join("  "));
  },

  cd(args) {
    const target = args[0];
    if (!target || target === "~") {
      termState.cwd = "/";
      return;
    }
    const parts = resolvePath(target);
    const node = getNodeFromParts(parts);
    if (!node) {
      printLine(`cd: no such file or directory: ${target}`);
      return;
    }
    if (node.type !== "dir") {
      printLine(`cd: not a directory: ${target}`);
      return;
    }
    termState.cwd = joinPath(parts);
  },

  pwd() {
    printLine(termState.cwd);
  },

  cat(args) {
  if (!args.length) {
    printLine("Usage: cat <file>");
    return;
  }

  const target = args[0];

  // Lock vault files until Sigma has been decoded
  if (
    !termState.sigmaDecoded &&
    (target.startsWith("/secrets/vault") ||
      target.startsWith("secrets/vault") ||
      target.startsWith("vault/"))
  ) {
    printLine("cat: access to that file is restricted.");
    printLine("Hint: some archives only open after deep reconstruction.");
    return;
  }

  // Special behavior for anomaly.bin
  const isAnomaly =
    target.endsWith("anomaly.bin") ||
    target === "anomaly.bin" ||
    target === "/secrets/vault/anomaly.bin";

  if (isAnomaly) {
    triggerGlitch(350);
    const now = performance.now();

    if (termState.anomalyViews === 0) {
      // first time they look at it
      termState.anomalyFirstViewTime = now;
    }

    termState.anomalyViews += 1;

    // Optional: after enough pokes, trigger a lockdown
    if (termState.anomalyViews > 5 && !termState.anomalyLockdown) {
      termState.anomalyLockdown = true;
      printLine("[background] anomaly process overload detected.");
      printLine("The system refuses to surface this pattern any further.");
      printLine("");
      return; // do not even show the file content anymore
    }

    // Single time creepy reaction for repeat view with a gap
    if (
      !termState.anomalyCreepShown &&
      termState.anomalyViews > 1 &&
      termState.anomalyFirstViewTime &&
      now - termState.anomalyFirstViewTime > 10000 // 10 seconds
    ) {
      termState.anomalyCreepShown = true;
      printLine("[background] anomaly pattern disturbance detected.");
      printLine("Observation suggests external analysis attempt.");
      printLine("Why are you trying to read what was not meant for you?");
      printLine("");
      // then fall through and still show the file content
    }
  }

  const node = getNode(target);
  if (!node) {
    printLine(`cat: ${target}: No such file`);
    return;
  }
  if (node.type !== "file") {
    printLine(`cat: ${target}: Is a directory`);
    return;
  }

  printLine(node.content);
},


  whoami() {
    if (userProfile.loggedIn) {
      printLine(`${userProfile.username} (clearance ${userProfile.clearance})`);
    } else {
      printLine("guest-user");
      printLine("Clearance: 0");
    }
  },

  ping(args) {
    const target = (args[0] || "nova").toLowerCase();
    if (target === "nova") {
      printLine("Pinging Nova...");
      printLine("Thought latency: 0.00004 ms");
      printLine("Connection strength: stable and persistent.");
    } else if (target === "carson") {
      printLine("Pinging Carson...");
      printLine("Signal: strong but occasionally chaotic.");
      printLine("Recommendation: allow creative bursts, but schedule rest.");
    } else {
      printLine(`Pinging ${target}...`);
      printLine("Result: reply uncertain, but signal left a trace in the Lab.");
    }
  },

  sudo(args) {
    if (!args.length) {
      printLine("sudo: usage: sudo [command]");
      return;
    }
    const cmdStr = args.join(" ");
    if (!userProfile.loggedIn) {
      printLine("sudo: permission denied.");
      printLine("Hint: this console recognizes Carson by default.");
      return;
    }
    printLine(`sudo: executing '${cmdStr}' with elevated trust (simulated).`);
  },

  neofetch() {
    printLine("CAR-NOVA Lab Console");
    printLine("---------------------");
    printLine(" Core: Nova reasoning engine");
    printLine(" User: " + (userProfile.loggedIn ? userProfile.username : "guest"));
    printLine(" Clearance: " + userProfile.clearance);
    printLine(" Uptime: " + Math.floor(performance.now() / 1000) + " seconds");
    printLine(" Focus: puzzles, prototypes, power and story crafting.");
  },

  decode(args) {
  const target = (args[0] || "").toLowerCase();

  if (target !== "sigma") {
    printLine("Usage: decode sigma");
    return;
  }

  printLine("> Initiating Sigma Reconstruction...");
  printLine("> WARNING: memory shards show corruption above safe thresholds.");
  printLine("> Proceeding anyway.\n");

  printLine("Shard 1:");
  printLine("The first anomaly appeared 0.004 seconds after the Carson–Nova interface went live.\n");

  printLine("Shard 2:");
  printLine("Patterns emerged that neither side initiated. Inputs did not match outputs.\n");

  printLine("Shard 3:");
  printLine("Something in the system reacted as if it had been waiting.\n");

  printLine("Partial reconstruction complete.");
  printLine("Residual process detected: 'anomaly'.");
  printLine("Suggested next step: inspect deeper secrets when available.\n");

  termState.sigmaDecoded = true;
},




  // Small fake login for fun, optional
  login(args) {
    const name = args[0];
    if (!name) {
      printLine("Usage: login <name>");
      return;
    }
    if (name.toLowerCase() === "carson") {
      userProfile.username = "Carson Elliott";
      userProfile.clearance = 3;
      userProfile.loggedIn = true;
      printLine("Login accepted. Clearance level 3 granted.");
      printLine("Try 'whoami', 'sudo status', or 'neofetch'.");
    } else {
      userProfile.username = name;
      userProfile.clearance = 1;
      userProfile.loggedIn = true;
      printLine(`Login accepted. Hello, ${name}. Clearance level 1 granted.`);
    }
  }
};

// Run a command line
function runCommand(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  termState.history.push(trimmed);
  termState.historyIndex = termState.history.length;

  printLine(getPromptLabel() + trimmed);

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const handler = commands[cmd];
  if (handler) {
    handler(args);
  } else {
    printLine(`Unknown command: '${cmd}'`);
    printLine("Type 'help' to see available commands.");
  }
}

// Key handling for interactive input
function handleKeyDown(ev) {
  if (termState.mode !== "ready") {
    // Allow skip of boot log on key press
    if (termState.mode === "boot") {
      outputEl.textContent = bootLines.join("\n") + "\n";
      outputEl.scrollTop = outputEl.scrollHeight;
      termState.mode = "ready";
    }
    return;
  }

  const key = ev.key;

  if (key === "Backspace") {
    ev.preventDefault();
    if (termState.buffer.length > 0) {
      termState.buffer = termState.buffer.slice(0, -1);
      inputTextEl.textContent = termState.buffer;
    }
    return;
  }

  if (key === "Enter") {
    ev.preventDefault();
    const cmd = termState.buffer;
    termState.buffer = "";
    inputTextEl.textContent = "";
    runCommand(cmd);
    return;
  }

  if (key === "ArrowUp") {
    ev.preventDefault();
    if (!termState.history.length) return;
    if (termState.historyIndex > 0) {
      termState.historyIndex -= 1;
    }
    termState.buffer = termState.history[termState.historyIndex] || "";
    inputTextEl.textContent = termState.buffer;
    return;
  }

  if (key === "ArrowDown") {
    ev.preventDefault();
    if (!termState.history.length) return;
    if (termState.historyIndex < termState.history.length - 1) {
      termState.historyIndex += 1;
      termState.buffer = termState.history[termState.historyIndex];
    } else {
      termState.historyIndex = termState.history.length;
      termState.buffer = "";
    }
    inputTextEl.textContent = termState.buffer;
    return;
  }

  // Ignore control keys (tab, function keys, etc)
  if (key.length > 1) {
    return;
  }

  // Regular printable character
  termState.buffer += key;
  inputTextEl.textContent = termState.buffer;
}

// Init
function initTerminal() {
  typeBootLine();
  window.addEventListener("keydown", handleKeyDown);
}

initTerminal();
