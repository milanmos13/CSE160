var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let u_ModelMatrix;
let u_Size;
let u_GlobalRotateMatrix;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL with alpha support
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  
  // Enable blending for transparency
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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



  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
// Globals related to UI
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_lastX = null;
let g_lastY = null;
let g_globalAngle=0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;
let g_headAngle = 0;
let g_leftArmAngle = 0;
let g_leftHandAngle = 0;
let g_rightArmAngle = 0;
let g_leftLegAngle = 0;
let g_rightLegAngle = 0;
let g_earAngle = 0;
let g_shiftClickAnimation = false;
let g_shiftClickStartTime = 0;
let g_pokeAnimation = false;
let g_rightHandAngle = 0;
let g_walkingAnimation = false;


let g_mouseX = 0;
let g_mouseY = 0;


function addActionsFromHtmlUI() {
  document.getElementById('headSlide').addEventListener('input', function() {
    g_headAngle = this.value;
    renderAllShapes();
  });
  document.getElementById('leftArmSlide').addEventListener('input', function() {
    g_leftArmAngle = this.value;
    renderAllShapes();
  });
  document.getElementById('leftHandSlide').addEventListener('input', function() {
    g_leftHandAngle = this.value;
    renderAllShapes();
  });
  document.getElementById('rightHandSlide').addEventListener('input', function() {
    g_rightHandAngle = this.value;
    renderAllShapes();
  });
  document.getElementById('rightArmSlide').addEventListener('input', function() {
    g_rightArmAngle = this.value;
    renderAllShapes();
  });
  document.getElementById('leftLegSlide').addEventListener('input', function() {
    g_leftLegAngle = this.value;
    renderAllShapes();
  });
  document.getElementById('rightLegSlide').addEventListener('input', function() {
    g_rightLegAngle = this.value;
    renderAllShapes();
  });
  document.getElementById('toggleWalking').addEventListener('click', function() {
    g_walkingAnimation = !g_walkingAnimation; // Toggle the walking animation state
    console.log('Walking Animation:', g_walkingAnimation ? 'ON' : 'OFF');
  });

}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsFromHtmlUI();

  // canvas.onmousedown = handleClick;
  // canvas.onmousemove = function(ev) {if (ev.buttons == 1) {handleClick(ev)}};
  canvas.onmousedown = function(ev) { handleMouseDown(ev); };
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) handleMouseMove(ev); };

  gl.clearColor(0.0, 0.0, 1.0, 1.0);
  // gl.clear(gl.COLOR_BUFFER_BIT);

  requestAnimationFrame(tick);
}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0-g_startTime;
  // console.log(g_seconds);

  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(tick);
}
// function updateAnimationAngles() {
//   if (g_pokeAnimation) {
//     g_headAngle = 45 * Math.sin(g_seconds * 5);
//     g_leftArmAngle = -45 * Math.abs(Math.sin(g_seconds * 10));
//     g_rightArmAngle = -45 * Math.abs(Math.sin(g_seconds * 10));
//     g_leftLegAngle = 30 * Math.sin(g_seconds * 5);
//     g_rightLegAngle = -30 * Math.sin(g_seconds * 5);
//   }

//   if (g_shiftClickAnimation) {
//     let elapsed = g_seconds - g_shiftClickStartTime;

//     const totalDuration = 2.0;
//     const half = totalDuration / 2;

//     if (elapsed <= totalDuration) {
//       const t = elapsed / totalDuration;

//       // Head turn (happens throughout)
//       g_headAngle = 30 * easeOutQuad(t);

//       if (elapsed <= half) {
//         // First half: raise the arm only
//         const armProgress = easeOutQuad(elapsed / half);
//         g_rightArmAngle = 150 * armProgress;
//         g_rightHandAngle = 0;
//       } else {
//         // Second half: keep arm up, animate hand forward and back
//         g_rightArmAngle = 150;

//         const handT = (elapsed - half) / half;
//         const handSwing = Math.sin(handT * Math.PI * 2); // full cycle in second half
//         g_rightHandAngle = 30 * handSwing; // swings from -30 to 30 degrees
//       }
//     } else {
//       // Animation done
//       g_shiftClickAnimation = false;
//     }
//   }
// }
function updateAnimationAngles() {
  if (g_pokeAnimation) {
    g_headAngle = 45 * Math.sin(g_seconds * 5);
    g_leftArmAngle = -45 * Math.abs(Math.sin(g_seconds * 10));
    g_rightArmAngle = -45 * Math.abs(Math.sin(g_seconds * 10));
    g_leftLegAngle = 30 * Math.sin(g_seconds * 5);
    g_rightLegAngle = -30 * Math.sin(g_seconds * 5);
  }

  if (g_shiftClickAnimation) {
    let elapsed = g_seconds - g_shiftClickStartTime;

    const totalDuration = 2.0;
    const half = totalDuration / 2;

    if (elapsed <= totalDuration) {
      const t = elapsed / totalDuration;

      // Head turn (happens throughout)
      g_headAngle = 30 * easeOutQuad(t);

      if (elapsed <= half) {
        // First half: raise the arm only
        const armProgress = easeOutQuad(elapsed / half);
        g_rightArmAngle = 150 * armProgress;
        g_rightHandAngle = 0;
      } else {
        // Second half: keep arm up, animate hand forward and back
        g_rightArmAngle = 150;

        const handT = (elapsed - half) / half;
        const handSwing = Math.sin(handT * Math.PI * 2); // full cycle in second half
        g_rightHandAngle = 30 * handSwing; // swings from -30 to 30 degrees
      }
    } else {
      // Animation done
      g_shiftClickAnimation = false;
    }
  }

  // Walking animation
  if (g_walkingAnimation) {
    let walkingSpeed = 3; // Speed of walking (adjust as needed)
    
    // Use sine waves to simulate walking motion
    g_leftLegAngle = 30 * Math.sin(g_seconds * walkingSpeed);
    g_rightLegAngle = -30 * Math.sin(g_seconds * walkingSpeed);
  }
}

function easeOutQuad(t) {
  return t * (2 - t);
}


function renderAllShapes() {
  var startTime = performance.now();

  var globalRotMat = new Matrix4()
    .rotate(g_globalAngle + g_mouseX, 0, 1, 0)
    .rotate(g_mouseY, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//   // --- Body ---
var body = new Cube();
body.color = [0.7, 0.7, 0.7, 1]; // Light gray
body.matrix.translate(-0.25, -0.6, 0.0);
body.matrix.scale(0.5, 0.7, 0.3); // Slightly smaller body
body.render();

// --- Head ---
var head = new Cube();
head.color = [0.7, 0.7, 0.7, 1]; // Light gray
head.matrix.set(body.matrix);
head.matrix.translate(-0.1, 0.8, -0.2);
head.matrix.translate(0.5,0.1,0.3);
head.matrix.rotate(g_headAngle, 0,0,1);
head.matrix.translate(-0.5,-0.1,-0.3);
head.matrix.scale(0.6/0.5, 0.6/0.7, 1.5); // Bigger head
head.render();

// --- Left Ear ---
var leftEar = new Cube();
leftEar.color = [0.6, 0.6, 0.6, 1]; // Slightly darker gray
leftEar.matrix.set(head.matrix);
leftEar.matrix.translate(-0.2, 0.8, -0.001);
leftEar.matrix.rotate(g_earAngle, 1,0,0);
leftEar.matrix.scale(0.4, 0.4, 0.4); // Bigger ears
leftEar.render();

// --- Right Ear ---
var rightEar = new Cube();
rightEar.color = [0.6, 0.6, 0.6, 1]; // Slightly darker gray
rightEar.matrix.set(head.matrix);
rightEar.matrix.translate(0.85, 0.8, -0.001);
rightEar.matrix.rotate(-g_earAngle, 1,0,0);
rightEar.matrix.scale(0.4, 0.4, 0.4); // Bigger ears
rightEar.render();

// --- Nose ---
var nose = new Pyramid();
nose.color = [0, 0, 0, 1]; // Black nose
nose.matrix.set(head.matrix);
nose.matrix.translate(0.51, 0.3, 0);
nose.matrix.scale(0.05, 0.06, 0.03); // Tall black nose

// Apply the rotation of 180 degrees around the Y-axis
nose.matrix.rotate(180, 0, 1, 0);  // Rotate by 180 degrees around the Y-axis
nose.render();

// --- Left Arm ---
var leftArm = new Cube();
leftArm.color = [0.6, 0.6, 0.6, 1]; // Same gray
leftArm.matrix.set(body.matrix);
leftArm.matrix.translate(-0.3, 0.05, 0.15);
leftArm.matrix.translate(0.25, 0.6, 0);
leftArm.matrix.rotate(g_leftArmAngle, 0,0,1);
leftArm.matrix.translate(-0.25, -0.6, 0);
leftArm.matrix.scale(0.15/0.5, 0.5/0.7, 0.15/0.3);
leftArm.render();

var leftHand = new Cube();
leftHand.color = [0.7, 0.7, 0.7, 1]; // Same gray

// Start from leftArm, but undo leftArm's scaling
leftHand.matrix.set(leftArm.matrix);
leftHand.matrix.scale(5/1, 7/5, 3/1);
leftHand.matrix.translate(0, -0.21, 0);
leftHand.matrix.translate(0.1, 0.17, 0);
leftHand.matrix.rotate(g_leftHandAngle, 0, 0, 1);
leftHand.matrix.translate(-0.1, -0.17, 0);
leftHand.matrix.scale(1/5, 1.5/7, 1/3);
leftHand.render();
// --- Right Arm ---
var rightArm = new Cube();
rightArm.color = [0.6, 0.6, 0.6, 1]; // Same gray
rightArm.matrix.set(body.matrix);
rightArm.matrix.translate(1, 0.05, 0.15);
rightArm.matrix.translate(0.05, 0.6, 0);
rightArm.matrix.rotate(g_rightArmAngle,0,0,1);
rightArm.matrix.translate(-0.05, -0.6, 0);
rightArm.matrix.scale(0.15/0.5, 0.5/0.7, 0.15/0.3);
rightArm.render();

var rightHand = new Cube();
rightHand.color = [0.7, 0.7, 0.7, 1]; // Same gray
rightHand.matrix.set(rightArm.matrix);

// Undo rightArm scaling: inverse of (0.15/0.5, 0.5/0.7, 0.15/0.3)
rightHand.matrix.scale(5/1, 7/5, 3/1);

// Apply rotation and translation
rightHand.matrix.translate(0, -0.21, 0);         // Move to pivot area
rightHand.matrix.translate(0.1, 0.17, 0);        // Pivot point
rightHand.matrix.rotate(g_rightHandAngle, 0, 0, 1);
rightHand.matrix.translate(-0.1, -0.17, 0);
rightHand.matrix.scale(1/5, 1.5/7, 1/3);
rightHand.matrix.scale(1, 1, 1.01);
rightHand.render();

// --- Left Leg ---
var leftLeg = new Cube();
leftLeg.color = [0.6, 0.6, 0.6, 1]; // Same gray

leftLeg.matrix.set(body.matrix);
leftLeg.matrix.scale(1/0.5, 1/0.7, 1/0.3); // Undo body's scale
leftLeg.matrix.translate(0.03, -0.4, 0.05);
leftLeg.matrix.translate(0, 0.4, 0.1);
leftLeg.matrix.rotate(g_leftLegAngle, 1, 0, 0);
leftLeg.matrix.translate(0, -0.4, -0.1);
leftLeg.matrix.scale(0.2, 0.5, 0.2);
leftLeg.render();

// --- Right Leg ---
var rightLeg = new Cube();
rightLeg.color = [0.6, 0.6, 0.6, 1]; // Same gray
rightLeg.matrix.set(body.matrix);
rightLeg.matrix.scale(1/0.5, 1/0.7, 1/0.3);
rightLeg.matrix.translate(0.27, -0.4, 0.05);
rightLeg.matrix.translate(0, 0.4, 0.1);
rightLeg.matrix.rotate(g_rightLegAngle, 1,0,0);
rightLeg.matrix.translate(0, -0.4, -0.1);
rightLeg.matrix.scale(0.2, 0.5, 0.2);
rightLeg.render();
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "fpsCounter");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function handleMouseDown(ev) {
  console.log('test');
  if (ev.shiftKey) {
    console.log('here');
    g_shiftClickAnimation = true;
    g_shiftClickStartTime = g_seconds; // capture the moment of click
  } else {
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
  }
}


function handleMouseMove(ev) {
  var deltaX = ev.clientX - g_lastX;
  var deltaY = ev.clientY - g_lastY;
  g_mouseX += deltaX * 0.5;
  g_mouseY += deltaY * 0.5;
  g_lastX = ev.clientX;
  g_lastY = ev.clientY;
}