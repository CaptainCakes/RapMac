const assert = require('assert');
const { RaptorInterpreter, isBuiltinProcedure, parseCallStatement, BUILTIN_PROCEDURES_INFO, RAPTOR_COLORS, COLOR_NAMES_MAP } = require('./interpreter.js');

console.log('================================================================');
console.log('STARTING SECOND COMPLETE VERIFICATION SUITE: RAPTOR ENGINE PASS 2');
console.log('================================================================');

// -----------------------------------------------------------------------------
// SECTION 1: RAPTORGRAPH QUERIES & STATE INSPECTION
// -----------------------------------------------------------------------------
console.log('Testing Section 1: RAPTORGraph queries and state...');
const graphInterp = new RaptorInterpreter({
  onGraphWindow: (action, params) => {
    // mock graph window event listener
    if (action === 'open') {
      graphInterp.graphOpen = true;
      graphInterp.graphWidth = params.width;
      graphInterp.graphHeight = params.height;
    } else if (action === 'close') {
      graphInterp.graphOpen = false;
    }
  },
  getPixelCallback: (x, y) => {
    // Return red (4) at (10, 20), green (2) elsewhere
    return (x === 10 && y === 20) ? 4 : 2;
  }
});

// Initially window is not open
assert.strictEqual(graphInterp.evaluate('is_open()'), false);
assert.strictEqual(graphInterp.evaluate('Is_Open()'), false);

// Open window
const openProc = parseCallStatement('Open_Graph_Window(800, 600)');
assert.strictEqual(isBuiltinProcedure(openProc.name), true);
Array.from(graphInterp.executeBuiltinProcedure(openProc.name.toLowerCase(), openProc.args));
assert.strictEqual(graphInterp.evaluate('is_open()'), true);
assert.strictEqual(graphInterp.evaluate('Get_Window_Width()'), 800);
assert.strictEqual(graphInterp.evaluate('Get_Window_Height()'), 600);
assert.strictEqual(graphInterp.evaluate('Get_Max_Width()'), 1920);
assert.strictEqual(graphInterp.evaluate('Get_Max_Height()'), 1080);

// Pixel queries
assert.strictEqual(graphInterp.evaluate('Get_Pixel(10, 20)'), 4);
assert.strictEqual(graphInterp.evaluate('get_pixel(5, 5)'), 2);

// Closest color calculation
assert.strictEqual(graphInterp.evaluate('Closest_Color(255, 0, 0)'), 12); // Light_Red (#FF0000)
assert.strictEqual(graphInterp.evaluate('Closest_Color(128, 0, 0)'), 4); // Red (#800000)
assert.strictEqual(graphInterp.evaluate('Closest_Color(0, 0, 255)'), 9); // Light_Blue (#0000FF)
assert.strictEqual(graphInterp.evaluate('Closest_Color(0, 0, 128)'), 1); // Blue (#000080)
assert.strictEqual(graphInterp.evaluate('Closest_Color(255, 255, 255)'), 15); // White
assert.strictEqual(graphInterp.evaluate('Closest_Color(0, 0, 0)'), 0); // Black

// Mouse coordinates & buttons
graphInterp.handleMouseMove(150, 250);
assert.strictEqual(graphInterp.evaluate('Get_Mouse_X()'), 150);
assert.strictEqual(graphInterp.evaluate('Get_Mouse_Y()'), 250);

graphInterp.handleMouseDown(0, 150, 250); // Left button down
assert.strictEqual(graphInterp.evaluate('Mouse_Button_Down(Left_Button)'), true);
assert.strictEqual(graphInterp.evaluate('Mouse_Button_Pressed(Left_Button)'), true);
assert.strictEqual(graphInterp.evaluate('Mouse_Button_Down(Right_Button)'), false);

graphInterp.handleMouseUp(0, 150, 250);
assert.strictEqual(graphInterp.evaluate('Mouse_Button_Down(Left_Button)'), false);
assert.strictEqual(graphInterp.evaluate('Mouse_Button_Released(Left_Button)'), true);

// Close window
const closeProc = parseCallStatement('Close_Graph_Window');
Array.from(graphInterp.executeBuiltinProcedure(closeProc.name.toLowerCase(), closeProc.args));
assert.strictEqual(graphInterp.evaluate('is_open()'), false);

console.log('✓ Section 1 Passed!');

// -----------------------------------------------------------------------------
// SECTION 2: MATHEMATICAL FUNCTIONS, TRIG, CONSTANTS & ARITHMETIC
// -----------------------------------------------------------------------------
console.log('Testing Section 2: Math, Trigonometry, Constants & Operators...');
const mathInterp = new RaptorInterpreter();

// Constants
assert.strictEqual(mathInterp.evaluate('pi'), Math.PI);
assert.strictEqual(mathInterp.evaluate('Pi'), Math.PI);
assert.strictEqual(mathInterp.evaluate('PI'), Math.PI);
assert.strictEqual(mathInterp.evaluate('e'), Math.E);
assert.strictEqual(mathInterp.evaluate('E'), Math.E);
assert.strictEqual(mathInterp.evaluate('yes'), true);
assert.strictEqual(mathInterp.evaluate('no'), false);
assert.strictEqual(mathInterp.evaluate('true'), true);
assert.strictEqual(mathInterp.evaluate('false'), false);
assert.strictEqual(mathInterp.evaluate('filled'), 1);
assert.strictEqual(mathInterp.evaluate('unfilled'), 0);
assert.strictEqual(mathInterp.evaluate('left_button'), 0);
assert.strictEqual(mathInterp.evaluate('right_button'), 1);

// All 16 standard RAPTOR colors
assert.strictEqual(mathInterp.evaluate('Black'), 0);
assert.strictEqual(mathInterp.evaluate('Blue'), 1);
assert.strictEqual(mathInterp.evaluate('Green'), 2);
assert.strictEqual(mathInterp.evaluate('Cyan'), 3);
assert.strictEqual(mathInterp.evaluate('Red'), 4);
assert.strictEqual(mathInterp.evaluate('Magenta'), 5);
assert.strictEqual(mathInterp.evaluate('Brown'), 6);
assert.strictEqual(mathInterp.evaluate('Light_Gray'), 7);
assert.strictEqual(mathInterp.evaluate('Dark_Gray'), 8);
assert.strictEqual(mathInterp.evaluate('Light_Blue'), 9);
assert.strictEqual(mathInterp.evaluate('Light_Green'), 10);
assert.strictEqual(mathInterp.evaluate('Light_Cyan'), 11);
assert.strictEqual(mathInterp.evaluate('Light_Red'), 12);
assert.strictEqual(mathInterp.evaluate('Light_Magenta'), 13);
assert.strictEqual(mathInterp.evaluate('Yellow'), 14);
assert.strictEqual(mathInterp.evaluate('White'), 15);

// Arithmetic & Precedence
assert.strictEqual(mathInterp.evaluate('10 + 20 * 3'), 70);
assert.strictEqual(mathInterp.evaluate('(10 + 20) * 3'), 90);
assert.strictEqual(mathInterp.evaluate('10 / 2 * 5'), 25);
assert.strictEqual(mathInterp.evaluate('-4^2'), 16, 'RAPTOR unary minus before exponentiation');
assert.strictEqual(mathInterp.evaluate('-4**2'), 16);
assert.strictEqual(mathInterp.evaluate('-(4^2)'), -16);

// Mod and Rem semantics
assert.strictEqual(mathInterp.evaluate('14 rem 5'), 4);
assert.strictEqual(mathInterp.evaluate('14 mod 5'), 4);
assert.strictEqual(mathInterp.evaluate('-14 rem 5'), -4);
assert.strictEqual(mathInterp.evaluate('-14 mod 5'), 1);
assert.strictEqual(mathInterp.evaluate('14 rem -5'), 4);
assert.strictEqual(mathInterp.evaluate('14 mod -5'), -1);

// Trig functions in radians
assert(Math.abs(mathInterp.evaluate('sin(pi / 6)') - 0.5) < 1e-10);
assert(Math.abs(mathInterp.evaluate('cos(pi / 3)') - 0.5) < 1e-10);
assert(Math.abs(mathInterp.evaluate('tan(pi / 4)') - 1.0) < 1e-10);
assert(Math.abs(mathInterp.evaluate('cot(pi / 4)') - 1.0) < 1e-10);
assert(Math.abs(mathInterp.evaluate('arcsin(0.5)') - Math.PI / 6) < 1e-10);
assert(Math.abs(mathInterp.evaluate('arcos(0.5)') - Math.PI / 3) < 1e-10);
assert(Math.abs(mathInterp.evaluate('arccos(0.5)') - Math.PI / 3) < 1e-10);
assert(Math.abs(mathInterp.evaluate('arctan(10, 3)') - 1.2793) < 0.001);
assert(Math.abs(mathInterp.evaluate('arccot(10, 3)') - 0.29145) < 0.001);

// Hyperbolic functions
assert(Math.abs(mathInterp.evaluate('sinh(0)')) < 1e-10);
assert(Math.abs(mathInterp.evaluate('cosh(0)') - 1.0) < 1e-10);
assert(Math.abs(mathInterp.evaluate('tanh(0)')) < 1e-10);

// Logarithms: log in RAPTOR is natural log (ln)
assert.strictEqual(mathInterp.evaluate('log(e)'), 1);
assert.strictEqual(mathInterp.evaluate('ln(e)'), 1);
assert.strictEqual(mathInterp.evaluate('log10(100)'), 2);

// Powermod
assert.strictEqual(mathInterp.evaluate('powermod(2, 10, 1000)'), 24);

console.log('✓ Section 2 Passed!');

// -----------------------------------------------------------------------------
// SECTION 3: 1D AND 2D ARRAYS & TYPE PREDICATES
// -----------------------------------------------------------------------------
console.log('Testing Section 3: 1D & 2D Arrays, Length_of, and Type Checking...');
const arrInterp = new RaptorInterpreter();

// 1D array auto-expansion with 1-based indexing
arrInterp.setVariable('Scores[4]', 95);
const scores = arrInterp.variables['Scores'];
assert.strictEqual(scores.length, 5);
assert.strictEqual(scores[1], 0);
assert.strictEqual(scores[2], 0);
assert.strictEqual(scores[3], 0);
assert.strictEqual(scores[4], 95);
assert.strictEqual(arrInterp.evaluate('Scores[4]'), 95);
assert.strictEqual(arrInterp.evaluate('Length_of(Scores)'), 4);
assert.strictEqual(arrInterp.evaluate('Is_Array(Scores)'), true);
assert.strictEqual(arrInterp.evaluate('Is_2D_Array(Scores)'), false);

// 2D array: Matrix[r, c] and Matrix(r, c)
arrInterp.setVariable('Matrix[2, 3]', 42);
const matrix = arrInterp.variables['Matrix'];
assert.strictEqual(matrix[2][3], 42);
assert.strictEqual(matrix[1][1], 0);
assert.strictEqual(arrInterp.evaluate('Matrix[2, 3]'), 42);
assert.strictEqual(arrInterp.evaluate('Matrix(2, 3)'), 42);
assert.strictEqual(arrInterp.evaluate('Length_of(Matrix)'), 2);
assert.strictEqual(arrInterp.evaluate('Length_of(Matrix, 2)'), 3);
assert.strictEqual(arrInterp.evaluate('Is_Array(Matrix)'), true);
assert.strictEqual(arrInterp.evaluate('Is_Array2D(Matrix)'), true);
assert.strictEqual(arrInterp.evaluate('Is_2D_Array(Matrix)'), true);

// String Length_of
assert.strictEqual(arrInterp.evaluate('Length_of("Hello World")'), 11);
assert.strictEqual(arrInterp.evaluate('Length_Of("Hello World")'), 11);

// Type conversions
assert.strictEqual(arrInterp.evaluate('To_Integer("456")'), 456);
assert.strictEqual(arrInterp.evaluate('To_Float("78.9")'), 78.9);
assert.strictEqual(arrInterp.evaluate('To_Real("78.9")'), 78.9);
assert.strictEqual(arrInterp.evaluate('To_Ascii("A")'), 65);
assert.strictEqual(arrInterp.evaluate('To_Character(65)'), 'A');
assert.strictEqual(arrInterp.evaluate('String_Of(1234)'), '1234');

// Type checks
assert.strictEqual(arrInterp.evaluate('Is_Number(100)'), true);
assert.strictEqual(arrInterp.evaluate('Is_Number("100")'), false);
assert.strictEqual(arrInterp.evaluate('Is_String("RAPTOR")'), true);
assert.strictEqual(arrInterp.evaluate('Is_Character("Z")'), true);
assert.strictEqual(arrInterp.evaluate('Is_Character("ZZ")'), false);

console.log('✓ Section 3 Passed!');

// -----------------------------------------------------------------------------
// SECTION 4: PROCEDURES WITH IN, OUT, AND IN/OUT PARAMETERS & LOCAL SCOPE
// -----------------------------------------------------------------------------
console.log('Testing Section 4: Procedures, Subcharts, Parameter Passing & Scope...');
const complexProcFlowchart = {
  title: 'SwapAndSquare',
  tabs: [
    {
      name: 'main',
      nodes: [
        { id: 'm1', type: 'assignment', variable: 'A', expression: '5' },
        { id: 'm2', type: 'assignment', variable: 'B', expression: '10' },
        { id: 'm3', type: 'assignment', variable: 'C', expression: '0' },
        { id: 'm4', type: 'call', callName: 'ComputeAndSwap(A, B, C)' },
        { id: 'm5', type: 'output', expression: 'A + " " + B + " " + C', endLine: true }
      ]
    },
    {
      name: 'ComputeAndSwap',
      parameters: [
        { name: 'X', type: 'in out' },
        { name: 'Y', type: 'in out' },
        { name: 'Z', type: 'out' }
      ],
      nodes: [
        // Calculate Z = X * Y = 5 * 10 = 50
        { id: 'p1', type: 'assignment', variable: 'Z', expression: 'X * Y' },
        // Swap X and Y using a temporary local variable Temp
        { id: 'p2', type: 'assignment', variable: 'Temp', expression: 'X' },
        { id: 'p3', type: 'assignment', variable: 'X', expression: 'Y' },
        { id: 'p4', type: 'assignment', variable: 'Y', expression: 'Temp' }
      ]
    }
  ]
};

const consoleOutputs = [];
const procTester = new RaptorInterpreter({
  onConsoleOutput: (text, type, options) => {
    consoleOutputs.push({ text, type, options });
  }
});

const runner = procTester.createExecutionGenerator(complexProcFlowchart);
let step = runner.next();
while (!step.done) {
  step = runner.next();
}

// Check variables after execution
assert.strictEqual(procTester.variables['A'], 10, 'A must be swapped to 10');
assert.strictEqual(procTester.variables['B'], 5, 'B must be swapped to 5');
assert.strictEqual(procTester.variables['C'], 50, 'C must receive out parameter value 50');
assert.strictEqual(procTester.variables['Temp'], undefined, 'Local variable Temp in procedure must not leak into caller scope');

const outputLine = consoleOutputs.find(o => o.type === 'output');
assert(outputLine, 'Output line must be present');
assert.strictEqual(outputLine.text, '10 5 50');

console.log('✓ Section 4 Passed!');

// -----------------------------------------------------------------------------
// SECTION 5: BUILTIN PROCEDURES METADATA AND REGISTRATION
// -----------------------------------------------------------------------------
console.log('Testing Section 5: Builtin procedure signatures and docs...');
const findProc = (name) => BUILTIN_PROCEDURES_INFO.find(p => p.name.toLowerCase() === name.toLowerCase());
assert(findProc('open_graph_window') !== undefined);
assert(findProc('draw_arc') !== undefined);
assert(findProc('flood_fill') !== undefined);
assert(findProc('load_bitmap') !== undefined);
assert(findProc('draw_bitmap') !== undefined);
assert(findProc('get_mouse_button') !== undefined);
assert(findProc('wait_for_mouse_button') !== undefined);
assert(findProc('wait_for_key') !== undefined);

// Ensure Load_Bitmap and Draw_Bitmap work cleanly
const bmpInterp = new RaptorInterpreter();
const lbProc = parseCallStatement("Load_Bitmap('character.png', HeroSprite)");
Array.from(bmpInterp.executeBuiltinProcedure(lbProc.name.toLowerCase(), lbProc.args));
assert(bmpInterp.variables['HeroSprite'] !== undefined);
assert.strictEqual(bmpInterp.variables['HeroSprite'].isBitmap, true);
assert.strictEqual(bmpInterp.variables['HeroSprite'].src, 'character.png');

console.log('✓ Section 5 Passed!');

console.log('================================================================');
console.log('ALL TESTS IN PASS 2 COMPLETED SUCCESSFULLY WITH ZERO ERRORS!');
console.log('================================================================');
