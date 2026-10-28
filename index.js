/**
 * RAPTOR Flowchart Core Engine
 * Headless AST interpreter, binary .rap parser, and expression evaluator.
 *
 * @license MIT
 * @author RAPTOR Team
 */

'use strict';

const {
  RaptorInterpreter,
  isBuiltinProcedure,
  parseCallStatement,
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
  // Interpreter & Execution Engine
  RaptorInterpreter,
  isBuiltinProcedure,
  parseCallStatement,
  RAPTOR_COLORS,
  COLOR_NAMES_MAP,
  BUILTIN_PROCEDURES_INFO,

  // Binary Parser & Serializer
  NrbfStreamParser,
  RapBinaryParser,
  RapBinarySerializer,

  // Builtin Sample Flowcharts
  SAMPLES
};
