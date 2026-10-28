/**
 * RapMac Core Engine Verification Test Suite
 * Runs all syntax, semantic, array, procedure, and flowchart execution tests.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const { RapMacInterpreter, RapBinaryParser, SAMPLES } = require('./index');

console.log('================================================================');
console.log('RAPMAC CORE ENGINE VERIFICATION SUITE');
console.log('================================================================\n');

// 1. Run Syntax & Semantics
console.log('--- Step 1: Testing Syntax & Expression Semantics ---');
require('./verify_raptor_syntax_semantics');

// 2. Run Advanced Engine Pass 2
console.log('\n--- Step 2: Testing Advanced Arrays, Scopes & Procedures ---');
require('./verify_pass2_advanced');

// 3. Test Binary .rap Parser
console.log('\n--- Step 3: Testing Binary .rap Parser & Serializer ---');
const templateBuf = fs.readFileSync(__dirname + '/template.rap');
const parsed = RapBinaryParser.parse(templateBuf);
assert(parsed && Array.isArray(parsed.tabs), 'Parsed template.rap must have tabs array');
console.log(`✓ template.rap parsed successfully (${parsed.tabs.length} tabs)`);

// 4. Test Headless Flowchart Execution on Sample Asig 7
console.log('\n--- Step 4: Testing Flowchart AST Execution Engine ---');
const sample = SAMPLES.asig7;
assert(sample && sample.tabs, 'Sample asig7 must be available');

const inputs = ['30', 'si', '20', 'no'];
let inputIdx = 0;
let outputLogs = [];

const interpreter = new RapMacInterpreter({
  speedMs: 0,
  onConsoleOutput: (text) => outputLogs.push(text),
  onInputRequest: (prompt, varName, cb) => {
    cb(inputs[inputIdx++]);
  }
});

interpreter.start(sample, false);

setTimeout(() => {
  const vars = interpreter.getWatchVariables();
  assert.strictEqual(vars.art, 2, 'Total articles must equal 2');
  assert.strictEqual(vars.prec, 50, 'Total price must equal 50');
  assert.strictEqual(vars.ivu, 55.75, 'Total with IVU must equal 55.75');
  console.log('✓ Headless flowchart execution test passed (art=2, prec=50, ivu=55.75)');

  console.log('\n================================================================');
  console.log('ALL RAPMAC CORE ENGINE TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}, 100);
