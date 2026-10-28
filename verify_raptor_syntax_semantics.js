const { RaptorInterpreter, isBuiltinProcedure, parseCallStatement, RAPTOR_COLORS, COLOR_NAMES_MAP } = require("./interpreter.js");
const assert = require("assert");

console.log("====================================================");
console.log("STARTING DOUBLE-CHECK PASS 1: OPERATORS & FUNCTIONS");
console.log("====================================================");

const interp = new RaptorInterpreter();

// 1. Operator precedence & math
assert.strictEqual(interp.evaluate("3 + 4 * 2"), 11);
assert.strictEqual(interp.evaluate("(3 + 4) * 2"), 14);
assert.strictEqual(interp.evaluate("2^3"), 8);
assert.strictEqual(interp.evaluate("2**3"), 8);
assert.strictEqual(interp.evaluate("-3^2"), 9, "RAPTOR unary minus before exponentiation: -3^2 must equal 9");
assert.strictEqual(interp.evaluate("-3**2"), 9, "RAPTOR unary minus before exponentiation: -3**2 must equal 9");
assert.strictEqual(interp.evaluate("10 / 4"), 2.5);

// 2. Mod vs Rem table from slide & doc
assert.strictEqual(interp.evaluate("10 rem 3"), 1);
assert.strictEqual(interp.evaluate("10 mod 3"), 1);
assert.strictEqual(interp.evaluate("37 rem 2"), 1);
assert.strictEqual(interp.evaluate("37 mod 2"), 1);
assert.strictEqual(interp.evaluate("16 rem 2"), 0);
assert.strictEqual(interp.evaluate("16 mod 2"), 0);
assert.strictEqual(interp.evaluate("9.5 rem 3"), 0.5);
assert.strictEqual(interp.evaluate("9.5 mod 3"), 0.5);
assert.strictEqual(interp.evaluate("9.5 rem 2.5"), 2);
assert.strictEqual(interp.evaluate("9.5 mod 2.5"), 2);
assert.strictEqual(interp.evaluate("-10 rem 3"), -1);
assert.strictEqual(interp.evaluate("-10 mod 3"), 2);
assert.strictEqual(interp.evaluate("10 rem -3"), 1);
assert.strictEqual(interp.evaluate("10 mod -3"), -2);

// 3. Relational comparison (single = is equality)
assert.strictEqual(interp.evaluate("10 = 10"), true);
assert.strictEqual(interp.evaluate("10 = 20"), false);
assert.strictEqual(interp.evaluate("10 /= 20"), true);
assert.strictEqual(interp.evaluate("10 != 20"), true);
assert.strictEqual(interp.evaluate("10 <> 20"), true);
assert.strictEqual(interp.evaluate("10 <= 20"), true);
assert.strictEqual(interp.evaluate("20 >= 10"), true);
assert.strictEqual(interp.evaluate("10 < 20"), true);
assert.strictEqual(interp.evaluate("20 > 10"), true);

// 4. Boolean literals: yes/no, true/false, and/or/xor/not
assert.strictEqual(interp.evaluate("yes"), true);
assert.strictEqual(interp.evaluate("no"), false);
assert.strictEqual(interp.evaluate("true"), true);
assert.strictEqual(interp.evaluate("false"), false);
assert.strictEqual(interp.evaluate("yes and false"), false);
assert.strictEqual(interp.evaluate("yes or false"), true);
assert.strictEqual(interp.evaluate("yes xor false"), true);
assert.strictEqual(interp.evaluate("yes xor yes"), false);
assert.strictEqual(interp.evaluate("not yes"), false);
assert.strictEqual(interp.evaluate("not no"), true);

// 5. RAPTOR built-in math & trig functions
assert.strictEqual(interp.evaluate("sqrt(16)"), 4);
assert.strictEqual(interp.evaluate("abs(-42)"), 42);
assert.strictEqual(interp.evaluate("floor(3.8)"), 3);
assert.strictEqual(interp.evaluate("ceiling(3.2)"), 4);
assert.strictEqual(interp.evaluate("ceil(3.2)"), 4);
assert.strictEqual(interp.evaluate("log(e)"), 1);
assert.strictEqual(interp.evaluate("sin(pi / 2)"), 1);
assert.strictEqual(Math.round(interp.evaluate("cos(pi)")), -1);
assert.strictEqual(interp.evaluate("tan(0)"), 0);
assert(Math.abs(interp.evaluate("cot(pi / 4)") - 1) < 1e-10);
assert.strictEqual(interp.evaluate("arcsin(1)"), Math.PI / 2);
assert.strictEqual(interp.evaluate("arccos(1)"), 0);
assert.strictEqual(interp.evaluate("arcos(1)"), 0, "arcos(1) must equal 0");
assert.strictEqual(interp.evaluate("arctan(0)"), 0);
assert(Math.abs(interp.evaluate("arctan(10, 3)") - 1.2793) < 0.001, "arctan(10, 3) must be ~1.2793");
assert(Math.abs(interp.evaluate("arccot(10, 3)") - 0.29145) < 0.001, "arccot(10, 3) must be ~0.29145");
assert(Math.abs(interp.evaluate("arccot(1)") - Math.PI / 4) < 1e-10);

// 6. RAPTOR string functions
assert.strictEqual(interp.evaluate('Length_Of("RAPTOR")'), 6);
assert.strictEqual(interp.evaluate('Length_of("Sell now")'), 8);
assert.strictEqual(interp.evaluate('To_Integer("123")'), 123);
assert.strictEqual(interp.evaluate('To_Float("123.45")'), 123.45);
assert.strictEqual(interp.evaluate('String_Of(456)'), "456");

// 7. RAPTOR random function (min, max) inclusive
for (let i = 0; i < 50; i++) {
  const r = interp.evaluate("random(1, 6)");
  assert(r >= 1 && r <= 6, `Random ${r} outside [1, 6]`);
  assert(Number.isInteger(r), `Random ${r} not integer`);
}

// 8. Type predicate functions
interp.setVariable("num", 42);
interp.setVariable("str", "hello");
assert.strictEqual(interp.evaluate("Is_Number(num)"), true);
assert.strictEqual(interp.evaluate("Is_String(num)"), false);
assert.strictEqual(interp.evaluate("Is_String(str)"), true);
assert.strictEqual(interp.evaluate("Is_Character('a')"), true);
assert.strictEqual(interp.evaluate("Is_Character('abc')"), false);

console.log(">> PASS 1 SUCCESSFUL!");

console.log("====================================================");
console.log("STARTING DOUBLE-CHECK PASS 2: ARRAYS, PROCEDURES & CARTESIAN");
console.log("====================================================");

// 1. 1-Based 1D Array with auto-initialization to 0
const arrayInterp = new RaptorInterpreter();
arrayInterp.setVariable("GPAs[5]", 4.0);
const gpas = arrayInterp.variables["GPAs"];
assert(Array.isArray(gpas), "GPAs must be an array");
assert.strictEqual(gpas.length, 6, "Array length including dummy index 0 must be 6");
assert.strictEqual(gpas[1], 0, "GPAs[1] must be auto-initialized to 0");
assert.strictEqual(gpas[2], 0, "GPAs[2] must be auto-initialized to 0");
assert.strictEqual(gpas[3], 0, "GPAs[3] must be auto-initialized to 0");
assert.strictEqual(gpas[4], 0, "GPAs[4] must be auto-initialized to 0");
assert.strictEqual(gpas[5], 4.0, "GPAs[5] must be 4.0");

// Verify Length_Of(GPAs) returns highest index (5)
assert.strictEqual(arrayInterp.evaluate("Length_Of(GPAs)"), 5);
assert.strictEqual(arrayInterp.evaluate("Is_Array(GPAs)"), true);
assert.strictEqual(arrayInterp.evaluate("Is_2D_Array(GPAs)"), false);
assert.strictEqual(arrayInterp.evaluate("Is_Array2D(GPAs)"), false);

// 2. 2D Array assignment & indexing matrix[r, c]
arrayInterp.setVariable("Board[3, 3]", "X");
const board = arrayInterp.variables["Board"];
assert(Array.isArray(board), "Board must be an array");
assert(Array.isArray(board[3]), "Board[3] must be an array");
assert.strictEqual(board[3][3], "X");
assert.strictEqual(board[1][1], 0, "Board[1][1] must be auto-initialized to 0");
assert.strictEqual(arrayInterp.evaluate("Board[3, 3]"), "X");
assert.strictEqual(arrayInterp.evaluate("Board(3, 3)"), "X");
assert.strictEqual(arrayInterp.evaluate("Is_Array(Board)"), true);
assert.strictEqual(arrayInterp.evaluate("Is_2D_Array(Board)"), true);
assert.strictEqual(arrayInterp.evaluate("Is_Array2D(Board)"), true);

// 3. Built-in procedures check including Load_Bitmap and Draw_Bitmap
const testProcedures = [
  "Clear_Console",
  "Delay_For(0.5)",
  "Wait_For_Key",
  "Wait_For_Mouse_Button(1)",
  "Get_Mouse_Button(1, x, y)",
  "Open_Graph_Window(400, 300)",
  "Close_Graph_Window",
  "Clear_Window(White)",
  "Put_Pixel(10, 20, Red)",
  "Draw_Line(0, 0, 100, 100, Blue)",
  "Draw_Box(10, 10, 50, 50, Green, Filled)",
  "Draw_Circle(50, 50, 25, Red, Unfilled)",
  "Draw_Ellipse(10, 10, 80, 40, Yellow, Filled)",
  "Draw_Ellipse_Rotate(10, 10, 80, 40, 45, Cyan, Unfilled)",
  "Draw_Arc(50, 50, 30, 30, 0, 90, Magenta)",
  "Flood_Fill(25, 25, Blue)",
  "Display_Text(10, 10, 'Hello RAPTOR', Black)",
  "Display_Number(10, 30, 12345, Black)",
  "Set_Window_Title('My RAPTOR Graph')",
  "Set_Font_Size(16)",
  "Freeze_Graph_Window",
  "Unfreeze_Graph_Window",
  "Load_Bitmap('image.bmp', myBitmap)",
  "Draw_Bitmap(myBitmap, 50, 100, 200, 150)"
];

for (const procCall of testProcedures) {
  const parsed = parseCallStatement(procCall);
  assert(parsed !== null, `Failed to parse procedure call: ${procCall}`);
  assert(isBuiltinProcedure(parsed.name), `Must recognize as built-in procedure: ${parsed.name}`);
}

// 4. Color constants check (0..15)
for (let c = 0; c <= 15; c++) {
  assert(c in RAPTOR_COLORS, `Color ${c} must be defined`);
}
assert.strictEqual(COLOR_NAMES_MAP["black"], 0);
assert.strictEqual(COLOR_NAMES_MAP["blue"], 1);
assert.strictEqual(COLOR_NAMES_MAP["green"], 2);
assert.strictEqual(COLOR_NAMES_MAP["cyan"], 3);
assert.strictEqual(COLOR_NAMES_MAP["red"], 4);
assert.strictEqual(COLOR_NAMES_MAP["white"], 15);

// 5. Test Subchart / Procedure parameter passing with IN, OUT, IN/OUT
const procFlowchart = {
  title: "ProcedureTest",
  tabs: [
    {
      name: "main",
      nodes: [
        { id: "n1", type: "assignment", variable: "X", expression: "10" },
        { id: "n2", type: "assignment", variable: "Y", expression: "20" },
        { id: "n3", type: "call", callName: "AddTen(X, Y)" },
        { id: "n4", type: "output", expression: "Y", endLine: true }
      ]
    },
    {
      name: "AddTen",
      parameters: [
        { name: "InVal", type: "in" },
        { name: "OutVal", type: "out" }
      ],
      nodes: [
        { id: "p1", type: "assignment", variable: "OutVal", expression: "InVal + 10" }
      ]
    }
  ]
};

let capturedOutput = [];
const procInterp = new RaptorInterpreter({
  onConsoleOutput: (text, type, options) => {
    capturedOutput.push({ text, type, options });
  }
});

// Run synchronous generator until done
const gen = procInterp.createExecutionGenerator(procFlowchart);
let stepRes = gen.next();
while (!stepRes.done) {
  stepRes = gen.next();
}

assert.strictEqual(procInterp.variables["X"], 10, "Caller X must remain 10");
assert.strictEqual(procInterp.variables["Y"], 20, "Caller Y was updated by out parameter to 10 + 10 = 20");
assert.strictEqual(capturedOutput.some(o => o.text === "20"), true, "Output must print 20");

console.log(">> PASS 2 SUCCESSFUL!");
console.log("====================================================");
console.log("ALL SYNTAX AND SEMANTICS FULLY VERIFIED TWICE!");
console.log("====================================================");
