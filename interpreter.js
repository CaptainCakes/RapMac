/**
 * RAPTOR Flowchart Runtime & Expression Engine
 * Supports:
 * - Step-by-step and continuous execution
 * - Speed control
 * - Subchart calls (call stack)
 * - Variable watch inspector (scalars, 1D & 2D arrays)
 * - Master console with Clear_Console
 * - Interactive input prompt dialog
 * - Complete RAPTOR math, string, and relational expressions
 * - Complete RAPTORGraph procedures and query functions
 * - Keyboard & mouse query functions & procedures
 * - 1-based arrays with auto-initialization to 0
 */

const RAPTOR_COLORS = [
  '#000000', // 0: Black
  '#000080', // 1: Blue
  '#008000', // 2: Green
  '#008080', // 3: Cyan
  '#800000', // 4: Red
  '#800080', // 5: Magenta
  '#808000', // 6: Brown
  '#ACACAC', // 7: Light_Gray
  '#4F4F4F', // 8: Dark_Gray
  '#0000FF', // 9: Light_Blue
  '#00FF00', // 10: Light_Green
  '#00FFFF', // 11: Light_Cyan
  '#FF0000', // 12: Light_Red
  '#FF00FF', // 13: Light_Magenta
  '#FFFF00', // 14: Yellow
  '#FFFFFF', // 15: White
];

const COLOR_NAMES_MAP = {
  black: 0,
  blue: 1,
  green: 2,
  cyan: 3,
  red: 4,
  magenta: 5,
  brown: 6,
  light_gray: 7,
  dark_gray: 8,
  light_blue: 9,
  light_green: 10,
  light_cyan: 11,
  light_red: 12,
  light_magenta: 13,
  yellow: 14,
  white: 15,
};

const BUILTIN_PROCEDURES = new Set([
  'delay_for',
  'clear_console',
  'wait_for_key',
  'wait_for_mouse_button',
  'get_mouse_button',
  'open_graph_window',
  'close_graph_window',
  'clear_window',
  'put_pixel',
  'draw_line',
  'draw_box',
  'draw_circle',
  'draw_ellipse',
  'draw_ellipse_rotate',
  'draw_arc',
  'flood_fill',
  'display_text',
  'display_number',
  'set_window_title',
  'set_font_size',
  'freeze_graph_window',
  'unfreeze_graph_window',
  'update_graph_window',
  'set_precision',
  'load_bitmap',
  'draw_bitmap',
  'redirect_input',
  'redirect_output',
  'redirect_output_append'
]);

const BUILTIN_PROCEDURES_INFO = [
  { name: 'Clear_Console', signature: 'Clear_Console', description: 'Clears all output from the MasterConsole.' },
  { name: 'Delay_For', signature: 'Delay_For(seconds)', description: 'Pauses program execution for specified number of seconds.' },
  { name: 'Wait_For_Key', signature: 'Wait_For_Key', description: 'Waits until any keyboard key is pressed.' },
  { name: 'Wait_For_Mouse_Button', signature: 'Wait_For_Mouse_Button(Which_Button)', description: 'Waits until mouse button (Left_Button or Right_Button) is clicked.' },
  { name: 'Get_Mouse_Button', signature: 'Get_Mouse_Button(Which_Button, X, Y)', description: 'Waits for mouse click and stores X, Y in variables.' },
  { name: 'Open_Graph_Window', signature: 'Open_Graph_Window(X_Size, Y_Size)', description: 'Opens a graphics window of specified dimensions.' },
  { name: 'Close_Graph_Window', signature: 'Close_Graph_Window', description: 'Closes the graphics window.' },
  { name: 'Clear_Window', signature: 'Clear_Window(Color)', description: 'Clears the graphics window with specified color.' },
  { name: 'Put_Pixel', signature: 'Put_Pixel(X, Y, Color)', description: 'Draws a single pixel.' },
  { name: 'Draw_Line', signature: 'Draw_Line(X1, Y1, X2, Y2, Color)', description: 'Draws a line from (X1, Y1) to (X2, Y2).' },
  { name: 'Draw_Box', signature: 'Draw_Box(X1, Y1, X2, Y2, Color, Filled)', description: 'Draws a rectangle between opposite corners.' },
  { name: 'Draw_Circle', signature: 'Draw_Circle(X, Y, Radius, Color, Filled)', description: 'Draws a circle at (X, Y) with radius.' },
  { name: 'Draw_Ellipse', signature: 'Draw_Ellipse(X1, Y1, X2, Y2, Color, Filled)', description: 'Draws an ellipse inside bounding box.' },
  { name: 'Draw_Ellipse_Rotate', signature: 'Draw_Ellipse_Rotate(X1, Y1, X2, Y2, Angle, Color, Filled)', description: 'Draws a rotated ellipse.' },
  { name: 'Draw_Arc', signature: 'Draw_Arc(X1, Y1, X2, Y2, StartX, StartY, EndX, EndY, Color)', description: 'Draws an arc portion of an ellipse.' },
  { name: 'Load_Bitmap', signature: 'Load_Bitmap(Filename, Bitmap_Variable)', description: 'Loads an image file into a bitmap variable.' },
  { name: 'Draw_Bitmap', signature: 'Draw_Bitmap(Bitmap, X, Y, Width, Height)', description: 'Draws an image at (X, Y).' },
  { name: 'Flood_Fill', signature: 'Flood_Fill(X, Y, Color)', description: 'Fills an enclosed region starting at (X, Y).' },
  { name: 'Display_Text', signature: 'Display_Text(X, Y, Text, Color)', description: 'Draws text string at (X, Y).' },
  { name: 'Display_Number', signature: 'Display_Number(X, Y, Number, Color)', description: 'Draws a numeric value as text at (X, Y).' },
  { name: 'Set_Window_Title', signature: 'Set_Window_Title(Title)', description: 'Sets the graphics window title.' },
  { name: 'Set_Font_Size', signature: 'Set_Font_Size(Height_in_pixels)', description: 'Sets graphics font height in pixels.' },
  { name: 'Freeze_Graph_Window', signature: 'Freeze_Graph_Window', description: 'Disables automatic screen updates for animation.' },
  { name: 'Unfreeze_Graph_Window', signature: 'Unfreeze_Graph_Window', description: 'Re-enables updates and refreshes the graphics window.' },
  { name: 'Update_Graph_Window', signature: 'Update_Graph_Window', description: 'Synchronously refreshes graphics window.' }
];

function isBuiltinProcedure(name) {
  if (!name) return false;
  const lower = String(name).trim().toLowerCase();
  return BUILTIN_PROCEDURES.has(lower);
}

function parseCallStatement(callStr) {
  const trimmed = (callStr || '').trim();
  const parenIdx = trimmed.indexOf('(');
  if (parenIdx === -1) {
    return { name: trimmed, args: [] };
  }
  const name = trimmed.substring(0, parenIdx).trim();
  let argsStr = trimmed.substring(parenIdx + 1).trim();
  if (argsStr.endsWith(')')) {
    argsStr = argsStr.slice(0, -1).trim();
  }
  if (!argsStr) {
    return { name, args: [] };
  }
  const args = [];
  let cur = '';
  let inQuote = false;
  let quoteChar = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (inQuote) {
      cur += ch;
      if (ch === quoteChar && argsStr[i - 1] !== '\\') {
        inQuote = false;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
      cur += ch;
    } else if (ch === '(') {
      parenDepth++;
      cur += ch;
    } else if (ch === ')') {
      parenDepth--;
      cur += ch;
    } else if (ch === '[') {
      bracketDepth++;
      cur += ch;
    } else if (ch === ']') {
      bracketDepth--;
      cur += ch;
    } else if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
      args.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) {
    args.push(cur.trim());
  }
  return { name, args };
}

function raptorRem(x, y) {
  if (y === 0) throw new Error("Division by zero in rem");
  return x % y;
}

function raptorMod(x, y) {
  if (y === 0) throw new Error("Division by zero in mod");
  let r = x % y;
  if ((r > 0 && y < 0) || (r < 0 && y > 0)) {
    r += y;
  }
  return r;
}

function raptorPowermod(base, exp, mod) {
  if (mod === 0) throw new Error("Modulus cannot be 0 in powermod");
  try {
    let b = BigInt(Math.floor(base));
    let e = BigInt(Math.floor(exp));
    let m = BigInt(Math.floor(mod));
    let res = 1n;
    b = b % m;
    while (e > 0n) {
      if (e % 2n === 1n) res = (res * b) % m;
      e = e / 2n;
      b = (b * b) % m;
    }
    return Number(res);
  } catch (err) {
    return Math.pow(base, exp) % mod;
  }
}

class RaptorInterpreter {
  constructor(options = {}) {
    this.options = options;
    this.variables = {}; // { varName: value }
    this.callStack = []; // Stack frames for procedure calls: [{ tabName, callerVars, callArgs, params }]
    this.status = 'idle'; // 'idle' | 'running' | 'paused' | 'waiting_input' | 'finished' | 'error'
    this.generator = null;
    this.timer = null;
    this.speedMs = (options && options.speedMs !== undefined) ? Number(options.speedMs) : 400;
    this.activeNodeId = null;
    this.currentTab = 'main';

    // RAPTORGraph State
    this.graphOpen = false;
    this.graphWidth = 600;
    this.graphHeight = 400;
    this.graphTitle = 'RAPTORGraph';
    this.graphFontSize = 14;
    this.graphPixels = null; // Uint8Array or mock matrix
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseButtonsDown = [false, false, false];
    this.mouseButtonsPressed = [false, false, false];
    this.mouseButtonsReleased = [false, false, false];

    // Keyboard buffer
    this.keyBuffer = []; // [{ code: number, char: string }]
    this.keysDownMap = {};
    this.waitingForKey = null;
    this.waitingForMouse = null;

    // Execution Callbacks
    this.onNodeHighlight = options.onNodeHighlight || (() => {});
    this.onVariableChange = options.onVariableChange || (() => {});
    this.onConsoleOutput = options.onConsoleOutput || (() => {});
    this.onInputRequest = options.onInputRequest || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onTabChange = options.onTabChange || (() => {});
    this.onGraphWindow = options.onGraphWindow || (() => {});
  }

  clearExecutionTimer() {
    if (this.timer !== null && this.timer !== undefined) {
      if (typeof this.timer === 'object' && typeof clearImmediate === 'function') {
        try { clearImmediate(this.timer); } catch (e) {}
      }
      try { clearTimeout(this.timer); } catch (e) {}
      this.timer = null;
    }
  }

  setSpeed(speedMs) {
    this.speedMs = Math.max(0, Math.min(2000, Number(speedMs) || 0));
  }

  reset() {
    this.clearExecutionTimer();
    this.status = 'idle';
    this.lastError = null;
    this.variables = {};
    this.callStack = [];
    this.generator = null;
    this.activeNodeId = null;
    this.waitingForKey = null;
    this.waitingForMouse = null;
    this.onNodeHighlight(null);
    this.onVariableChange({});
    this.onStatusChange(this.status);
  }

  getWatchVariables() {
    if (this.callStack && this.callStack.length > 0) {
      const merged = {};
      for (const frame of this.callStack) {
        if (frame.callerVars) {
          for (const k of Object.keys(frame.callerVars)) {
            merged[k] = frame.callerVars[k];
          }
        }
      }
      for (const k of Object.keys(this.variables)) {
        merged[k] = this.variables[k];
      }
      return merged;
    }
    return { ...this.variables };
  }

  // Keyboard events
  handleKeyDown(e) {
    const code = e.keyCode || (e.key ? e.key.charCodeAt(0) : 0);
    const char = e.key && e.key.length === 1 ? e.key : '';
    this.keyBuffer.push({ code, char });
    this.keysDownMap[code] = true;
    if (e.key) this.keysDownMap[e.key.toLowerCase()] = true;

    if (this.waitingForKey) {
      const cb = this.waitingForKey;
      this.waitingForKey = null;
      cb();
    }
  }

  handleKeyUp(e) {
    const code = e.keyCode || (e.key ? e.key.charCodeAt(0) : 0);
    this.keysDownMap[code] = false;
    if (e.key) this.keysDownMap[e.key.toLowerCase()] = false;
  }

  // Mouse events
  handleMouseMove(x, y) {
    this.mouseX = Math.floor(x);
    this.mouseY = Math.floor(y);
  }

  handleMouseDown(btn, x, y) {
    const b = (btn === 2) ? 1 : 0; // RAPTOR: Left_Button=0, Right_Button=1
    this.mouseButtonsDown[b] = true;
    this.mouseButtonsPressed[b] = true;
    this.mouseX = Math.floor(x);
    this.mouseY = Math.floor(y);

    if (this.waitingForMouse) {
      const cb = this.waitingForMouse;
      this.waitingForMouse = null;
      cb({ button: b, x: this.mouseX, y: this.mouseY });
    }
  }

  handleMouseUp(btn, x, y) {
    const b = (btn === 2) ? 1 : 0;
    this.mouseButtonsDown[b] = false;
    this.mouseButtonsReleased[b] = true;
    this.mouseX = Math.floor(x);
    this.mouseY = Math.floor(y);
  }

  resolveColor(colorVal) {
    if (colorVal === null || colorVal === undefined) return RAPTOR_COLORS[0];
    if (typeof colorVal === 'number') {
      const idx = Math.floor(colorVal);
      if (idx >= 0 && idx < RAPTOR_COLORS.length) {
        return RAPTOR_COLORS[idx];
      }
      return RAPTOR_COLORS[0];
    }
    const str = String(colorVal).trim().toLowerCase();
    if (COLOR_NAMES_MAP[str] !== undefined) {
      return RAPTOR_COLORS[COLOR_NAMES_MAP[str]];
    }
    return String(colorVal);
  }

  getClosestColor(r, g, b) {
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < RAPTOR_COLORS.length; i++) {
      const hex = RAPTOR_COLORS[i].replace('#', '');
      const cr = parseInt(hex.substring(0, 2), 16);
      const cg = parseInt(hex.substring(2, 4), 16);
      const cb = parseInt(hex.substring(4, 6), 16);
      const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  getGraphPixel(x, y) {
    if (this.options.getPixelCallback) {
      return this.options.getPixelCallback(x, y);
    }
    return 0; // Default black
  }

  // Evaluate RAPTOR Expression
  evaluate(expr) {
    if (expr === null || expr === undefined) return '';
    let trimmed = String(expr).trim();
    if (trimmed === '') return '';

    // Transform RAPTOR expression syntax to JS
    const transformed = this.transformExpression(trimmed);

    // Create sandbox scope from current variables (and outer scopes if inside a procedure)
    let activeVars = this.variables;
    if (this.callStack && this.callStack.length > 0) {
      activeVars = {};
      for (const frame of this.callStack) {
        if (frame.callerVars) {
          for (const k of Object.keys(frame.callerVars)) {
            activeVars[k] = frame.callerVars[k];
          }
        }
      }
      for (const k of Object.keys(this.variables)) {
        activeVars[k] = this.variables[k];
      }
    }
    const scopeKeys = Object.keys(activeVars);
    const scopeVals = scopeKeys.map(k => activeVars[k]);

    // Complete RAPTOR built-in mathematical, procedural & utility functions
    const helpers = {
      // Standard Math
      sqrt: Math.sqrt,
      abs: Math.abs,
      floor: Math.floor,
      Floor: Math.floor,
      ceiling: Math.ceil,
      Ceiling: Math.ceil,
      ceil: Math.ceil,
      round: Math.round,
      Round: Math.round,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      cot: (x) => 1 / Math.tan(x),
      arcsin: Math.asin,
      arccos: Math.acos,
      arcos: Math.acos,
      Arcos: Math.acos,
      arctan: (y, x) => (x !== undefined ? Math.atan2(y, x) : Math.atan(y)),
      arccot: (x, y) => (y !== undefined ? Math.atan2(y, x) : Math.PI / 2 - Math.atan(x)),
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      arcsinh: Math.asinh,
      arccosh: Math.acosh,
      arctanh: Math.atanh,
      log: Math.log, // natural logarithm in RAPTOR!
      ln: Math.log,
      log10: Math.log10,
      min: Math.min,
      max: Math.max,
      powermod: raptorPowermod,

      // Random generator
      random: (first, last) => {
        if (first !== undefined && last !== undefined) {
          const min = Math.min(first, last);
          const max = Math.max(first, last);
          return Math.floor(Math.random() * (max - min + 1)) + min;
        } else if (first !== undefined) {
          return Math.floor(Math.random() * first) + 1;
        }
        return Math.random();
      },
      Random: Math.random(),

      // Constants
      pi: Math.PI,
      Pi: Math.PI,
      PI: Math.PI,
      e: Math.E,
      E: Math.E,
      yes: true,
      no: false,
      filled: 1,
      Filled: 1,
      unfilled: 0,
      Unfilled: 0,
      left_button: 0,
      Left_Button: 0,
      right_button: 1,
      Right_Button: 1,

      // Colors
      black: 0, Black: 0,
      blue: 1, Blue: 1,
      green: 2, Green: 2,
      cyan: 3, Cyan: 3,
      red: 4, Red: 4,
      magenta: 5, Magenta: 5,
      brown: 6, Brown: 6,
      light_gray: 7, Light_Gray: 7,
      dark_gray: 8, Dark_Gray: 8,
      light_blue: 9, Light_Blue: 9,
      light_green: 10, Light_Green: 10,
      light_cyan: 11, Light_Cyan: 11,
      light_red: 12, Light_Red: 12,
      light_magenta: 13, Light_Magenta: 13,
      yellow: 14, Yellow: 14,
      white: 15, White: 15,
      random_color: () => Math.floor(Math.random() * 16),
      Random_Color: () => Math.floor(Math.random() * 16),
      random_extended_color: () => Math.floor(Math.random() * 242),
      Random_Extended_Color: () => Math.floor(Math.random() * 242),

      // String and Array length (1-based semantics)
      Length_Of: (val, dim = 1) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'string') return val.length;
        if (Array.isArray(val)) {
          if (dim === 2) {
            let maxCols = 0;
            for (let i = 1; i < val.length; i++) {
              if (Array.isArray(val[i])) {
                maxCols = Math.max(maxCols, val[i].length > 1 ? val[i].length - 1 : 0);
              }
            }
            return maxCols;
          }
          return val.length > 1 ? val.length - 1 : (val.length === 1 && val[0] !== undefined ? 1 : 0);
        }
        return String(val).length;
      },
      length_of: (val, dim = 1) => helpers.Length_Of(val, dim),

      // Type checks from RAPTOR
      Is_Array: (v) => Array.isArray(v),
      is_array: (v) => Array.isArray(v),
      Is_Array2D: (v) => Array.isArray(v) && v.some(r => Array.isArray(r)),
      is_array2d: (v) => Array.isArray(v) && v.some(r => Array.isArray(r)),
      Is_2D_Array: (v) => Array.isArray(v) && v.some(r => Array.isArray(r)),
      is_2d_array: (v) => Array.isArray(v) && v.some(r => Array.isArray(r)),
      Is_Number: (v) => typeof v === 'number' && !isNaN(v),
      is_number: (v) => typeof v === 'number' && !isNaN(v),
      Is_String: (v) => typeof v === 'string',
      is_string: (v) => typeof v === 'string',
      Is_Character: (v) => typeof v === 'string' && v.length === 1,
      is_character: (v) => typeof v === 'string' && v.length === 1,
      To_Integer: (v) => Math.floor(Number(v)),
      to_integer: (v) => Math.floor(Number(v)),
      to_ascii: (ch) => (String(ch).length > 0 ? String(ch).charCodeAt(0) : 0),
      To_Ascii: (ch) => (String(ch).length > 0 ? String(ch).charCodeAt(0) : 0),
      to_character: (code) => String.fromCharCode(Number(code)),
      To_Character: (code) => String.fromCharCode(Number(code)),
      To_Float: (v) => Number(v),
      to_float: (v) => Number(v),
      To_Real: (v) => Number(v),
      to_real: (v) => Number(v),
      String_Of: (v) => String(v),
      string_of: (v) => String(v),
      To_String: (v) => String(v),
      to_string: (v) => String(v),

      // RAPTORGraph query functions
      is_open: () => this.graphOpen,
      Is_Open: () => this.graphOpen,
      get_window_width: () => this.graphWidth,
      Get_Window_Width: () => this.graphWidth,
      get_window_height: () => this.graphHeight,
      Get_Window_Height: () => this.graphHeight,
      get_max_width: () => (typeof window !== 'undefined' && window.screen ? window.screen.width : 1920),
      Get_Max_Width: () => (typeof window !== 'undefined' && window.screen ? window.screen.width : 1920),
      get_max_height: () => (typeof window !== 'undefined' && window.screen ? window.screen.height : 1080),
      Get_Max_Height: () => (typeof window !== 'undefined' && window.screen ? window.screen.height : 1080),
      get_pixel: (x, y) => this.getGraphPixel(x, y),
      Get_Pixel: (x, y) => this.getGraphPixel(x, y),
      closest_color: (r, g, b) => this.getClosestColor(r, g, b),
      Closest_Color: (r, g, b) => this.getClosestColor(r, g, b),

      // Mouse & Keyboard query functions
      key_hit: () => this.keyBuffer.length > 0,
      Key_Hit: () => this.keyBuffer.length > 0,
      get_key: () => (this.keyBuffer.length > 0 ? this.keyBuffer.shift().code : 0),
      Get_Key: () => (this.keyBuffer.length > 0 ? this.keyBuffer.shift().code : 0),
      get_key_string: () => (this.keyBuffer.length > 0 ? this.keyBuffer.shift().char : ''),
      Get_Key_String: () => (this.keyBuffer.length > 0 ? this.keyBuffer.shift().char : ''),
      key_down: (k) => Boolean(this.keysDownMap[typeof k === 'string' ? k.toLowerCase() : k]),
      Key_Down: (k) => Boolean(this.keysDownMap[typeof k === 'string' ? k.toLowerCase() : k]),
      get_mouse_x: () => this.mouseX,
      Get_Mouse_X: () => this.mouseX,
      get_mouse_y: () => this.mouseY,
      Get_Mouse_Y: () => this.mouseY,
      mouse_button_pressed: (btn) => Boolean(this.mouseButtonsPressed[btn || 0]),
      Mouse_Button_Pressed: (btn) => Boolean(this.mouseButtonsPressed[btn || 0]),
      mouse_button_released: (btn) => Boolean(this.mouseButtonsReleased[btn || 0]),
      Mouse_Button_Released: (btn) => Boolean(this.mouseButtonsReleased[btn || 0]),
      mouse_button_down: (btn) => Boolean(this.mouseButtonsDown[btn || 0]),
      Mouse_Button_Down: (btn) => Boolean(this.mouseButtonsDown[btn || 0]),

      // Operators helpers
      __raptor_rem: raptorRem,
      __raptor_mod: raptorMod,
      __raptor_xor: (a, b) => (Boolean(a) !== Boolean(b)),
      __raptor_eq: (a, b) => {
        if (a === b) return true;
        if (typeof a === 'string' && typeof b === 'string') {
          return a.toLowerCase() === b.toLowerCase();
        }
        if (typeof a === 'boolean' && typeof b === 'string') {
          const bLower = b.trim().toLowerCase();
          if (a === false && (bLower === 'false' || bLower === 'no')) return true;
          if (a === true && (bLower === 'true' || bLower === 'yes')) return true;
        }
        if (typeof b === 'boolean' && typeof a === 'string') {
          const aLower = a.trim().toLowerCase();
          if (b === false && (aLower === 'false' || aLower === 'no')) return true;
          if (b === true && (aLower === 'true' || aLower === 'yes')) return true;
        }
        if (a == b) return true;
        return false;
      },
      __raptor_neq: (a, b) => {
        if (a === b) return false;
        if (typeof a === 'string' && typeof b === 'string') {
          return a.toLowerCase() !== b.toLowerCase();
        }
        if (typeof a === 'boolean' && typeof b === 'string') {
          const bLower = b.trim().toLowerCase();
          if (a === false && (bLower === 'false' || bLower === 'no')) return false;
          if (a === true && (bLower === 'true' || bLower === 'yes')) return false;
        }
        if (typeof b === 'boolean' && typeof a === 'string') {
          const aLower = a.trim().toLowerCase();
          if (b === false && (aLower === 'false' || aLower === 'no')) return false;
          if (b === true && (aLower === 'true' || aLower === 'yes')) return false;
        }
        if (a == b) return false;
        return true;
      }
    };

    const helperKeys = Object.keys(helpers);
    const helperVals = helperKeys.map(k => helpers[k]);

    try {
      const fn = new Function(...scopeKeys, ...helperKeys, `"use strict"; return (${transformed});`);
      const result = fn(...scopeVals, ...helperVals);
      if (typeof result === 'number') {
        if (!isFinite(result)) {
          throw new Error('Division by zero or arithmetic overflow.');
        }
        if (isNaN(result) && !trimmed.toLowerCase().includes('nan')) {
          throw new Error('Invalid arithmetic calculation (NaN) or array index out of bounds.');
        }
      }
      return result;
    } catch (err) {
      throw new Error(`Error evaluating "${expr}": ${err.message}`);
    }
  }

  // Tokenize & transform RAPTOR operators
  transformExpression(expr) {
    // 1. Preserve string literals while replacing operators
    const stringLiterals = [];
    let masked = expr.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
      stringLiterals.push(match);
      return `___STR_${stringLiterals.length - 1}___`;
    });

    // 2. Handle 2D array syntax: matrix[r, c] -> matrix[r][c]
    masked = masked.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\[([^,\]]+),\s*([^\]]+)\]/g, '$1[$2][$3]');

    // Handle round parentheses indexing matrix(r, c) or arr(i) for known array variables
    const activeVarMap = this.getWatchVariables ? this.getWatchVariables() : this.variables;
    if (activeVarMap) {
      for (const varName of Object.keys(activeVarMap)) {
        if (Array.isArray(activeVarMap[varName])) {
          // 2D: varName(r, c) -> varName[r][c]
          const arr2DRegex = new RegExp(`\\b${varName}\\s*\\(([^,()]+),\\s*([^,()]+)\\)`, 'gi');
          masked = masked.replace(arr2DRegex, `${varName}[$1][$2]`);
          // 1D: varName(i) -> varName[i]
          const arr1DRegex = new RegExp(`\\b${varName}\\s*\\(([^,()]+)\\)`, 'gi');
          masked = masked.replace(arr1DRegex, `${varName}[$1]`);
        }
      }
    }

    // 3. RAPTOR Boolean literals: yes -> true, no -> false
    masked = masked.replace(/\byes\b/gi, 'true');
    masked = masked.replace(/\bno\b/gi, 'false');

    // 4. Transform relational operators in single pass: = is ===, /=, !=, <> are !==
    masked = masked.replace(/(<=|>=|<>|\/=|!==|!=|===|==|=)/g, (match) => {
      switch (match) {
        case '<>':
        case '/=':
        case '!=':
        case '!==':
          return ' !== ';
        case '<=':
          return ' <= ';
        case '>=':
          return ' >= ';
        case '=':
        case '==':
        case '===':
          return ' === ';
        default:
          return match;
      }
    });

    // String equality transformation for case-insensitive and boolean-coerced comparisons
    masked = masked.replace(/([a-zA-Z0-9_.\[\]\(\)]+)\s*===\s*(___STR_\d+___)/g, '__raptor_eq($1, $2)');
    masked = masked.replace(/(___STR_\d+___)\s*===\s*([a-zA-Z0-9_.\[\]\(\)]+)/g, '__raptor_eq($1, $2)');
    masked = masked.replace(/(___STR_\d+___)\s*===\s*(___STR_\d+___)/g, '__raptor_eq($1, $2)');
    masked = masked.replace(/([a-zA-Z0-9_.\[\]\(\)]+)\s*!==\s*(___STR_\d+___)/g, '__raptor_neq($1, $2)');
    masked = masked.replace(/(___STR_\d+___)\s*!==\s*([a-zA-Z0-9_.\[\]\(\)]+)/g, '__raptor_neq($1, $2)');
    masked = masked.replace(/(___STR_\d+___)\s*!==\s*(___STR_\d+___)/g, '__raptor_neq($1, $2)');

    // 5. Transform logical operators: and -> &&, or -> ||, not -> !
    masked = masked
      .replace(/\band\b/gi, ' && ')
      .replace(/\bor\b/gi, ' || ')
      .replace(/\bnot\b/gi, ' ! ')
      .replace(/\bxor\b/gi, ' !== ')
      .replace(/\^/g, ' ** ');

    // Unary minus with exponentiation: in RAPTOR -3**2 is (-3)**2 = 9
    masked = masked.replace(/(^|[+\-*/(,=<>!&|])\s*-\s*([a-zA-Z0-9_.]+(?:\[[^\]]+\]|\([^)]+\))?)\s*\*\*/g, '$1 (-$2) **');

    // 6. Transform mod and rem operators
    const opnd = '((?:[-+]?\\d+(?:\\.\\d+)?|[-+]?[a-zA-Z_][a-zA-Z0-9_]*(?:\\[[^\\]]+\\]|\\([^)]+\\))?))';
    const modRe = new RegExp(opnd + '\\s+\\bmod\\b\\s+' + opnd, 'gi');
    const remRe = new RegExp(opnd + '\\s+\\brem\\b\\s+' + opnd, 'gi');
    masked = masked.replace(modRe, '__raptor_mod($1, $2)');
    masked = masked.replace(remRe, '__raptor_rem($1, $2)');
    masked = masked.replace(/\bmod\b/gi, ' % ');
    masked = masked.replace(/\brem\b/gi, ' % ');

    // 7. Auto-call random() when used without parentheses (e.g. random * 6)
    masked = masked.replace(/\brandom\b(?!\s*[\(\w])/gi, 'random()');

    // 8. Normalize identifier case: variables in RAPTOR are case-insensitive
    const reserved = new Set([
      'sqrt', 'abs', 'floor', 'ceiling', 'ceil', 'round', 'sin', 'cos', 'tan', 'cot',
      'arcsin', 'arccos', 'arcos', 'arctan', 'arccot', 'sinh', 'cosh', 'tanh', 'arcsinh', 'arccosh', 'arctanh',
      'log', 'ln', 'log10', 'min', 'max', 'powermod', 'random', 'length_of',
      'is_array', 'is_array2d', 'is_2d_array', 'is_number', 'is_string', 'is_character',
      'to_integer', 'to_ascii', 'to_character', 'to_float', 'to_real', 'string_of', 'to_string',
      'load_bitmap', 'draw_bitmap',
      'is_open', 'get_window_width', 'get_window_height', 'get_max_width', 'get_max_height',
      'get_pixel', 'closest_color', 'key_hit', 'get_key', 'get_key_string', 'key_down',
      'get_mouse_x', 'get_mouse_y', 'mouse_button_pressed', 'mouse_button_released', 'mouse_button_down',
      'pi', 'e', 'true', 'false', 'yes', 'no', 'filled', 'unfilled', 'left_button', 'right_button',
      'black', 'blue', 'green', 'cyan', 'red', 'magenta', 'brown', 'light_gray', 'dark_gray',
      'light_blue', 'light_green', 'light_cyan', 'light_red', 'light_magenta', 'yellow', 'white',
      'random_color', 'random_extended_color', '__raptor_mod', '__raptor_rem', '__raptor_xor',
      '__raptor_eq', '__raptor_neq',
      'null', 'undefined'
    ]);

    masked = masked.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      const lower = match.toLowerCase();
      if (reserved.has(lower)) {
        return lower;
      }
      for (const key of Object.keys(this.variables)) {
        if (key.toLowerCase() === lower) {
          return key;
        }
      }
      return match;
    });

    // 9. Restore string literals
    masked = masked.replace(/___STR_(\d+)___/g, (_, idx) => stringLiterals[parseInt(idx, 10)]);

    return masked;
  }

  // Set variable value with 1-based indexing & auto-initialization to 0
  setVariable(name, value) {
    let trimmed = String(name || '').trim();
    if (!trimmed) return;

    if (trimmed.includes(':=') || trimmed.includes('<-')) {
      trimmed = trimmed.split(/:=|<-/)[0].trim();
    }

    // 2D Array assignment: matrix[r, c] or matrix[r][c] or matrix(r, c)
    const match2D = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\[([^,\]]+),\s*([^\]]+)\]|\[([^\]]+)\]\s*\[([^\]]+)\]|\(([^,\)]+),\s*([^)]+)\))$/);
    if (match2D) {
      const rawArrName = match2D[1];
      const arrName = this.findNormalizedKey(rawArrName) || rawArrName;
      const rExpr = match2D[2] !== undefined ? match2D[2] : (match2D[4] !== undefined ? match2D[4] : match2D[6]);
      const cExpr = match2D[3] !== undefined ? match2D[3] : (match2D[5] !== undefined ? match2D[5] : match2D[7]);
      const r = Math.floor(Number(this.evaluate(rExpr)));
      const c = Math.floor(Number(this.evaluate(cExpr)));

      if (isNaN(r) || isNaN(c) || r < 1 || c < 1) {
        throw new Error(`Invalid 2D array index [${rExpr}, ${cExpr}] for "${rawArrName}". Indices must be positive integers starting from 1.`);
      }

      const isNew = !this.variables[arrName] || !Array.isArray(this.variables[arrName]);
      if (isNew) {
        this.variables[arrName] = [];
      }

      const matrix = this.variables[arrName];
      for (let i = 1; i <= r; i++) {
        if (!Array.isArray(matrix[i])) {
          matrix[i] = [];
        }
        for (let j = 1; j <= c; j++) {
          if (matrix[i][j] === undefined) {
            matrix[i][j] = 0;
          }
        }
      }

      matrix[r][c] = value;
      this.onVariableChange({ ...this.variables });
      return;
    }

    // 1D Array assignment: arr[idx] or arr(idx)
    const match1D = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\[([^\]]+)\]|\(([^)]+)\))$/);
    if (match1D) {
      const rawArrName = match1D[1];
      const arrName = this.findNormalizedKey(rawArrName) || rawArrName;
      const idxExpr = match1D[2] !== undefined ? match1D[2] : match1D[3];
      const idx = Math.floor(Number(this.evaluate(idxExpr)));

      if (isNaN(idx) || idx < 1) {
        throw new Error(`Invalid array index [${idxExpr}] for "${rawArrName}". Indices must be positive integers starting from 1.`);
      }

      const isNew = !this.variables[arrName] || !Array.isArray(this.variables[arrName]);
      if (isNew) {
        this.variables[arrName] = [];
        for (let i = 1; i < idx; i++) {
          this.variables[arrName][i] = 0;
        }
      } else {
        for (let i = 1; i < idx; i++) {
          if (this.variables[arrName][i] === undefined) {
            this.variables[arrName][i] = 0;
          }
        }
      }

      this.variables[arrName][idx] = value;
      this.onVariableChange({ ...this.variables });
      return;
    }

    // Normal scalar variable
    const targetKey = this.findNormalizedKey(trimmed) || trimmed;
    this.variables[targetKey] = value;
    this.onVariableChange({ ...this.variables });
  }

  findNormalizedKey(keyName) {
    const lower = keyName.toLowerCase();
    for (const k of Object.keys(this.variables)) {
      if (k.toLowerCase() === lower) return k;
    }
    return null;
  }

  parseInput(raw) {
    if (raw === null || raw === undefined) return '';
    const trimmed = String(raw).trim();
    if (trimmed === '') return '';

    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    if (!isNaN(trimmed) && trimmed !== '') {
      return Number(trimmed);
    }

    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    return trimmed;
  }

  // Flowchart Generator Runner
  *createExecutionGenerator(flowchart) {
    let tabs = [];
    if (flowchart && Array.isArray(flowchart.tabs)) {
      tabs = flowchart.tabs;
    } else if (flowchart && flowchart.nodes) {
      tabs = [{ name: 'main', nodes: flowchart.nodes }];
      if (flowchart.subcharts) {
        for (const [name, sc] of Object.entries(flowchart.subcharts)) {
          tabs.push({ name, nodes: (sc && sc.nodes) || [] });
        }
      }
    }

    const tabsMap = {};
    for (const tab of tabs) {
      tabsMap[tab.name.toLowerCase()] = tab;
    }

    const mainTab = tabsMap['main'] || tabs[0];
    if (!mainTab) {
      this.onConsoleOutput('Error: No tabs found in flowchart.', 'error');
      return;
    }

    yield* this.runSubchart(mainTab, tabsMap);
  }

  *runSubchart(tab, tabsMap) {
    yield* this.runSubchartOrProcedure(tab, [], tabsMap);
  }

  *runSubchartOrProcedure(tab, callArgs = [], tabsMap) {
    this.currentTab = tab.name;
    this.onTabChange(tab.name);

    const isProcedure = Boolean(tab.isProcedure || (tab.parameters && tab.parameters.length > 0));

    if (!isProcedure) {
      // Standard Subchart: global shared variables
      yield {
        type: 'START',
        tabName: tab.name,
        nodeId: `${tab.name}_start`
      };
      yield* this.runNodeList(tab.nodes, tab.name, tabsMap);
      yield {
        type: 'END',
        tabName: tab.name,
        nodeId: `${tab.name}_end`
      };
      return;
    }

    // Procedure: Scoped execution with parameter passing (in, out, in/out)
    const params = tab.parameters || [];
    const callerVars = this.variables;
    const localVars = {};

    // 1. Evaluate arguments for IN and IN/OUT parameters in caller scope
    for (let i = 0; i < params.length; i++) {
      const p = params[i];
      const pName = typeof p === 'string' ? p : p.name;
      const pType = (typeof p === 'object' && p.type ? p.type : 'in').toLowerCase();
      const argExpr = callArgs[i];

      if (pType === 'in' || pType === 'in out' || pType === 'in/out') {
        if (argExpr !== undefined && argExpr !== '') {
          localVars[pName] = this.evaluate(argExpr);
        } else {
          localVars[pName] = 0;
        }
      } else {
        // Output parameter starts at 0
        localVars[pName] = 0;
      }
    }

    // 2. Push call stack frame
    this.callStack.push({
      tabName: tab.name,
      callerVars,
      callArgs,
      params
    });
    this.variables = localVars;
    this.onVariableChange(this.getWatchVariables());

    yield {
      type: 'START',
      tabName: tab.name,
      nodeId: `${tab.name}_start`
    };

    try {
      yield* this.runNodeList(tab.nodes, tab.name, tabsMap);
    } finally {
      // 3. Upon return, copy back OUT and IN/OUT parameters to caller's target variables
      this.callStack.pop();
      const currentLocals = this.variables;
      this.variables = callerVars;

      for (let i = 0; i < params.length; i++) {
        const p = params[i];
        const pName = typeof p === 'string' ? p : p.name;
        const pType = (typeof p === 'object' && p.type ? p.type : 'in').toLowerCase();
        const argTarget = (callArgs[i] || '').trim();

        if (pType === 'out' || pType === 'in out' || pType === 'in/out') {
          if (argTarget) {
            const finalVal = currentLocals[pName] !== undefined ? currentLocals[pName] : 0;
            this.setVariable(argTarget, finalVal);
          }
        }
      }

      this.onVariableChange(this.getWatchVariables());
    }

    yield {
      type: 'END',
      tabName: tab.name,
      nodeId: `${tab.name}_end`
    };
  }

  *runNodeList(nodes, tabName, tabsMap) {
    if (!nodes || !Array.isArray(nodes)) return;

    for (const node of nodes) {
      yield {
        type: 'NODE_BEFORE',
        tabName: tabName,
        node: node
      };

      switch (node.type) {
        case 'assignment': {
          let targetVar = (node.variable || '').trim();
          let expr = (node.expression || '').trim();
          if (!expr && (targetVar.includes(':=') || targetVar.includes('<-') || targetVar.includes('='))) {
            const parts = targetVar.split(/:=|<-|=/);
            targetVar = parts[0].trim();
            expr = parts.slice(1).join('=').trim();
          }
          const val = this.evaluate(expr);
          this.setVariable(targetVar, val);
          break;
        }

        case 'input': {
          let promptText = node.prompt !== undefined ? node.prompt : 'Enter a value:';
          if (node.promptType === 'expression') {
            try {
              promptText = String(this.evaluate(promptText));
            } catch (e) {
              // Keep raw if evaluation fails
            }
          } else {
            promptText = String(promptText);
          }

          const userInput = yield {
            type: 'INPUT_REQUEST',
            tabName: tabName,
            node: node,
            prompt: promptText,
            variable: node.variable
          };

          const parsed = this.parseInput(userInput);
          this.setVariable(node.variable, parsed);
          this.onConsoleOutput(`Input (${node.variable}): ${parsed}`, 'input');
          break;
        }

        case 'output': {
          let outputVal = '';
          if (node.outputType === 'text') {
            outputVal = String(node.expression !== undefined ? node.expression : '');
          } else {
            let expr = (node.expression || '').trim();
            if (!expr) {
              throw new Error('Output statement expression is empty.');
            }
            outputVal = String(this.evaluate(expr));
          }
          const endLine = node.endLine !== false;
          this.onConsoleOutput(outputVal, 'output', { endLine });
          break;
        }

        case 'call': {
          const rawCall = (node.callName || '').trim();
          const parsed = parseCallStatement(rawCall);
          const procName = parsed.name;
          const procLower = procName.toLowerCase();
          const procArgs = parsed.args;

          // 1. Check if built-in system procedure
          if (isBuiltinProcedure(procLower)) {
            yield* this.executeBuiltinProcedure(procLower, procArgs, node, tabName);
            break;
          }

          // 2. Fall back to user subchart or procedure tab
          const targetTab = tabsMap[procLower];
          if (targetTab) {
            const prevTab = tabName;
            yield* this.runSubchartOrProcedure(targetTab, procArgs, tabsMap);
            this.currentTab = prevTab;
            this.onTabChange(prevTab);
            break;
          }

          throw new Error(`Procedure or subchart "${rawCall}" not found.`);
        }

        case 'selection': {
          const condResult = Boolean(this.evaluate(node.condition));
          if (condResult) {
            yield* this.runNodeList(node.thenNodes || [], tabName, tabsMap);
          } else {
            yield* this.runNodeList(node.elseNodes || [], tabName, tabsMap);
          }
          break;
        }

        case 'loop': {
          while (true) {
            if (node.beforeNodes && node.beforeNodes.length > 0) {
              yield* this.runNodeList(node.beforeNodes, tabName, tabsMap);
            }

            yield {
              type: 'LOOP_CONDITION',
              tabName: tabName,
              node: node,
              condition: node.condition
            };

            const isExit = Boolean(this.evaluate(node.condition));
            if (isExit) {
              break;
            }

            if (node.afterNodes && node.afterNodes.length > 0) {
              yield* this.runNodeList(node.afterNodes, tabName, tabsMap);
            }
          }
          break;
        }

        default:
          break;
      }
    }
  }

  *executeBuiltinProcedure(procLower, procArgs, node, tabName) {
    switch (procLower) {
      case 'clear_console': {
        this.onConsoleOutput('', 'clear');
        break;
      }

      case 'delay_for': {
        const sec = procArgs.length > 0 ? Number(this.evaluate(procArgs[0])) : 0;
        yield {
          type: 'DELAY_FOR',
          tabName: tabName,
          node: node,
          seconds: sec
        };
        break;
      }

      case 'wait_for_key': {
        yield {
          type: 'WAIT_FOR_KEY',
          tabName: tabName,
          node: node
        };
        break;
      }

      case 'wait_for_mouse_button': {
        const btn = procArgs.length > 0 ? Number(this.evaluate(procArgs[0])) : 0;
        yield {
          type: 'WAIT_FOR_MOUSE_BUTTON',
          tabName: tabName,
          node: node,
          button: btn
        };
        break;
      }

      case 'get_mouse_button': {
        const btn = procArgs.length > 0 ? Number(this.evaluate(procArgs[0])) : 0;
        const xVar = procArgs.length > 1 ? procArgs[1].trim() : 'x';
        const yVar = procArgs.length > 2 ? procArgs[2].trim() : 'y';
        yield {
          type: 'GET_MOUSE_BUTTON',
          tabName: tabName,
          node: node,
          button: btn,
          xVar: xVar,
          yVar: yVar
        };
        break;
      }

      case 'open_graph_window': {
        const w = procArgs.length > 0 ? Math.floor(Number(this.evaluate(procArgs[0]))) : 600;
        const h = procArgs.length > 1 ? Math.floor(Number(this.evaluate(procArgs[1]))) : 400;
        this.graphOpen = true;
        this.graphWidth = w;
        this.graphHeight = h;
        this.onGraphWindow('open', { width: w, height: h, title: 'RAPTORGraph' });
        break;
      }

      case 'close_graph_window': {
        this.graphOpen = false;
        this.onGraphWindow('close');
        break;
      }

      case 'clear_window': {
        const colVal = procArgs.length > 0 ? this.evaluate(procArgs[0]) : 15;
        this.onGraphWindow('clear', { color: this.resolveColor(colVal) });
        break;
      }

      case 'put_pixel': {
        const x = Math.floor(Number(this.evaluate(procArgs[0])));
        const y = Math.floor(Number(this.evaluate(procArgs[1])));
        const col = procArgs.length > 2 ? this.evaluate(procArgs[2]) : 0;
        this.onGraphWindow('put_pixel', { x, y, color: this.resolveColor(col) });
        break;
      }

      case 'draw_line': {
        const x1 = Math.floor(Number(this.evaluate(procArgs[0])));
        const y1 = Math.floor(Number(this.evaluate(procArgs[1])));
        const x2 = Math.floor(Number(this.evaluate(procArgs[2])));
        const y2 = Math.floor(Number(this.evaluate(procArgs[3])));
        const col = procArgs.length > 4 ? this.evaluate(procArgs[4]) : 0;
        this.onGraphWindow('draw_line', { x1, y1, x2, y2, color: this.resolveColor(col) });
        break;
      }

      case 'draw_box': {
        const x1 = Math.floor(Number(this.evaluate(procArgs[0])));
        const y1 = Math.floor(Number(this.evaluate(procArgs[1])));
        const x2 = Math.floor(Number(this.evaluate(procArgs[2])));
        const y2 = Math.floor(Number(this.evaluate(procArgs[3])));
        const col = procArgs.length > 4 ? this.evaluate(procArgs[4]) : 0;
        const filled = procArgs.length > 5 ? Boolean(this.evaluate(procArgs[5])) : false;
        this.onGraphWindow('draw_box', { x1, y1, x2, y2, color: this.resolveColor(col), filled });
        break;
      }

      case 'draw_circle': {
        const x = Math.floor(Number(this.evaluate(procArgs[0])));
        const y = Math.floor(Number(this.evaluate(procArgs[1])));
        const r = Math.floor(Number(this.evaluate(procArgs[2])));
        const col = procArgs.length > 3 ? this.evaluate(procArgs[3]) : 0;
        const filled = procArgs.length > 4 ? Boolean(this.evaluate(procArgs[4])) : false;
        this.onGraphWindow('draw_circle', { x, y, radius: r, color: this.resolveColor(col), filled });
        break;
      }

      case 'draw_ellipse': {
        const x1 = Math.floor(Number(this.evaluate(procArgs[0])));
        const y1 = Math.floor(Number(this.evaluate(procArgs[1])));
        const x2 = Math.floor(Number(this.evaluate(procArgs[2])));
        const y2 = Math.floor(Number(this.evaluate(procArgs[3])));
        const col = procArgs.length > 4 ? this.evaluate(procArgs[4]) : 0;
        const filled = procArgs.length > 5 ? Boolean(this.evaluate(procArgs[5])) : false;
        this.onGraphWindow('draw_ellipse', { x1, y1, x2, y2, color: this.resolveColor(col), filled });
        break;
      }

      case 'draw_ellipse_rotate': {
        const x1 = Math.floor(Number(this.evaluate(procArgs[0])));
        const y1 = Math.floor(Number(this.evaluate(procArgs[1])));
        const x2 = Math.floor(Number(this.evaluate(procArgs[2])));
        const y2 = Math.floor(Number(this.evaluate(procArgs[3])));
        const angle = Number(this.evaluate(procArgs[4]));
        const col = procArgs.length > 5 ? this.evaluate(procArgs[5]) : 0;
        const filled = procArgs.length > 6 ? Boolean(this.evaluate(procArgs[6])) : false;
        this.onGraphWindow('draw_ellipse_rotate', { x1, y1, x2, y2, angle, color: this.resolveColor(col), filled });
        break;
      }

      case 'draw_arc': {
        const x1 = Math.floor(Number(this.evaluate(procArgs[0])));
        const y1 = Math.floor(Number(this.evaluate(procArgs[1])));
        const x2 = Math.floor(Number(this.evaluate(procArgs[2])));
        const y2 = Math.floor(Number(this.evaluate(procArgs[3])));
        const sx = Math.floor(Number(this.evaluate(procArgs[4])));
        const sy = Math.floor(Number(this.evaluate(procArgs[5])));
        const ex = Math.floor(Number(this.evaluate(procArgs[6])));
        const ey = Math.floor(Number(this.evaluate(procArgs[7])));
        const col = procArgs.length > 8 ? this.evaluate(procArgs[8]) : 0;
        this.onGraphWindow('draw_arc', { x1, y1, x2, y2, sx, sy, ex, ey, color: this.resolveColor(col) });
        break;
      }

      case 'flood_fill': {
        const x = Math.floor(Number(this.evaluate(procArgs[0])));
        const y = Math.floor(Number(this.evaluate(procArgs[1])));
        const col = procArgs.length > 2 ? this.evaluate(procArgs[2]) : 0;
        this.onGraphWindow('flood_fill', { x, y, color: this.resolveColor(col) });
        break;
      }

      case 'display_text': {
        const x = Math.floor(Number(this.evaluate(procArgs[0])));
        const y = Math.floor(Number(this.evaluate(procArgs[1])));
        const text = String(this.evaluate(procArgs[2]));
        const col = procArgs.length > 3 ? this.evaluate(procArgs[3]) : 0;
        this.onGraphWindow('display_text', { x, y, text, color: this.resolveColor(col) });
        break;
      }

      case 'display_number': {
        const x = Math.floor(Number(this.evaluate(procArgs[0])));
        const y = Math.floor(Number(this.evaluate(procArgs[1])));
        const num = this.evaluate(procArgs[2]);
        const col = procArgs.length > 3 ? this.evaluate(procArgs[3]) : 0;
        this.onGraphWindow('display_number', { x, y, number: num, color: this.resolveColor(col) });
        break;
      }

      case 'set_window_title': {
        const title = String(this.evaluate(procArgs[0]));
        this.graphTitle = title;
        this.onGraphWindow('set_title', { title });
        break;
      }

      case 'set_font_size': {
        const size = Math.floor(Number(this.evaluate(procArgs[0])));
        this.graphFontSize = size;
        this.onGraphWindow('set_font_size', { size });
        break;
      }

      case 'freeze_graph_window': {
        this.onGraphWindow('freeze');
        break;
      }

      case 'unfreeze_graph_window':
      case 'update_graph_window': {
        this.onGraphWindow('unfreeze');
        break;
      }

      case 'load_bitmap': {
        const file = procArgs[0] ? String(this.evaluate(procArgs[0])) : '';
        if (procArgs.length > 1) {
          const varName = procArgs[1].trim();
          this.setVariable(varName, { isBitmap: true, src: file });
        }
        break;
      }

      case 'draw_bitmap': {
        const bmp = procArgs.length > 0 ? this.evaluate(procArgs[0]) : null;
        const x = procArgs.length > 1 ? Math.floor(Number(this.evaluate(procArgs[1]))) : 0;
        const y = procArgs.length > 2 ? Math.floor(Number(this.evaluate(procArgs[2]))) : 0;
        const w = procArgs.length > 3 ? Math.floor(Number(this.evaluate(procArgs[3]))) : 100;
        const h = procArgs.length > 4 ? Math.floor(Number(this.evaluate(procArgs[4]))) : 100;
        this.onGraphWindow('draw_bitmap', { bmp, x, y, width: w, height: h });
        break;
      }

      case 'set_precision': {
        // Handled silently
        break;
      }

      default:
        break;
    }
  }

  // Initialize or start continuous run, or initialize in paused state for stepping
  start(flowchart, paused = false) {
    this.reset();
    this.flowchart = flowchart;
    this.generator = this.createExecutionGenerator(flowchart);
    this.status = paused ? 'paused' : 'running';
    this.onStatusChange(this.status);
    this.step();
  }

  // Step single execution step
  step(userInputValue = null) {
    if (!this.generator) {
      if (!this.flowchart) return;
      this.generator = this.createExecutionGenerator(this.flowchart);
    }

    try {
      let result;
      if (userInputValue !== null) {
        result = this.generator.next(userInputValue);
      } else {
        result = this.generator.next();
      }

      if (result.done) {
        this.status = 'finished';
        this.activeNodeId = null;
        this.onNodeHighlight(null);
        this.onStatusChange(this.status);
        this.onConsoleOutput('Flowchart execution complete.', 'system');
        return;
      }

      const stepData = result.value;

      // Handle input pause
      if (stepData.type === 'INPUT_REQUEST') {
        const wasRunning = (this.status === 'running');
        this.status = 'waiting_input';
        this.activeNodeId = stepData.node.id;
        this.onNodeHighlight(stepData.node.id, 'executing');
        this.onStatusChange(this.status);
        this.onInputRequest(stepData.prompt, stepData.variable, (val) => {
          if (this.status !== 'waiting_input') return;
          this.status = wasRunning ? 'running' : 'paused';
          this.onStatusChange(this.status);
          this.step(val);
        });
        return;
      }

      // Handle Delay_for procedure
      if (stepData.type === 'DELAY_FOR') {
        const delayMs = Math.max(0, Number(stepData.seconds) * 1000);
        this.activeNodeId = stepData.node.id;
        this.onNodeHighlight(stepData.node.id, 'executing');
        this.timer = setTimeout(() => {
          this.timer = null;
          if (this.status === 'running' || this.status === 'paused') {
            this.step();
          }
        }, delayMs);
        return;
      }

      // Handle Wait_For_Key procedure
      if (stepData.type === 'WAIT_FOR_KEY') {
        this.activeNodeId = stepData.node.id;
        this.onNodeHighlight(stepData.node.id, 'executing');
        if (this.keyBuffer.length > 0) {
          this.keyBuffer.shift();
          this.timer = setTimeout(() => this.step(), 0);
          return;
        }
        this.waitingForKey = () => {
          this.step();
        };
        return;
      }

      // Handle Wait_For_Mouse_Button procedure
      if (stepData.type === 'WAIT_FOR_MOUSE_BUTTON') {
        this.activeNodeId = stepData.node.id;
        this.onNodeHighlight(stepData.node.id, 'executing');
        this.waitingForMouse = () => {
          this.step();
        };
        return;
      }

      // Handle Get_Mouse_Button procedure
      if (stepData.type === 'GET_MOUSE_BUTTON') {
        this.activeNodeId = stepData.node.id;
        this.onNodeHighlight(stepData.node.id, 'executing');
        this.waitingForMouse = (clickInfo) => {
          this.setVariable(stepData.xVar, clickInfo.x);
          this.setVariable(stepData.yVar, clickInfo.y);
          this.step();
        };
        return;
      }

      // Highlighting active executing node (shines green)
      if (stepData.type === 'START' || stepData.type === 'END') {
        this.activeNodeId = stepData.nodeId;
        this.onNodeHighlight(stepData.nodeId, 'executing');
      } else if (stepData.node) {
        this.activeNodeId = stepData.node.id;
        this.onNodeHighlight(stepData.node.id, 'executing');
      }

      // If running continuously, schedule next step
      if (this.status === 'running') {
        if (this.speedMs <= 20 && typeof setImmediate === 'function') {
          this.timer = setImmediate(() => {
            this.step();
          });
        } else {
          this.timer = setTimeout(() => {
            this.step();
          }, this.speedMs);
        }
      }
    } catch (err) {
      this.clearExecutionTimer();
      this.status = 'error';
      this.lastError = {
        message: err.message,
        nodeId: this.activeNodeId,
        tabName: (this.callStack && this.callStack.length > 0) ? this.callStack[this.callStack.length - 1].tabName : 'main',
        timestamp: Date.now()
      };
      this.onStatusChange(this.status);
      this.onConsoleOutput(`Runtime Error: ${err.message}`, 'error');
      console.error(err);
      if (this.activeNodeId) {
        this.onNodeHighlight(this.activeNodeId, 'error');
      }
    }
  }

  pause() {
    if (this.status === 'running') {
      this.clearExecutionTimer();
      this.status = 'paused';
      this.onStatusChange(this.status);
    }
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.onStatusChange(this.status);
      this.step();
    }
  }

  stop() {
    this.reset();
    this.onConsoleOutput('Execution stopped and reset.', 'system');
  }
}

if (typeof module !== 'undefined') {
  module.exports = { RaptorInterpreter, isBuiltinProcedure, parseCallStatement, RAPTOR_COLORS, COLOR_NAMES_MAP, BUILTIN_PROCEDURES_INFO };
}

if (typeof window !== 'undefined') {
  window.RaptorInterpreter = RaptorInterpreter;
  window.isBuiltinProcedure = isBuiltinProcedure;
  window.parseCallStatement = parseCallStatement;
  window.RAPTOR_COLORS = RAPTOR_COLORS;
  window.COLOR_NAMES_MAP = COLOR_NAMES_MAP;
  window.BUILTIN_PROCEDURES_INFO = BUILTIN_PROCEDURES_INFO;
}
