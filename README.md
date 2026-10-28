# RapMac Core Flowchart Engine & CLI

> **Headless Flowchart Interpreter, AST Runner, Binary `.rap` Parser & Command-Line Interface**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-339933?logo=node.js)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen)](test_core_engine.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)](https://github.com/CaptainCakes/Raptor-macOS)

---

## Looking for the RapMac Desktop Application for macOS?

If you want the visual desktop application with flowchart canvas editing, MacBook Touch Bar controls, and the **Google Gemini AI Assistant**, download the pre-built installer:

👉 **[Download RapMac for macOS (`.dmg`)](https://github.com/CaptainCakes/Raptor-macOS/releases)** (visit the [Releases](https://github.com/CaptainCakes/Raptor-macOS/releases) tab)

### 🚀 Desktop App Installation Guide

1. **Download**: Download the version of RapMac for your Mac from the [Releases](https://github.com/CaptainCakes/Raptor-macOS/releases) tab:
   - **Apple Silicon (M1, M2, M3, M4)**: `RapMac-macOS-arm64.dmg` (or `RapMac-macOS-arm64.zip`)
   - **Intel Macs (Core i5, i7, i9, Xeon)**: `RapMac-macOS-x64.dmg` (or `RapMac-macOS-x64.zip`)
2. **Mount**: Double-click the downloaded `.dmg` file for your Mac to open the installer window.
3. **Install**: Drag **RapMac.app** into the **Applications** shortcut folder.
4. **First-Time Launch (Bypassing macOS "Damaged" / Gatekeeper Warning)**:
   - Because RapMac is a free, open-source community project distributed outside the Mac App Store without a paid Apple Developer subscription (\$99/year), macOS may display:  
     > *"RapMac is damaged and can't be opened. You should move it to the Trash."*
   - **Option 1: 1-Click Fix (No Terminal Required)**:  
     Inside the DMG or ZIP folder, double-click **`Launch RapMac.command`**! This automatically authorizes RapMac and launches the app directly.
   - **Option 2: System Settings**:  
     Go to **Apple  Menu → System Settings → Privacy & Security**, scroll down to the **Security** section, and click **Open Anyway**.
   - **Option 3: Terminal Command**:  
     ```bash
     xattr -cr /Applications/RapMac.app
     ```

### 📦 Built-in Plugins & Adding Custom Plugins

The installer comes with pre-packaged plugins inside the `Plugins/` folder:

- **Google Gemini AI Assistant (`gemini_ai_assistant.js`)**: 1-click error diagnosis and repair, flowchart generation from English descriptions, algorithmic trace explanations, and algorithm tutor (`Cmd + Shift + G`).
- **MacBook Pro Touch Bar (`touchbar_macbook.js`)**: Dynamic hardware execution controls, canvas modes, and interactive variable scrubbers.

#### Where Plugins Live
When you launch the app, bundled plugins are automatically copied and loaded from your user plugins directory:
```
~/Library/Application Support/RapMac/plugins/
```

#### How to Add New Plugins to RapMac
1. Open RapMac and navigate to the macOS menu bar at the top.
2. Click **Plugins** → **Open Plugins Folder** (this opens your `plugins/` folder in Finder).
3. You will find a placeholder template (`dummy_plugin.js.example`) with examples for custom functions, subroutines, buttons, and hooks. Copy and rename it to `my_plugin.js` (must end in `.js`), add your logic, and save.
4. Click **Plugins** → **Reload Plugins** (or press `Cmd + Shift + P` and choose **Reload Plugins**).

Your custom functions (usable in Assignment, Decision, and Loop blocks), custom Call block procedures, and toolbar buttons will become available immediately!

---

## Overview

**RapMac Core Engine** is a high-performance, headless execution engine and parser for algorithmic flowcharts. Designed as a standalone Node.js library and CLI tool, it allows developers, educators, and automated grading pipelines to parse, analyze, and execute flowcharts without requiring a GUI.

### Key Capabilities
- **Binary `.rap` Parser & Serializer**: Native binary NRBF parser to load, inspect, and generate `.rap` flowchart files.
- **AST Interpreter**: Full abstract syntax tree interpreter supporting all standard flowchart constructs:
  - **Inputs & Outputs** (with interactive terminal I/O and piped stream buffering)
  - **Assignments** & Expression Evaluation
  - **Selections** (two-way conditional branches)
  - **Loops** (pre-test, post-test, and middle-test loop iteration)
  - **Subcharts & Procedures** (modular subroutines with call-by-value and call-by-reference parameter passing)
- **1D & 2D Arrays**: Full 1-based indexing semantics, multidimensional arrays (`arr[i]`, `grid[r, c]`), and dynamic auto-expansion.
- **Rich Math & String Builtins**: Functions including `sqrt`, `abs`, `log`, `sin`, `cos`, `tan`, `floor`, `ceiling`, `round`, `length_of`, and random number generation (`random`).
- **Interactive CLI**: Fast command-line interface to execute flowcharts, inspect `.rap` files as JSON, or evaluate expressions directly from the terminal.

---

## Quick Start (CLI)

### 1. Installation
Clone this repository and link the CLI:

```bash
git clone https://github.com/CaptainCakes/Raptor-macOS.git
cd Raptor-macOS
npm link
```

Or run directly using Node.js:
```bash
node cli.js --help
```

### 2. CLI Commands

#### Execute a Flowchart
Run any `.rap` file or built-in sample interactively:

```bash
# Run a binary flowchart file
rapmac run MyFlowchart.rap

# Run a built-in sample algorithm
rapmac run asig7    # Shopping Cart with loop accumulator and tax
rapmac run asig6    # Modular calculator with subcharts
rapmac run lab5     # Grading logic with input validation
```

Piped input streams are automatically supported for non-interactive automation:
```bash
printf "10\n5\n1\n" | rapmac run asig6
```

#### Inspect and Parse a `.rap` File
View the tab structure, subcharts, and node statistics of any `.rap` file:

```bash
rapmac parse template.rap
```

Output as structured JSON AST:
```bash
rapmac parse template.rap --json
```

#### Evaluate Expressions
Evaluate mathematical or string expressions from the terminal:

```bash
rapmac eval "sqrt(144) + 2^3"
# Output: Result: 20 (number)

rapmac eval 'Length_Of("Algorithm Design")'
# Output: Result: 16 (number)
```

#### Run Verification Tests
Verify the complete interpreter and parser against the full test suite:

```bash
rapmac test
# or: npm test
```

---

## Programmatic API (Node.js)

You can embed the RapMac engine directly into your JavaScript or TypeScript backend services, grading scripts, or custom applications:

```javascript
const fs = require('fs');
const { RapMacInterpreter, RapBinaryParser } = require('rapmac-core');

// 1. Parse a binary .rap file into an AST
const fileBuffer = fs.readFileSync('algorithm.rap');
const flowchart = RapBinaryParser.parse(fileBuffer);

console.log('Flowchart Tabs:', flowchart.tabs.map(t => t.name));

// 2. Initialize the Interpreter
const interpreter = new RapMacInterpreter({
  speedMs: 0, // 0 = instantaneous headless execution
  onConsoleOutput: (text, type) => {
    console.log(`[RapMac OUT] ${text}`);
  },
  onInputRequest: (prompt, variableName, callback) => {
    // Provide automated inputs for testing or grading
    const mockInputs = { score: 95, proceed: 'no' };
    callback(mockInputs[variableName] || '0');
  },
  onStatusChange: (status) => {
    if (status === 'finished') {
      console.log('Execution finished!');
      console.log('Variables state:', interpreter.getWatchVariables());
    }
  }
});

// 3. Execute the flowchart
interpreter.start(flowchart, false);
```

---

## Supported Flowchart Language Specification

### Statements & Blocks
| Block Type | Purpose | Example |
| :--- | :--- | :--- |
| **Assignment** | Assign expressions to variables or array slots | `total <- price * count` |
| **Input** | Prompt user and store value into variable | `Enter score` -> `score` |
| **Output** | Print text, expressions, or variables to console | `"Result: " + total` |
| **Selection** | Branch flow based on boolean condition | `score >= 70` |
| **Loop** | Repeat execution while/until condition evaluates true | `count < 10` |
| **Call** | Invoke subchart or builtin procedure | `Calculate_Total(price, qty)` |

### Built-in Functions & Constants
- **Math**: `sqrt(x)`, `abs(x)`, `log(x)`, `floor(x)`, `ceiling(x)`, `round(x)`, `min(a, b)`, `max(a, b)`, `random`
- **Trigonometry**: `sin(rad)`, `cos(rad)`, `tan(rad)`, `cot(rad)`, `arcsin(x)`, `arccos(x)`, `arctan(x)`, `arccot(x)`
- **Strings & Arrays**: `length_of(expr)`
- **Constants**: `pi`, `e`

---

## Credits & Acknowledgements

**RapMac** is built upon the pioneering visual programming and algorithmic flowchart foundation of **RAPTOR** (Rapid Algorithmic Prototyping Tool for Ordered Reasoning), originally designed and created by:
- **Martin Carlisle**
- **Terry Wilson**
- **Jeff Humphries**
- **Jason Moore**

We express our sincere gratitude to Martin Carlisle and the original team for their landmark contributions to computer science education.

> *Disclaimer: RapMac is an independent software project developed and maintained by the RapMac Team. It is not affiliated with, endorsed by, or sponsored by the original RAPTOR team or the US Air Force Academy.*

---

## Repository Structure

```
rapmac-core/
├── index.js                  # Main library entry point
├── cli.js                    # Executable CLI runner
├── interpreter.js            # Core AST execution engine & expression evaluator
├── rap-parser.js             # Binary .rap format parser & serializer
├── samples.js                # Built-in sample flowchart ASTs
├── test_core_engine.js       # Comprehensive test runner
├── verify_raptor_syntax_semantics.js # Expression & operator test suite
├── verify_pass2_advanced.js  # Arrays, scope, and procedure test suite
├── template.rap              # Sample binary flowchart
├── package.json              # Package metadata and CLI binary definition
├── LICENSE                   # MIT License with original team attribution
└── README.md                 # Project documentation
```

---

## License

This project is licensed under the [MIT License](LICENSE).  
Copyright (c) 2026 RapMac Team. Portions based on the educational architecture by Martin Carlisle and original contributors.
