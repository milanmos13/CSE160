var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));;
    v_VertPos = u_ModelMatrix * a_Position;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  uniform bool u_lightsOn;
  uniform vec3 u_cameraPos;
  uniform vec3 u_normalLightPos;
  uniform vec3 u_normalLightColor;
  uniform bool u_normalLightOn;
  uniform vec3 u_spotlightPos;
  uniform vec3 u_spotlightDir;
  uniform vec3 u_spotlightColor;
  uniform float u_spotlightCutoffAngle;
  uniform bool u_spotlightOn;
  void main() {
      if (u_whichTexture == -3) {
        gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0); // Use normal
      
      } else if (u_whichTexture == -2) {             // Use color
        gl_FragColor = u_FragColor;

      } else if (u_whichTexture == -1) {      // Use UV debug color
        gl_FragColor = vec4(v_UV,1.0,1.0);

      } else if (u_whichTexture == 0) {       // Use texture0
        gl_FragColor = texture2D(u_Sampler0, v_UV);
      
      } else if (u_whichTexture == 1) {       // Use texture1
        gl_FragColor = texture2D(u_Sampler1, v_UV);
      
      } else {                                // Error, put Reddish
        gl_FragColor = vec4(1,.2,.2,1);

      }


      if (u_lightsOn) {
        vec3 spotlightVector = u_spotlightPos - vec3(v_VertPos);
        float theta = dot(normalize(-u_spotlightDir), spotlightVector);
        if (u_spotlightOn) {
          // Implementing Phong spotlighting
          if (theta > u_spotlightCutoffAngle) {
            // Implementing normal Phong lighting
            float r = length(spotlightVector);
            
            // N dot L
            vec3 spotL = normalize(spotlightVector);
            vec3 spotN = normalize(v_Normal);
            float spotnDotL = max(dot(spotN, spotL), 0.0);

            // Reflection
            vec3 spotR = reflect(-spotL, spotN);

            // Eye
            vec3 spotE = normalize(u_cameraPos - vec3(v_VertPos));
            
            // Specular
            float spotSpecular = pow(max(dot(spotE, spotR), 0.0), 64.0) * 0.8;

            // Diffuse
            vec3 spotDiffuse = vec3(1.0, 1.0, 0.9) * vec3(gl_FragColor) * spotnDotL * 0.7;

            // Ambient
            vec3 spotAmbient = vec3(gl_FragColor) * 0.2;

            if (u_whichTexture == 0 || u_whichTexture == 1) {
              gl_FragColor = vec4(spotSpecular+spotDiffuse+spotAmbient * vec3(u_spotlightColor), 1.0);
            } else if (u_whichTexture == 1) {
              gl_FragColor = vec4(spotSpecular+spotDiffuse+spotAmbient * vec3(u_spotlightColor), 1.0);
            } else {
              gl_FragColor = vec4(spotDiffuse+spotAmbient * vec3(u_spotlightColor), 1.0);
            }
          }
        }
        if (u_normalLightOn) {
          // Implementing normal Phong lighting
          vec3 lightVector = u_normalLightPos - vec3(v_VertPos);
          float r = length(lightVector);

          // N dot L
          vec3 L = normalize(lightVector);
          vec3 N = normalize(v_Normal);
          float nDotL = max(dot(N, L), 0.0);

          // Reflection
          vec3 R = reflect(-L, N);

          // Eye
          vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
          
          // Specular
          float specular = pow(max(dot(E, R), 0.0), 64.0) * 0.8;

          // Diffuse
          vec3 diffuse = vec3(1.0, 1.0, 0.9) * vec3(gl_FragColor) * nDotL * 0.7;

          // Ambient
          vec3 ambient = vec3(gl_FragColor) * 0.2;

          if (u_whichTexture == 0 || u_whichTexture == 1) {
            gl_FragColor = vec4(specular+diffuse+ambient * vec3(u_normalLightColor), 1.0);
          } else if (u_whichTexture == 1) {
            gl_FragColor = vec4(specular+diffuse+ambient * vec3(u_normalLightColor), 1.0);
          } else {
            gl_FragColor = vec4(diffuse+ambient * vec3(u_normalLightColor), 1.0);
          }
        }
      }
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_ModelMatrix;
let u_Size;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler0;
let u_Sampler1;
let u_whichTexture;
let u_LightPos;
let g_texture0;
let g_texture1;
let u_NormalMatrix;
let u_lightsOn;
let u_cameraPos;
let u_normalLightOn
let u_normalLightPos 
let u_normalLightColor
let u_spotlightOn
let u_spotlightPos
let u_spotlightDir
let u_spotlightColor
let u_spotlightCutoffAngle;
// Global for the global sideways camera angle

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
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

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  
  // Create global vertex buffer
  g_vertexBuffer = gl.createBuffer();
  if (!g_vertexBuffer) {
    console.log('Failed to create the global buffer');
    return;
  }
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
  
  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Set the storage location of a_Position
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_NormalMatrix
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }
  
  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }
  
  // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Get the storage location of u_Sampler0
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }
  
  // Get the storage location of u_Sampler1
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }
  
  // Get the storage location of u_Sampler
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }
  
  // Get the storage location of u_lightOn
  u_lightsOn = gl.getUniformLocation(gl.program, 'u_lightsOn');
  if (!u_lightsOn) {
    console.log('Failed to get the storage location of u_lightsOn');
    return false;
  }

  // Get the storage location of u_cameraPos
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return false;
  }

  // Get the storage location of u_normalLightOn
  u_normalLightOn = gl.getUniformLocation(gl.program, 'u_normalLightOn');
  if (!u_normalLightOn) {
    console.log('Failed to get the storage location of u_normalLightOn');
    return false;
  }

  // Get the storage location of u_normalLightPos
  u_normalLightPos = gl.getUniformLocation(gl.program, 'u_normalLightPos');
  if (!u_normalLightPos) {
    console.log('Failed to get the storage location of u_normalLightPos');
    return false;
  }

  // Get the storage location of u_normalLightColor
  u_normalLightColor = gl.getUniformLocation(gl.program, 'u_normalLightColor');
  if (!u_normalLightColor) {
    console.log('Failed to get the storage location of u_normalLightColor');
    return false;
  }

  // Get the storage location of u_spotLightOn
  u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
  if (!u_spotlightOn) {
    console.log('Failed to get the storage location of u_spotlightOn');
    return false;
  }

  // Get the storage location of u_normalLightPos
  u_spotlightPos = gl.getUniformLocation(gl.program, 'u_spotlightPos');
  if (!u_spotlightPos) {
    console.log('Failed to get the storage location of u_spotlightPos');
    return false;
  }

  // Get the storage location of u_normalLightPos
  u_spotlightDir = gl.getUniformLocation(gl.program, 'u_spotlightDir');
  if (!u_spotlightDir) {
    console.log('Failed to get the storage location of u_spotlightDir');
    return false;
  }

  // Get the storage location of u_normalLightColor
  u_spotlightColor = gl.getUniformLocation(gl.program, 'u_spotlightColor');
  if (!u_spotlightColor) {
    console.log('Failed to get the storage location of u_spotlightColor');
    return false;
  }

  // Set an initial value for the matrix to identify
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, identityM.elements);
}

// Set up actions for the HTMl UI elements
function addActionsForHTMLUI() {
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
  // Front-Left Leg's Button Events
  // Normals' Button Events
  document.getElementById('normalOn').onclick = function () { g_normalOn = true; }
  document.getElementById('normalOff').onclick = function () { g_normalOn = false; }

  // All Lights' Button Events
  document.getElementById('lightsOn').onclick = function () { g_lightsOn = true; }
  document.getElementById('lightsOff').onclick = function () { g_lightsOn = false; }

  // Normal Light's Button Events
  document.getElementById('normalLightOn').onclick = function () { g_lightsOn = true; }
  document.getElementById('normalLightOff').onclick = function () { g_lightsOn = false; }
  document.getElementById('normalLightAnimationOnButton').onclick = function () { g_normalLightAnimationOn = true; }
  document.getElementById('normalLightAnimationOffButton').onclick = function () { g_normalLightAnimationOn = false; }

  // Spotlight's Button Events
  document.getElementById('spotlightOn').onclick = function () { g_spotlightOn = true; }
  document.getElementById('spotlightOff').onclick = function () { g_spotlightOn = false; }


  // Angle's Slider Event
  document.getElementById('angleSlide').addEventListener('mousemove', function () { g_globalAngle = this.value; renderAllShapes(); });
  
  // Normal Light's Slider Events
  document.getElementById('normalLightPositionSlideX').addEventListener('mousemove', function () { g_normalLightPos[0] = this.value / 100; renderAllShapes(); });
  document.getElementById('normalLightPositionSlideY').addEventListener('mousemove', function () { g_normalLightPos[1] = this.value / 100; renderAllShapes(); });
  document.getElementById('normalLightPositionSlideZ').addEventListener('mousemove', function () { g_normalLightPos[2] = this.value / 100; renderAllShapes(); });
  document.getElementById('normalLightColorRedSlide').addEventListener('mousemove', function () { g_normalLightColor[0] = parseFloat(this.value); renderAllShapes(); });
  document.getElementById('normalLightColorBlueSlide').addEventListener('mousemove', function () { g_normalLightColor[1] = parseFloat(this.value); renderAllShapes(); });
  document.getElementById('normalLightColorGreenSlide').addEventListener('mousemove', function () { g_normalLightColor[2] = parseFloat(this.value); renderAllShapes(); });

  // Spotlight's Slider Events
  document.getElementById('spotlightPositionSlideX').addEventListener('mousemove', function () { g_spotlightPos[0] = this.value / 100; renderAllShapes(); });
  document.getElementById('spotlightPositionSlideY').addEventListener('mousemove', function () { g_spotlightPos[1] = this.value / 100; renderAllShapes(); });
  document.getElementById('spotlightPositionSlideZ').addEventListener('mousemove', function () { g_spotlightPos[2] = this.value / 100; renderAllShapes(); });
  document.getElementById('spotlightDirectionSlideX').addEventListener('mousemove', function () { g_spotlightDir[0] = this.value / 100; renderAllShapes(); });
  document.getElementById('spotlightDirectionSlideY').addEventListener('mousemove', function () { g_spotlightDir[1] = this.value / 100; renderAllShapes(); });
  document.getElementById('spotlightDirectionSlideZ').addEventListener('mousemove', function () { g_spotlightDir[2] = this.value / 100; renderAllShapes(); });
  document.getElementById('spotlightColorRedSlide').addEventListener('mousemove', function () { g_spotlightColor[0] = parseFloat(this.value); renderAllShapes(); });
  document.getElementById('spotlightColorBlueSlide').addEventListener('mousemove', function () { g_spotlightColor[1] = parseFloat(this.value); renderAllShapes(); });
  document.getElementById('spotlightColorGreenSlide').addEventListener('mousemove', function () { g_spotlightColor[2] = parseFloat(this.value); renderAllShapes(); });
  document.getElementById('spotlightCutoffAngleSlide').addEventListener('mousemove', function () { g_spotlightCutoffAngle = parseFloat(Math.cos(Math.PI / 180 * this.value)); renderAllShapes(); });
}


function initTextures() {
  const image0 = new Image();
  const image1 = new Image();
  
  image0.onload = function() { 
    console.log('Sky texture loaded successfully');
    sendTextureToGLSL(image0, 0); 
  };
  image0.onerror = function() {
    console.error('Failed to load sky texture');
  };
  
  image1.onload = function() { 
    console.log('Concrete texture loaded successfully');
    sendTextureToGLSL(image1, 1); 
  };
  image1.onerror = function() {
    console.error('Failed to load concrete texture');
  };
  
  // Use relative paths
  image0.src = 'sky.jpg';  // textureNum = 0
  image1.src = 'pinkflower.jpg'; // textureNum = -3
}

function sendTextureToGLSL(image, unit) {
  try {
    const texture = gl.createTexture();
    if (!texture) {
      console.error('Failed to create texture');
      return;
    }
    
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    
    if (unit === 0) {
      gl.uniform1i(u_Sampler0, 0);
      g_texture0 = texture;
      console.log('Sky texture bound to unit 0');
    } else if (unit === 1) {
      gl.uniform1i(u_Sampler1, 1);
      g_texture1 = texture;
      console.log('Concrete texture bound to unit 1');
    }
  } catch (e) {
    console.error('Error in sendTextureToGLSL:', e);
  }
}
var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
var fps = 60;
var fpsDelta = 1000 / fps;
var previous = performance.now();
var start;
// Globals for the perspective camera
var g_camera = new Camera();
var g_eye = g_camera.eye.elements;
var g_at = g_camera.at.elements;
var g_up = g_camera.up.elements;
var rotateDelta = -0.2; // In degrees
// Global for the renderAllShapes() function
var g_shapesList = [];
var projMat = new Matrix4();

// Globals related to my Blocky Animal
// Front-Left Leg's Globals
let g_frontLeftLegThighAngle = 0;
let g_frontLeftLegPawAngle = 0;
let g_frontLeftLegThighAnimation = false;
let g_frontLeftLegPawAnimation = false;
// Front-Right Leg's Globals
let g_frontRightLegThighAngle = 0;
let g_frontRightLegPawAngle = 0;
let g_frontRightLegThighAnimation = false;
let g_frontRightLegPawAnimation = false;
// Back-Left Leg's Globals
let g_backLeftLegThighAngle = 0;
let g_backLeftLegPawAngle = 0;
let g_backLeftLegThighAnimation = false;
let g_backLeftLegPawAnimation = false;
// Back-Right Leg's Globals
let g_backRightLegThighAngle = 0;
let g_backRightLegPawAngle = 0;
let g_backRightLegThighAnimation = false;
let g_backRightLegPawAnimation = false;
// Bottom Tail's Globals
let g_tailAngle = 0;
let g_tailAnimation = false;
// Global for the normals
g_normalOn = false;
// Global for all lights
let g_lightsOn = true; 
// Global for the normal light
let g_normalLightOn = true; 
let g_normalLightPos = [0, 1, -2];
let g_normalLightColor = [1, 1, 1];
let g_normalLightAnimationOn = true;
// Global for the spotlight
let g_spotlightOn = true; 
let g_spotlightPos = [0, 1, -2];
let g_spotlightDir = [0, -1, 0];
let g_spotlightColor = [1, 1, 1];
let g_spotlightCutoffAngle = Math.cos(Math.PI / 9); // 20 degree default cutoff

function main() {
  // Set up canvas and gl variables
  setupWebGL();

  // Set up GLSL shader progress and other GLSL variables 
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHTMLUI();

  // Register function (event handler) to be called on a mouse press
  document.onkeydown = keydown;

  // For mouse movements
  // Mouse movement constants
  let dragging = false;
  let lastX = -1;
  let lastY = -1;
  let theta = 0;
  let phi = Math.PI / 2; // Default value avoids the viewpoint jumping to the top by default
  // Dragging the mouse
  canvas.addEventListener('mousedown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
  });
  // Letting go of the mouse
  canvas.addEventListener('mouseup', () => {
    dragging = false;
  })
  // Moving the mouse
  canvas.addEventListener('mousemove', (event) => {
    if (dragging) {
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      theta -= deltaX * 0.005; // Mouse sensitivity
      phi -= deltaY * 0.005; // Mouse sensitivity

      g_camera.updateCamera(theta, phi);
      gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
      // renderAllShapes();
    }
    lastX = event.clientX;
    lastY = event.clientY;
  });

  // Call the texture helper functions
  initTextures(gl, 0);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Render scene
  // initPerlinTerrainHeight();
  start = previous;
  renderAllShapes();
  requestAnimationFrame(tick);
}



// Called by browser repeatedly whenever its time
function tick() {
  // Save the current time
  g_seconds = performance.now() / 1000.0 - g_startTime;

  // Update Animation Angles
  updateAnimationAngles();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);

  // Caps the FPS to 60
  var current = performance.now();
  var delta = current - previous;
  if (delta > fpsDelta) {
    previous = current - (delta % fpsDelta);

    // Draw everything
    renderAllShapes();
  }
}


// Update the angles of everything if currently animated
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

  if (g_normalLightAnimationOn === true) { // Simple circular light animation for the normal light
    g_normalLightPos[0] = Math.cos(g_seconds) * 16;
    // g_normalLightPos[1] = Math.cos(g_seconds) * 16;
    g_normalLightPos[2] = Math.cos(g_seconds) * 16;
  }
}


function keydown(ev) {
  if (ev.keyCode === 68) { // Moving right with the "D" key
   g_camera.right();
  } else {
    if (ev.keyCode === 65) { // Moving left with the "A" key
      g_camera.left();
    } else {
      if (ev.keyCode === 87) { // Moving forward with the "W" key
        g_camera.forward();
      } else {
        if (ev.keyCode === 83) { // Moving backward with the "S" key
          g_camera.back();
        } else if (ev.keyCode === 81) { // Turning the camera left with the "Q" key
          g_camera.panLeft();
        } else if (ev.keyCode === 69) { // Turing the camera right with the "R" key
          g_camera.panRight();
        }
      }
    }
  }

  renderAllShapes();
}

const COLORS = {
  LIGHT_GRAY: [0.7, 0.7, 0.7, 1.0],
  DARK_GRAY: [0.6, 0.6, 0.6, 1.0],
  BLACK: [0.0, 0.0, 0.0, 1.0],
};

function renderAllShapes() {
  // Check the time at the start of the function
  var startTime = performance.now();

  // Pass the projection matrix (not needed in the renderAllShapes())
  // var projMat = new Matrix4();
  projMat.setIdentity();
  projMat.setPerspective(50, 1 * canvas.width / canvas.height, 1, 200);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  
  // Pass the view matrix
  var viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
    g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
    g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2],
  ); // (eye, at, up)
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // Pass the matrix to the u_ModelMatrix attribute
  var cameraRotMat = new Matrix4().rotate(rotateDelta, 0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, cameraRotMat.elements);
  
  // Pass the matrix to the u_NormalMatrix attribute
  var normalMat = new Matrix4();
  normalMat.setInverseOf(cameraRotMat);
  normalMat.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);

  // Pass the matrix to the u_GlobalRotateMatrix attribute
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);
 
  // Draw the map's wall cubes
  // drawMap();

  // Pass the light attributes that apply for all lights to GLSL
  gl.uniform1i(u_lightsOn, g_lightsOn);
  gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);

  // Pass the light attributes for the normal light to GLSL
  gl.uniform1i(u_normalLightOn, g_normalLightOn);
  gl.uniform3f(u_normalLightPos, g_normalLightPos[0], g_normalLightPos[1], g_normalLightPos[2]);
  gl.uniform3f(u_normalLightColor, g_normalLightColor[0], g_normalLightColor[1], g_normalLightColor[2]);

  // Pass the light attributes for the spotlight to GLSL
  gl.uniform1i(u_spotlightOn, g_spotlightOn);
  gl.uniform3f(u_spotlightPos, g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);
  gl.uniform3f(u_spotlightDir, g_spotlightDir[0], g_spotlightDir[1], g_spotlightDir[2]);
  gl.uniform3f(u_spotlightColor, g_spotlightColor[0], g_spotlightColor[1], g_spotlightColor[2]);
  gl.uniform1f(u_spotlightCutoffAngle, g_spotlightCutoffAngle);
  
  // Draw the normal light cube
  var normalLight = new Cube(); // Creating the normal light as a large rectangle
  normalLight.color = [2, 2, 0, 1]; // "Color" the normal light extra yellow
  if (g_normalOn === true) {
    normalLight.textureNum = -3; // Use the normals on the normal light
  } else {
    normalLight.textureNum = -2; // Use the colors on the normal light
  }
  normalLight.matrix.translate(g_normalLightPos[0], g_normalLightPos[1], g_normalLightPos[2]); // Setting the X, Y, and Z placements for the normal light 
  normalLight.matrix.scale(-0.1, -0.1, -0.1); // Scaling for the normal light with negatives for normals
  normalLight.matrix.translate(-0.5, -0.5, -0.5); // Setting the X, Y, and Z placements for the normal light
  normalLight.normalMatrix.setInverseOf(normalLight.matrix).transpose(); // Setting the normal matrix for the normal light
  normalLight.render(); // Rendering for the normal light

  // Draw the spotlight cube
  var spotlight = new Cube(); // Creating the spotlight as a large rectangle
  spotlight.color = [2, 0, 0, 1]; // "Color" the normal light extra red
  if (g_normalOn === true) {
    spotlight.textureNum = -3; // Use the normals on the spot light
  } else {
    spotlight.textureNum = -2; // Use the colors on the spot light
  }
  spotlight.matrix.translate(g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]); // Setting the X, Y, and Z placements for the spotlight 
  spotlight.matrix.scale(-0.1, -0.1, -0.1); // Scaling for the spotlight with negatives for normals
  spotlight.matrix.translate(-0.5, -0.5, -0.5); // Setting the X, Y, and Z placements for the spotlight
  spotlight.normalMatrix.setInverseOf(spotlight.matrix).transpose(); // Setting the normal matrix for the spotlight
  spotlight.render(); // Rendering for the spotlight
  // Draw the sphere
  var sphere = new Sphere();
  if (g_normalOn === true) {
    sphere.textureNum = -3; // Use the normals on the sphere
  } else {
    sphere.textureNum = -2; // Use the UV coordinates on the sphere
  }
  sphere.matrix.translate(-2, 0.25, 0); // Setting the X and Y placements for the sphere
  sphere.render();

  // Draw the ground cube for 32 x 32
  var ground = new Cube(); // Creating the ground as a large rectangle
  ground.color = [0, 1, 0, 1]; // Color the ground green
  if (g_normalOn === true) {
    ground.textureNum = -3; // Use the normals on the ground
  } else {
    ground.textureNum = -2; // Use the colors on the ground
  }
  ground.matrix.translate(0, -0.75, 0.0); // Y placement for the ground
  ground.matrix.scale(32, 0.0001, 32); // Scaling for the ground
  ground.matrix.translate(-0.5, -0.001, -0.5); // X and Z placement for the ground
  ground.render(); // Rendering for the ground

  // Draw the sky cube for 100 x 100
  var sky = new Cube(); // Creating the sky as a large rectangle
  sky.color = [0, 0, 1, 1]; // Color the sky blue
  if (g_normalOn === true) {
    sky.textureNum = -3; // Use the normals on the sky
  } else {
    sky.textureNum = 0; // Use the texture0 on the sky
  }
  sky.matrix.scale(100, 100, 100); // Scaling for the sky
  sky.matrix.translate(-0.5, -0.5, -0.5); // X, Y, and Z placement for the sky
  sky.render(); // Rendering for the sky

  //   // --- Body ---
  var body = new Cube();
  body.color = [0.7, 0.7, 0.7, 1]; // Light gray
  body.matrix.translate(-0.25, -0.6, 0.0);
  body.matrix.translate(1,0,1);
  if (g_normalOn === true) {
    body.textureNum = -3; // Use the normals on the sphere
  } else {
    body.textureNum = -2; // Use the UV coordinates on the sphere
  }
  body.matrix.scale(0.5, 0.7, 0.3); // Slightly smaller body
  body.render();

  // --- Head ---
  var head = new Cube();
  head.color = COLORS.LIGHT_GRAY;
  head.matrix.set(body.matrix);
  head.matrix.translate(-0.1, 0.8, -0.2);
  head.matrix.translate(0.5,0.1,0.3);
  head.matrix.rotate(g_headAngle, 0,0,1);
  head.matrix.translate(-0.5,-0.1,-0.3);
  if (g_normalOn === true) {
    head.textureNum = -3; // Use the normals on the sphere
  } else {
    head.textureNum = -2; // Use the UV coordinates on the sphere
  }
  head.matrix.scale(0.6/0.5, 0.6/0.7, 1.5); // Bigger head
  head.render();

  // --- Left Ear ---
  var leftEar = new Cube();
  leftEar.color = COLORS.DARK_GRAY;
  leftEar.matrix.set(head.matrix);
  leftEar.matrix.translate(-0.2, 0.8, -0.001);
  leftEar.matrix.rotate(g_earAngle, 1,0,0);
  if (g_normalOn === true) {
    leftEar.textureNum = -3; // Use the normals on the sphere
  } else {
    leftEar.textureNum = -2; // Use the UV coordinates on the sphere
  }
  leftEar.matrix.scale(0.4, 0.4, 0.4); // Bigger ears
  leftEar.render();

  // --- Right Ear ---
  var rightEar = new Cube();
  rightEar.color = COLORS.DARK_GRAY;
  rightEar.matrix.set(head.matrix);
  rightEar.matrix.translate(0.85, 0.8, -0.001);
  rightEar.matrix.rotate(-g_earAngle, 1,0,0);
  if (g_normalOn === true) {
    rightEar.textureNum = -3; // Use the normals on the sphere
  } else {
    rightEar.textureNum = -2; // Use the UV coordinates on the sphere
  }
  rightEar.matrix.scale(0.4, 0.4, 0.4); // Bigger ears
  rightEar.render();

  // --- Nose ---
  var nose = new Pyramid();
  nose.color = COLORS.BLACK;
  nose.matrix.set(head.matrix);
  nose.matrix.translate(0.51, 0.3, 0);
  if (g_normalOn === true) {
    nose.textureNum = -3; // Use the normals on the sphere
  } else {
    nose.textureNum = -2; // Use the UV coordinates on the sphere
  }
  nose.matrix.scale(0.05, 0.06, 0.03); // Tall black nose

  // Apply the rotation of 180 degrees around the Y-axis
  nose.matrix.rotate(180, 0, 1, 0);  // Rotate by 180 degrees around the Y-axis
  nose.render();

  // --- Left Arm ---
  var leftArm = new Cube();
  leftArm.color = COLORS.DARK_GRAY;
  leftArm.matrix.set(body.matrix);
  leftArm.matrix.translate(-0.3, 0.05, 0.15);
  leftArm.matrix.translate(0.25, 0.6, 0);
  leftArm.matrix.rotate(g_leftArmAngle, 0,0,1);
  leftArm.matrix.translate(-0.25, -0.6, 0);
  if (g_normalOn === true) {
    leftArm.textureNum = -3; // Use the normals on the sphere
  } else {
    leftArm.textureNum = -2; // Use the UV coordinates on the sphere
  }
  leftArm.matrix.scale(0.15/0.5, 0.5/0.7, 0.15/0.3);
  leftArm.render();

  var leftHand = new Cube();
  leftHand.color = COLORS.LIGHT_GRAY;
  leftHand.matrix.set(leftArm.matrix);
  leftHand.matrix.scale(5/1, 7/5, 3/1);
  leftHand.matrix.translate(0, -0.21, 0);
  leftHand.matrix.translate(0.1, 0.17, 0);
  leftHand.matrix.rotate(g_leftHandAngle, 0, 0, 1);
  leftHand.matrix.translate(-0.1, -0.17, 0);
  leftHand.matrix.scale(1/5, 1.5/7, 1/3);
  if (g_normalOn === true) {
    leftHand.textureNum = -3; // Use the normals on the sphere
  } else {
    leftHand.textureNum = -2; // Use the UV coordinates on the sphere
  }
  leftHand.render();
  // --- Right Arm ---
  var rightArm = new Cube();
  rightArm.color = COLORS.DARK_GRAY;
  rightArm.matrix.set(body.matrix);
  rightArm.matrix.translate(1, 0.05, 0.15);
  rightArm.matrix.translate(0.05, 0.6, 0);
  rightArm.matrix.rotate(g_rightArmAngle,0,0,1);
  rightArm.matrix.translate(-0.05, -0.6, 0);
  rightArm.matrix.scale(0.15/0.5, 0.5/0.7, 0.15/0.3);
  if (g_normalOn === true) {
    rightArm.textureNum = -3; // Use the normals on the sphere
  } else {
    rightArm.textureNum = -2; // Use the UV coordinates on the sphere
  }
  rightArm.render();

  var rightHand = new Cube();
  rightHand.color = COLORS.LIGHT_GRAY;
  rightHand.matrix.set(rightArm.matrix);
  rightHand.matrix.scale(5/1, 7/5, 3/1);
  rightHand.matrix.translate(0, -0.21, 0);         // Move to pivot area
  rightHand.matrix.translate(0.1, 0.17, 0);        // Pivot point
  rightHand.matrix.rotate(g_rightHandAngle, 0, 0, 1);
  rightHand.matrix.translate(-0.1, -0.17, 0);
  rightHand.matrix.scale(1/5, 1.5/7, 1/3);
  if (g_normalOn === true) {
    rightHand.textureNum = -3; // Use the normals on the sphere
  } else {
    rightHand.textureNum = -2; // Use the UV coordinates on the sphere
  }
  rightHand.matrix.scale(1, 1, 1.01);
  rightHand.render();

  // --- Left Leg ---
  var leftLeg = new Cube();
  leftLeg.color = COLORS.DARK_GRAY;

  leftLeg.matrix.set(body.matrix);
  leftLeg.matrix.scale(1/0.5, 1/0.7, 1/0.3); // Undo body's scale
  leftLeg.matrix.translate(0.03, -0.4, 0.05);
  leftLeg.matrix.translate(0, 0.4, 0.1);
  leftLeg.matrix.rotate(g_leftLegAngle, 1, 0, 0);
  leftLeg.matrix.translate(0, -0.4, -0.1);
  if (g_normalOn === true) {
    leftLeg.textureNum = -3; // Use the normals on the sphere
  } else {
    leftLeg.textureNum = -2; // Use the UV coordinates on the sphere
  }
  leftLeg.matrix.scale(0.2, 0.5, 0.2);
  leftLeg.render();

  // --- Right Leg ---
  var rightLeg = new Cube();
  rightLeg.color = COLORS.DARK_GRAY;
  rightLeg.matrix.set(body.matrix);
  rightLeg.matrix.scale(1/0.5, 1/0.7, 1/0.3);
  rightLeg.matrix.translate(0.27, -0.4, 0.05);
  rightLeg.matrix.translate(0, 0.4, 0.1);
  rightLeg.matrix.rotate(g_rightLegAngle, 1,0,0);
  rightLeg.matrix.translate(0, -0.4, -0.1);
  if (g_normalOn === true) {
    rightLeg.textureNum = -3; // Use the normals on the sphere
  } else {
    rightLeg.textureNum = -2; // Use the UV coordinates on the sphere
  }
  rightLeg.matrix.scale(0.2, 0.5, 0.2);
  rightLeg.render();
  // Draw the statue's head cube

  var statueHead = new Cube(); // Creating the head as a small rectangle
  if (g_normalOn === true) {
    statueHead.textureNum = -3; // Use the normals on the walls
  } else {
    statueHead.textureNum = 0; // Use the texture0 on the head
  }
  statueHead.matrix.translate(-0.25, 0.5, 0.175); // X, Y, and Z placements for the head
  statueHead.matrix.scale(0.3, 0.3, 0.3); // Scaling for the head
  statueHead.render(); // Rendering for the head
 
  // Draw the statue's foot cube
  var statueFoot = new Cube(); // Creating the foot as a small rectangle
  if (g_normalOn === true) {
    statueFoot.textureNum = -3; // Use the normals on the foot
  } else {
    statueFoot.textureNum = 0; // Use the texture0 on the foot
  }
  statueFoot.matrix.translate(-0.425, -0.65, 0); // X and Y placements for the foot
  statueFoot.matrix.scale(.7, .5, .7); // Scaling for the foot
  statueFoot.render(); // Rendering for the foot

  // Draw the statue's body cube
  var statueBody = new Cube(); // Creating the body as a small rectangle
  if (g_normalOn === true) {
    statueBody.textureNum = -3; // Use the normals on the body
  } else {
    statueBody.textureNum = 1; // Use the texture1 on the body
  }
  statueBody.matrix.translate(-0.25, -0.15, 0.0); // X and Y placements for the body
  statueBody.matrix.scale(0.3, 0.65, 0.65); // Scaling for the body
  statueBody.render(); // Rendering for the body
  
  // Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), "numdot");
}


// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get: " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}