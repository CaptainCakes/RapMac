# RAPTOR Core Flowchart Engine & CLI

> **Headless Flowchart Interpreter, AST Runner, Binary `.rap` Parser & Command-Line Interface**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-339933?logo=node.js)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen)](test_core_engine.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)](https://github.com)

---

## Looking for the macOS Desktop Application?

If you want the visual desktop application with flowchart canvas editing, MacBook Touch Bar controls, and the **Google Gemini AI Assistant**, download the pre-built installer:

👉 **[Download RAPTOR for macOS (`.dmg`)](https://github.com/CaptainCakes/Raptor-macOS/releases)** (visit the [Releases](https://github.com/CaptainCakes/Raptor-macOS/releases) tab)

### 📦 Built-in Plugins & Adding Custom Plugins

The `.dmg` release comes with pre-packaged plugins already included:

- **Google Gemini AI Assistant (`gemini_ai_assistant.js`)**: 1-click error diagnosis and repair, flowchart generation from English descriptions, algorithmic trace explanations, and algorithm tutor (`Cmd + Shift + G`).
- **MacBook Pro Touch Bar (`touchbar_macbook.js`)**: Dynamic hardware execution controls, canvas modes, and interactive variable scrubbers.
- **Math & Statistics (`sample_math_stats.js`)**: Extended mathematical and statistical functions.

#### Where Plugins Live
When you launch the app, bundled plugins are automatically copied and loaded from your user plugins directory:
```
~/Library/Application Support/Raptor/plugins/
```

#### How to Add New Plugins to RAPTOR
1. Open RAPTOR and navigate to the macOS menu bar at the top.
2. Click **Plugins** → **Open Plugins Folder** (this opens your `plugins/` folder in Finder).
3. Drop any single-file JavaScript plugin (`.js`) into that folder.
4. Click **Plugins** → **Reload Plugins** (or press `Cmd + Shift + P` and choose **Reload Plugins**).

Your custom functions (usable in Assignment, Decision, and Loop blocks), custom Call block procedures, and toolbar buttons will become available immediately!

---

## Overview

**RAPTOR Core Engine** is a high-performance, headless execution engine and parser for RAPTOR flowcharts. Designed as a standalone Node.js library and CLI tool, it allows developers, educators, and automated grading pipelines to parse, analyze, and execute RAPTOR flowcharts without requiring a GUI.

### Key Capabilities
- **Binary `.rap` Parser & Serializer**: Native binary NRBF (Net Data Contract / BinaryFormatter) parser to load and inspect `.rap` files created by RAPTOR.
- **AST Interpreter**: Full abstract syntax tree interpreter supporting all standard RAPTOR flowchart constructs:
  - **Inputs & Outputs** (with interactive terminal I/O and piped stream buffering)
  - **Assignments** & Expression Evaluation
  - **Selections** (two-way conditional branches)
  - **Loops** (pre-test, post-test, and middle-test loop iteration)
  - **Subcharts & Procedures** (modular subroutines with call-by-value and call-by-reference parameter passing)
- **1D & 2D Arrays**: Full 1-based indexing semantics, multidimensional arrays (`arr[i]`, `grid[r, c]`), and dynamic auto-expansion matching classic RAPTOR.
- **Rich Math & String Builtins**: Standard RAPTOR functions including `sqrt`, `abs`, `log`, `sin`, `cos`, `tan`, `floor`, `ceiling`, `round`, `length_of`, and random number generation (`random`).
- **Interactive CLI**: Fast command-line interface to execute flowcharts, inspect `.rap` files as JSON, or evaluate RAPTOR expressions directly from the terminal.

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
raptor run MyFlowchart.rap

# Run a built-in sample algorithm
raptor run asig7    # Shopping Cart with loop accumulator and tax
raptor run asig6    # Modular calculator with subcharts
raptor run lab5     # Grading logic with input validation
```

Piped input streams are automatically supported for non-interactive automation:
```bash
printf "10\n5\n1\n" | raptor run asig6
```

#### Inspect and Parse a `.rap` File
View the tab structure, subcharts, and node statistics of any `.rap` file:

```bash
raptor parse template.rap
```

Output as structured JSON AST:
```bash
raptor parse template.rap --json
```

#### Evaluate RAPTOR Expressions
Evaluate any RAPTOR mathematical or string expression from the terminal:

```bash
raptor eval "sqrt(144) + 2^3"
# Output: Result: 20 (number)

raptor eval 'Length_Of("Algorithm Design")'
# Output: Result: 16 (number)
```

#### Run Verification Tests
Verify the complete interpreter and parser against the full test suite:

```bash
raptor test
# or: npm test
```

---

## Programmatic API (Node.js)

You can embed the RAPTOR engine directly into your JavaScript or TypeScript backend services, grading scripts, or custom applications:

```javascript
const fs = require('fs');
const { RaptorInterpreter, RapBinaryParser } = require('raptor-core');

// 1. Parse a binary .rap file into an AST
const fileBuffer = fs.readFileSync('algorithm.rap');
const flowchart = RapBinaryParser.parse(fileBuffer);

console.log('Flowchart Tabs:', flowchart.tabs.map(t => t.name));

// 2. Initialize the Interpreter
const interpreter = new RaptorInterpreter({
  speedMs: 0, // 0 = instantaneous headless execution
  onConsoleOutput: (text, type) => {
    console.log(`[RAPTOR OUT] ${text}`);
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

## Supported RAPTOR Language Specification

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

## Verification & Testing

The core engine is covered by an automated test suite verifying syntax, expressions, 1D/2D arrays, subchart parameter passing, and binary serialization:

```bash
node test_core_engine.js
```

- **Pass 1: Syntax & Semantics**: Arithmetic precedence, comparison operators, string concatenation, case-insensitivity.
- **Pass 2: Advanced Engine**: Array manipulation, matrix indexing, nested loops, procedure scopes.
- **Pass 3: Serialization**: Binary .rap stream parsing and AST reconstruction.
- **Pass 4: End-to-End AST Execution**: Multi-step accumulator and loop execution.

---

## Repository Structure

```
raptor-core/
├── index.js                  # Main library entry point
├── cli.js                    # Executable CLI runner
├── interpreter.js            # Core AST execution engine & expression evaluator
├── rap-parser.js             # Binary .rap format parser & serializer
├── samples.js                # Built-in sample flowchart ASTs
├── test_core_engine.js       # Comprehensive test runner
├── verify_raptor_syntax_semantics.js # Expression & operator test suite
├── verify_pass2_advanced.js  # Arrays, scope, and procedure test suite
├── template.rap              # Sample binary RAPTOR flowchart
├── package.json              # Package metadata and CLI binary definition
├── LICENSE                   # MIT License
└── README.md                 # Project documentation
```

---

## License

This project is licensed under the [MIT License](LICENSE). Built upon the educational foundation of RAPTOR created by Martin Carlisle and the original RAPTOR team.
