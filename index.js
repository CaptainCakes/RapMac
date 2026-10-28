/**
 * RapMac Flowchart Core Engine
 * Headless AST interpreter, binary .rap parser, and expression evaluator.
 *
 * @license MIT
 * @author RapMac Team
 */

'use strict';

const {
  RapMacInterpreter,
  RaptorInterpreter,
  isBuiltinProcedure,
  parseCallStatement,
  RAPMAC_COLORS,
  RAPTOR_COLORS,
  COLOR_NAMES_MAP,
  BUILTIN_PROCEDURES_INFO
} = require('./interpreter');

const {
  NrbfStreamParser,
  RapBinaryParser,
  RapBinarySerializer
} = require('./rap-parser');

const { SAMPLES } = require('./samples');

module.exports = {
  // Primary RapMac Engine Exports
  RapMacInterpreter,
  RAPMAC_COLORS,
  isBuiltinProcedure,
  parseCallStatement,
  COLOR_NAMES_MAP,
  BUILTIN_PROCEDURES_INFO,

  // Binary Parser & Serializer for .rap files
  NrbfStreamParser,
  RapBinaryParser,
  RapBinarySerializer,

  // Built-in Sample Flowcharts
  SAMPLES,

  // Backwards compatibility aliases
  RaptorInterpreter,
  RAPTOR_COLORS
};
