#!/usr/bin/env node

/**
 * RAPTOR CLI — Command Line Runner for RAPTOR Flowcharts
 *
 * Usage:
 *   raptor run <file.rap | sample>
 *   raptor parse <file.rap> [--json]
 *   raptor eval "<expression>"
 *   raptor test
 *
 * @license MIT
 * @author RapMac Team
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {
  RapMacInterpreter,
  RapBinaryParser,
  SAMPLES
} = require('./index');

const ARGS = process.argv.slice(2);

function printHelp() {
  console.log(`
RapMac Core Flowchart Engine & CLI (v3.0.0)

USAGE:
  rapmac <command> [options]

COMMANDS:
  run <file.rap | sample>      Execute a flowchart interactively in terminal
  parse <file.rap> [--json]    Inspect and parse a binary .rap flowchart file
  eval "<expression>"          Evaluate a mathematical/string expression
  test                         Run the core engine verification test suites
  help, -h, --help             Display this help message

BUILTIN SAMPLES:
  asig7                        Shopping cart with loop accumulator & tax calculation
  asig6                        Arithmetic calculator with modular subcharts
  lab5                         Grading algorithm with validation loop

EXAMPLES:
  rapmac run template.rap
  rapmac run asig7
  rapmac parse template.rap --json
  rapmac eval "sqrt(144) + 2^3"
  rapmac test
`);
}

function handleEval(expr) {
  if (!expr) {
    console.error('Error: Please provide an expression to evaluate.');
    process.exit(1);
  }
  const interpreter = new RapMacInterpreter();
  try {
    const result = interpreter.evaluate(expr);
    console.log(`\nExpression: ${expr}`);
    console.log(`Result:     ${typeof result === 'string' ? `"${result}"` : result} (${typeof result})`);
  } catch (err) {
    console.error(`Evaluation Error: ${err.message}`);
    process.exit(1);
  }
}

function handleParse(filePath, asJson) {
  if (!filePath) {
    console.error('Error: Please provide a .rap file path.');
    process.exit(1);
  }
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`Error: File not found: ${absPath}`);
    process.exit(1);
  }

  try {
    const buf = fs.readFileSync(absPath);
    const parsed = RapBinaryParser.parse(buf);

    if (asJson) {
      console.log(JSON.stringify(parsed, null, 2));
      return;
    }

    console.log(`\n======================================================`);
    console.log(`RapMac File Analysis: ${path.basename(absPath)}`);
    console.log(`======================================================`);
    console.log(`File Size:       ${(buf.length / 1024).toFixed(2)} KB`);
    console.log(`Main Tab Nodes:  ${parsed.nodes ? parsed.nodes.length : 0}`);
    const subchartKeys = Object.keys(parsed.subcharts || {});
    console.log(`Subcharts count: ${subchartKeys.length}`);
    if (subchartKeys.length > 0) {
      subchartKeys.forEach((name, i) => {
        const sc = parsed.subcharts[name];
        console.log(`  [${i + 1}] Subchart: "${name}" (${sc.nodes ? sc.nodes.length : 0} nodes)`);
      });
    }
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`Parse Error: ${err.message}`);
    process.exit(1);
  }
}

function handleRun(target) {
  if (!target) {
    console.error('Error: Please provide a .rap file path or sample name (e.g. asig7, asig6).');
    process.exit(1);
  }

  let flowchart = null;
  let sourceName = target;

  if (SAMPLES[target.toLowerCase()]) {
    const sample = SAMPLES[target.toLowerCase()];
    sourceName = `Sample: ${sample.title || target}`;
    flowchart = sample;
  } else {
    const absPath = path.resolve(target);
    if (!fs.existsSync(absPath)) {
      console.error(`Error: File or sample not found: "${target}".`);
      console.error(`Available built-in samples: asig7, asig6, lab5.`);
      process.exit(1);
    }
    try {
      const buf = fs.readFileSync(absPath);
      flowchart = RapBinaryParser.parse(buf);
      sourceName = path.basename(absPath);
    } catch (err) {
      console.error(`Failed to parse flowchart file: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`\n======================================================`);
  console.log(`Running Flowchart: ${sourceName}`);
  console.log(`======================================================\n`);

  const inputQueue = [];
  const waitingCallbacks = [];
  let isDone = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY)
  });

  rl.on('line', (line) => {
    if (waitingCallbacks.length > 0) {
      const cb = waitingCallbacks.shift();
      cb(line.trim());
    } else {
      inputQueue.push(line.trim());
    }
  });

  rl.on('close', () => {
    while (waitingCallbacks.length > 0) {
      const cb = waitingCallbacks.shift();
      cb('');
    }
  });

  const interpreter = new RapMacInterpreter({
    speedMs: 10,
    onConsoleOutput: (text, type) => {
      if (type === 'clear') {
        console.clear();
      } else if (type === 'error') {
        console.error(`[ERROR] ${text}`);
      } else if (type === 'system') {
        console.log(`[RapMac] ${text}`);
      } else {
        process.stdout.write(text + '\n');
      }
    },
    onInputRequest: (prompt, variableName, callback) => {
      const promptText = prompt ? `${prompt} ` : `Enter value for ${variableName}: `;
      if (inputQueue.length > 0) {
        const val = inputQueue.shift();
        if (process.stdin.isTTY) {
          console.log(`? ${promptText}${val}`);
        }
        callback(val);
      } else {
        if (process.stdin.isTTY) {
          process.stdout.write(`? ${promptText}`);
        }
        waitingCallbacks.push(callback);
      }
    },
    onStatusChange: (status) => {
      if (status === 'finished') {
        if (!isDone) {
          isDone = true;
          try { rl.close(); } catch (e) {}
          printSummary(interpreter);
        }
      } else if (status === 'error') {
        if (!isDone) {
          isDone = true;
          try { rl.close(); } catch (e) {}
        }
      }
    }
  });

  interpreter.start(flowchart, false);
}

function printSummary(interpreter) {
  console.log(`\n======================================================`);
  console.log(`Execution Finished Successfully`);
  console.log(`======================================================`);
  const vars = interpreter.getWatchVariables();
  const keys = Object.keys(vars);
  if (keys.length === 0) {
    console.log(`No variables recorded in watch window.`);
  } else {
    console.log(`Final Variables State:`);
    keys.forEach(k => {
      const v = vars[k];
      const displayVal = Array.isArray(v) ? JSON.stringify(v) : (typeof v === 'string' ? `"${v}"` : v);
      console.log(`  * ${k} = ${displayVal}`);
    });
  }
  console.log(`======================================================\n`);
}

function handleTest() {
  console.log(`Running RapMac Core Verification Suite...\n`);
  try {
    require('./verify_raptor_syntax_semantics.js');
    require('./verify_pass2_advanced.js');
    console.log(`\n✓ All RapMac core engine tests passed with 100% success!\n`);
  } catch (err) {
    console.error(`\n✗ Test suite failed:`, err);
    process.exit(1);
  }
}

// Main Command Router
if (ARGS.length === 0 || ARGS[0] === 'help' || ARGS[0] === '-h' || ARGS[0] === '--help') {
  printHelp();
  process.exit(0);
}

const command = ARGS[0].toLowerCase();

switch (command) {
  case 'run':
    handleRun(ARGS[1]);
    break;

  case 'parse':
    handleParse(ARGS[1], ARGS.includes('--json'));
    break;

  case 'eval':
    handleEval(ARGS.slice(1).join(' '));
    break;

  case 'test':
    handleTest();
    break;

  default:
    // If first argument is an existing file, default to run
    if (fs.existsSync(path.resolve(command))) {
      handleRun(command);
    } else {
      console.error(`Unknown command: "${command}". Run "rapmac --help" for usage.`);
      process.exit(1);
    }
    break;
}
