// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_Segments;


function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
  
    // // Get the storage location of a_Position
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

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedSegments = 10;
let g_selectedType = POINT;

function addActionsForHtmlUI() {
  document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, g_selectedColor[3]]; };
  document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, g_selectedColor[3]]; };
  document.getElementById('clearButton').onclick = function() { g_shapeList = []; renderAllShapes(); };

  document.getElementById('pointButton').onclick = function() { g_selectedType = POINT; };
  document.getElementById('triButton').onclick = function() { g_selectedType = TRIANGLE; };
  document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE; };

  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value / 100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value / 100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value / 100; });

  document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });
  document.getElementById('segmentSlide').addEventListener('mouseup', function() { g_selectedSegments = this.value; });
  document.getElementById('opacitySlide').addEventListener('mouseup', function() { g_selectedColor[3] = this.value / 100; });

  document.getElementById('recreateButton').onclick = function() { recreateDrawing(); };
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev); } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_sizes = [];
var g_shapeList = [];

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_selectedSegments; // Set the number of segments
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapeList.push(point);

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return([x,y]);
}

function renderAllShapes(){
  var startTime = performance.now();
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapeList.length;
  for(var i = 0; i < len; i++) {
    g_shapeList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function recreateDrawing() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  let scale = 0.5; 

  let trunkVertices = new Float32Array([
    // First triangle for the trunk
    -0.05 * scale, -0.5 * scale,  0.05 * scale, -0.5 * scale,  0.05 * scale, -0.4 * scale,
    -0.05 * scale, -0.5 * scale,  0.05 * scale, -0.4 * scale,  -0.05 * scale, -0.4 * scale,
    // Second triangle for the trunk
    -0.05 * scale, -0.4 * scale,  0.05 * scale, -0.4 * scale,  0.05 * scale, -0.3 * scale,
    -0.05 * scale, -0.4 * scale,  0.05 * scale, -0.3 * scale,  -0.05 * scale, -0.3 * scale,
    // Third triangle for the trunk
    -0.05 * scale, -0.3 * scale,  0.05 * scale, -0.3 * scale,  0.05 * scale, -0.2 * scale,
    -0.05 * scale, -0.3 * scale,  0.05 * scale, -0.2 * scale,  -0.05 * scale, -0.2 * scale,
    // Fourth triangle for the trunk
    -0.05 * scale, -0.2 * scale,  0.05 * scale, -0.2 * scale,  0.05 * scale, -0.1 * scale,
    -0.05 * scale, -0.2 * scale,  0.05 * scale, -0.1 * scale,  -0.05 * scale, -0.1 * scale,
    // Fifth triangle for the trunk
    -0.05 * scale, -0.1 * scale,  0.05 * scale, -0.1 * scale,  0.05 * scale, 0.0 * scale,
    -0.05 * scale, -0.1 * scale,  0.05 * scale, 0.0 * scale,  -0.05 * scale, 0.0 * scale
  ]);

  let leavesVertices = new Float32Array([
    // Bottom triangle of the leaves
    0.0 * scale, 0.0 * scale,  -0.2 * scale, 0.2 * scale,  0.2 * scale, 0.2 * scale,
    // Second triangle of the leaves
    0.0 * scale, 0.2 * scale,  -0.15 * scale, 0.4 * scale,  0.15 * scale, 0.4 * scale,
    // Third triangle of the leaves
    0.0 * scale, 0.4 * scale,  -0.1 * scale, 0.6 * scale,  0.1 * scale, 0.6 * scale,
    // Fourth triangle of the leaves
    0.0 * scale, 0.6 * scale,  -0.05 * scale, 0.8 * scale,  0.05 * scale, 0.8 * scale,
    // Fifth triangle of the leaves
    0.0 * scale, 0.8 * scale,  -0.025 * scale, 1.0 * scale,  0.025 * scale, 1.0 * scale,
    -0.2 * scale, 0.2 * scale,  -0.3 * scale, 0.3 * scale,  -0.1 * scale, 0.3 * scale,
    0.2 * scale, 0.2 * scale,  0.3 * scale, 0.3 * scale,  0.1 * scale, 0.3 * scale,
    -0.15 * scale, 0.4 * scale,  -0.25 * scale, 0.5 * scale,  -0.05 * scale, 0.5 * scale,
    0.15 * scale, 0.4 * scale,  0.25 * scale, 0.5 * scale,  0.05 * scale, 0.5 * scale,
    -0.1 * scale, 0.6 * scale,  -0.2 * scale, 0.7 * scale,  0.0 * scale, 0.7 * scale,
    0.1 * scale, 0.6 * scale,  0.2 * scale, 0.7 * scale,  0.0 * scale, 0.7 * scale
  ]);

  let vertices = new Float32Array([...trunkVertices, ...leavesVertices]);

  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(a_Position);

  let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return -1;
  }

  gl.uniform4f(u_FragColor, g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], g_selectedColor[3]);

  let primitiveType = gl.TRIANGLES;
  let offset = 0;
  let count = vertices.length / 2;
  gl.drawArrays(primitiveType, offset, count);
}
