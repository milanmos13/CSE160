
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`;

// Fragment shader program with alpha support
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL with alpha support
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  
  // Enable blending for transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const BRUSH = 3;
const ERASER = 4;
// Globals related to UI
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_lastX = null;
let g_lastY = null;

function addActionsFromHtmlUI() {
  document.getElementById('green').onclick = function() {g_selectedColor = [0.0,1.0,0.0,1.0];};
  document.getElementById('red').onclick = function() {g_selectedColor = [1.0,0.0,0.0,1.0]; };
  document.getElementById('blue').onclick = function() {g_selectedColor = [0.0,0.0,1.0,1.0]; };
  document.getElementById('clear').onclick = function() {g_shapesList = []; renderAllShapes()};

  document.getElementById('pointButton').onclick = function() {g_selectedType = POINT};
  document.getElementById('triangleButton').onclick = function() {g_selectedType = TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType = CIRCLE};
  document.getElementById('brushButton').onclick = function() {g_selectedType = BRUSH};
  document.getElementById('eraserButton').onclick = function() {g_selectedType = ERASER};
  
  document.getElementById('drawPicture').onclick = drawPicture;

  // Color sliders with alpha
  let redSlider = document.getElementById('redslide');
  redSlider.addEventListener('input', function() {
    g_selectedColor[0] = this.value / 100;
    document.getElementById('redValue').textContent = Math.round(this.value / 100 * 255);
  });

  let greenSlider = document.getElementById('greenslide');
  greenSlider.addEventListener('input', function() {
    g_selectedColor[1] = this.value / 100;
    document.getElementById('greenValue').textContent = Math.round(this.value / 100 * 255);
  });

  let blueSlider = document.getElementById('blueslide');
  blueSlider.addEventListener('input', function() {
    g_selectedColor[2] = this.value / 100;
    document.getElementById('blueValue').textContent = Math.round(this.value / 100 * 255);
  });

  let alphaSlider = document.getElementById('alphaslide');
  alphaSlider.addEventListener('input', function() {
    g_selectedColor[3] = this.value / 100;
    document.getElementById('alphaValue').textContent = Math.round(this.value / 100 * 255);
  });

  let sizeSlider = document.getElementById('sizeslide');
  sizeSlider.addEventListener('input', function() {
    g_selectedSize = this.value;
    document.getElementById('sizeValue').textContent = this.value;
  });

  let segmentSlider = document.getElementById('segmentslide');
  segmentSlider.addEventListener('input', function() {
    g_selectedSegments = this.value;
    document.getElementById('segmentValue').textContent = this.value;
  });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsFromHtmlUI();

  canvas.onmousedown = handleClick;
  canvas.onmousemove = function(ev) {if (ev.buttons == 1) {handleClick(ev)}};

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];
var g_isDrawing = false;

function startDrawing(ev) {
  g_isDrawing = true;
  handleClick(ev);
}

function stopDrawing() {
  g_isDrawing = false;
  g_lastX = null;
  g_lastY = null;
}

function handleClick(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  
  let shape;
  switch(g_selectedType) {
    case POINT:
      shape = new Point();
      break;
    case TRIANGLE:
      shape = new Triangle();
      break;
    case CIRCLE:
      shape = new Circle();
      shape.segments = g_selectedSegments;
      break;
    case ERASER:
      shape = new Eraser();
      break;
    case BRUSH:
      shape = new Brush();
      shape.direction = [0, 0]; // Default direction
      break;
    default:
      shape = new Point();
  }
  
  shape.position = [x, y];
  shape.color = g_selectedColor.slice();
  shape.size = g_selectedSize;
  g_shapesList.push(shape);
  
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return [x, y];
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  for(let shape of g_shapesList) {
    shape.render();
  }
}
function drawPicture() {
  // Clear any existing picture
  g_fixedShapes = [];
  
  // Roof (red triangles)
  const roofColor = [0.8, 0.2, 0.2, 1.0];
  drawCustomTriangle([-10, 4, -4, 10, 2, 4], roofColor);
  drawCustomTriangle([-4, 10, 2, 4, 8, 10], roofColor);
  drawCustomTriangle([2, 4, 8, 10, 14, 4], roofColor);
  
  // House body (blue triangles)
  const houseColor = [0.2, 0.2, 0.8, 1.0];
  drawCustomTriangle([-10, 4, -10, -10, 2, 4], houseColor);
  drawCustomTriangle([2, 4, -10, -10, 2, -10], houseColor);
  drawCustomTriangle([2, 4, 2, -10, 14, 4], houseColor);
  drawCustomTriangle([14, 4, 2, -10, 14, -10], houseColor);
  
  // Door (brown triangles)
  const doorColor = [0.5, 0.3, 0.1, 1.0];
  drawCustomTriangle([-4, -10, -4, -4, 0, -10], doorColor);
  drawCustomTriangle([-4, -4, 0, -10, 0, -4], doorColor);
  
  // Windows (yellow triangles)
  const windowColor = [0.9, 0.9, 0.2, 1.0];
  drawCustomTriangle([-8, -2, -8, 2, -4, -2], windowColor);
  drawCustomTriangle([-4, -2, -8, 2, -4, 2], windowColor);
  drawCustomTriangle([6, -2, 6, 2, 10, -2], windowColor);
  drawCustomTriangle([10, -2, 6, 2, 10, 2], windowColor);
  
  // Sun (yellow triangles radiating from center)
  const sunColor = [1.0, 1.0, 0.0, 1.0];
  const sunX = -16;
  const sunY = 16;
  const sunSize = 3;
  for(let i = 0; i < 12; i++) {
    const angle1 = (i / 12) * Math.PI * 2;
    const angle2 = ((i + 1) / 12) * Math.PI * 2;
    drawCustomTriangle([
      sunX, sunY,
      sunX + Math.cos(angle1) * sunSize, sunY + Math.sin(angle1) * sunSize,
      sunX + Math.cos(angle2) * sunSize, sunY + Math.sin(angle2) * sunSize
    ], sunColor);
  }
  
  // Tree (green triangles for leaves, brown for trunk)
  const trunkColor = [0.4, 0.2, 0.0, 1.0];
  const leavesColor = [0.1, 0.6, 0.1, 1.0];
  
  // Trunk
  drawCustomTriangle([12, -10, 13, -10, 12, -4], trunkColor);
  drawCustomTriangle([13, -10, 12, -4, 13, -4], trunkColor);
  
  // Leaves
  drawCustomTriangle([10, -4, 15, -4, 12.5, 2], leavesColor);
  drawCustomTriangle([10.5, -0, 14.5, -0, 12.5, 6], leavesColor);

    // Left tree trunk
    drawCustomTriangle([-13, -10, -12, -10, -13, -4], trunkColor);
    drawCustomTriangle([-12, -10, -13, -4, -12, -4], trunkColor);
    
    // Left tree leaves
    drawCustomTriangle([-15, -4, -10, -4, -12.5, 2], leavesColor);
    drawCustomTriangle([-14.5, -0, -10.5, -0, -12.5, 6], leavesColor);
}

function drawCustomTriangle(coords20, color) {
  // Convert from -20..20 coordinates to clip space (-1..1)
  let coordsClip = coords20.map(v => v / 20);

  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordsClip), gl.STATIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}