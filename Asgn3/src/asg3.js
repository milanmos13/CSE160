var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    }
    else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0);
    }
    else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    }
    else if (u_whichTexture == -3) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    }
    else {
      gl_FragColor = vec4(1,0.2,0.2,1);
    }
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_Size;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler0;
let u_Sampler1;
let u_whichTexture;
let g_texture0;
let g_texture1;

// Animation and UI variables
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = 0;
let g_globalAngle = 0;
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
let g_rightHandAngle = 0;
let g_walkingAnimation = false;
// Add near your other global variables
let g_characterX = 0;
let g_characterZ = 0;
let g_characterSpeed = 0.05; // Adjust this value for faster/slower movement
let g_selectedBlockType = 1;

// Camera and movement
let g_mouseDown = false;
let g_lastX = null;
let g_mouseX = 0;
let g_mouseY = 0;
let g_vertexBuffer = null;

// Animation timing
let g_startTime = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0 - g_startTime;
let g_lastFrameTime = performance.now();
let g_frameCount = 0;
let g_fps = 0;

let g_map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];


// Camera instance
let camera;

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

  // Get attribute and uniform locations
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

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

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get u_whichTexture');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of U_Sampler');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  // Initialize with identity matrix
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActionsFromHtmlUI() {
  // Animation toggles
  document.getElementById('toggleWalking').addEventListener('click', function() {
    g_walkingAnimation = !g_walkingAnimation;
    console.log('Walking Animation:', g_walkingAnimation ? 'ON' : 'OFF');
  });

  // Slider controls
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

  // Global rotation slider
  document.getElementById('angleSlide').addEventListener('input', function() {
    g_globalAngle = this.value;
    renderAllShapes();
  });
}

function initTextures() {
  const image0 = new Image();
  const image1 = new Image();
  image0.onload = function() { sendTextureToGLSL(image0, 0); };
  image1.onload = function() { sendTextureToGLSL(image1, 1); };
  image0.src = 'sky.jpg';  // textureNum = 0
  image1.src = 'concrete.jpg'; // textureNum = -3
}

function sendTextureToGLSL(image, unit) {
  const texture = gl.createTexture();
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
  } else if (unit === 1) {
    gl.uniform1i(u_Sampler1, 1);
    g_texture1 = texture;
  }
}
function sendTextToHtml(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

let g_enemy = {
  x: 10,         // Starting X position (in world coordinates)
  z: 10,         // Starting Z position (in world coordinates)
  speed: 0.03,   // Movement speed (slightly slower than player)
  detectionRange: 8.0, // Distance at which enemy detects player
  isChasing: false,
  lastPathUpdate: 0,
  pathUpdateInterval: 500, // ms between path recalculations
  color: [0.8, 0.2, 0.2, 1.0], // Red color
  targetX: 0,
  targetZ: 0,
  path: []
};

// Add this function to draw the enemy
function drawEnemy() {
  // --- Enemy Body ---
  var body = new Cube();
  body.color = g_enemy.color;
  
  body.matrix.translate(g_enemy.x, -0.6, g_enemy.z);
  
  // Calculate angle to face the player
  let angleToPlayer = Math.atan2(g_characterX - g_enemy.x, g_characterZ - g_enemy.z) * 180 / Math.PI;
  body.matrix.rotate(angleToPlayer, 0, 1, 0);
  
  body.matrix.scale(0.5, 0.5, 0.3);
  body.render();
  
  // --- Enemy Head ---
  var head = new Cube();
  head.color = [0.9, 0.3, 0.3, 1.0]; // Slightly lighter red
  head.matrix.set(body.matrix);
  head.matrix.translate(0.1, 0.8, 0.0);
  
  // Make head bob up and down while moving
  if (g_enemy.isChasing) {
    head.matrix.rotate(10 * Math.sin(g_seconds * 5), 0, 0, 1);
  }
  
  head.matrix.scale(0.8, 0.6, 1.0);
  head.render();
  
  // --- Enemy Eyes (make it look scary) ---
  var leftEye = new Cube();
  leftEye.color = [1.0, 1.0, 0.0, 1.0]; // Yellow eyes
  leftEye.matrix.set(head.matrix);
  leftEye.matrix.translate(0.1, 0.2, -0.01);
  leftEye.matrix.scale(0.2, 0.2, 1.1);
  leftEye.render();
  
  var rightEye = new Cube();
  rightEye.color = [1.0, 1.0, 0.0, 1.0];
  rightEye.matrix.set(head.matrix);
  rightEye.matrix.translate(0.6, 0.2, -0.01);
  rightEye.matrix.scale(0.2, 0.2, 1.1);
  rightEye.render();
  
  // --- Enemy Legs ---
  var leg1 = new Cube();
  leg1.color = [0.7, 0.1, 0.1, 1.0]; // Darker red
  leg1.matrix.set(body.matrix);
  leg1.matrix.translate(0.1, -0.8, 0.1);
  
  // Make legs move while chasing
  if (g_enemy.isChasing) {
    leg1.matrix.rotate(30 * Math.sin(g_seconds * 10), 1, 0, 0);
  }
  
  leg1.matrix.scale(0.2, 0.8, 0.2);
  leg1.render();
  
  var leg2 = new Cube();
  leg2.color = [0.7, 0.1, 0.1, 1.0];
  leg2.matrix.set(body.matrix);
  leg2.matrix.translate(0.7, -0.8, 0.1);
  
  // Make legs move while chasing (opposite phase)
  if (g_enemy.isChasing) {
    leg2.matrix.rotate(30 * Math.sin(g_seconds * 10 + Math.PI), 1, 0, 0);
  }
  
  leg2.matrix.scale(0.2, 0.8, 0.2);
  leg2.render();
}

// Add this function to update the enemy's position and behavior
function updateEnemy() {
  // Calculate distance to player
  const dx = g_characterX - g_enemy.x;
  const dz = g_characterZ - g_enemy.z;
  const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
  
  // Check if enemy should be chasing
  if (distanceToPlayer < g_enemy.detectionRange) {
    g_enemy.isChasing = true;
    
    // Only update path occasionally to save performance
    const now = performance.now();
    if (now - g_enemy.lastPathUpdate > g_enemy.pathUpdateInterval) {
      g_enemy.lastPathUpdate = now;
      
      // Simple direct path - in a more complex game you'd implement A* pathfinding
      g_enemy.targetX = g_characterX;
      g_enemy.targetZ = g_characterZ;
    }
    
    // Calculate direction to move
    let moveX = 0;
    let moveZ = 0;
    
    // If very close to player, slow down to prevent jittering
    if (distanceToPlayer > 0.5) {
      moveX = dx / distanceToPlayer * g_enemy.speed;
      moveZ = dz / distanceToPlayer * g_enemy.speed;
      
      // Try to move along X axis
      let newX = g_enemy.x + moveX;
      if (!checkCollision(newX, g_enemy.z)) {
        g_enemy.x = newX;
      } else {
        // Try to find way around obstacle
        const sideStep = (Math.random() > 0.5) ? 0.1 : -0.1;
        if (!checkCollision(g_enemy.x, g_enemy.z + sideStep)) {
          g_enemy.z += sideStep;
        }
      }
      
      // Try to move along Z axis
      let newZ = g_enemy.z + moveZ;
      if (!checkCollision(g_enemy.x, newZ)) {
        g_enemy.z = newZ;
      } else {
        // Try to find way around obstacle
        const sideStep = (Math.random() > 0.5) ? 0.1 : -0.1;
        if (!checkCollision(g_enemy.x + sideStep, g_enemy.z)) {
          g_enemy.x += sideStep;
        }
      }
    }
    
    // Make a growling sound when close (you'd add actual sound in a full game)
    if (distanceToPlayer < 1.5) {
      // In a real game, you would play a sound here
      if (Math.random() < 0.01) {
        console.log("Enemy growls!");
      }
    }
  } else {
    g_enemy.isChasing = false;
    
    // When not chasing, wander randomly
    if (Math.random() < 0.01) {
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = 3 + Math.random() * 3;
      
      g_enemy.targetX = g_enemy.x + Math.sin(randomAngle) * randomDistance;
      g_enemy.targetZ = g_enemy.z + Math.cos(randomAngle) * randomDistance;
      
      // Make sure target is within map bounds
      g_enemy.targetX = Math.max(-15, Math.min(15, g_enemy.targetX));
      g_enemy.targetZ = Math.max(-15, Math.min(15, g_enemy.targetZ));
    }
    
    // Move toward target position
    if (g_enemy.targetX !== undefined && g_enemy.targetZ !== undefined) {
      const tdx = g_enemy.targetX - g_enemy.x;
      const tdz = g_enemy.targetZ - g_enemy.z;
      const targetDist = Math.sqrt(tdx * tdx + tdz * tdz);
      
      if (targetDist > 0.1) {
        const wanderSpeed = g_enemy.speed * 0.5; // Move slower when wandering
        const moveX = tdx / targetDist * wanderSpeed;
        const moveZ = tdz / targetDist * wanderSpeed;
        
        if (!checkCollision(g_enemy.x + moveX, g_enemy.z)) {
          g_enemy.x += moveX;
        }
        
        if (!checkCollision(g_enemy.x, g_enemy.z + moveZ)) {
          g_enemy.z += moveZ;
        }
      }
    }
  }
}

// Check if player has been caught by the enemy
function checkPlayerCaught() {
  const dx = g_characterX - g_enemy.x;
  const dz = g_characterZ - g_enemy.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  if (distance < 0.6) {
    // Player is caught!
    return true;
  }
  return false;
}

// Add to UI at the beginning of your program
function addEnemyUI() {
  const statsDiv = document.getElementById('stats') || document.body;
  
  // Create status display for enemy state
  const enemyStatus = document.createElement('div');
  enemyStatus.id = 'enemyStatus';
  enemyStatus.style.position = 'absolute';
  enemyStatus.style.top = '100px';
  enemyStatus.style.right = '20px';
  enemyStatus.style.backgroundColor = 'rgba(255, 100, 100, 0.7)';
  enemyStatus.style.padding = '10px';
  enemyStatus.style.borderRadius = '5px';
  enemyStatus.style.color = 'white';
  enemyStatus.style.fontFamily = 'Arial, sans-serif';
  enemyStatus.style.fontSize = '14px';
  enemyStatus.innerHTML = 'Enemy: Not chasing';
  
  statsDiv.appendChild(enemyStatus);
  
  // Add a reset button to respawn if caught
  const resetButton = document.createElement('button');
  resetButton.id = 'resetButton';
  resetButton.style.position = 'absolute';
  resetButton.style.top = '150px';
  resetButton.style.right = '20px';
  resetButton.style.padding = '10px';
  resetButton.style.backgroundColor = '#ff3333';
  resetButton.style.color = 'white';
  resetButton.style.border = 'none';
  resetButton.style.borderRadius = '5px';
  resetButton.style.display = 'none';
  resetButton.style.fontFamily = 'Arial, sans-serif';
  resetButton.innerText = 'Respawn';
  
  resetButton.onclick = function() {
    // Reset player position
    g_characterX = 0;
    g_characterZ = 0;
    
    // Move enemy away
    g_enemy.x = 10;
    g_enemy.z = 10;
    
    resetButton.style.display = 'none';
  };
  
  statsDiv.appendChild(resetButton);
}

// Update the enemy status UI
function updateEnemyUI() {
  const enemyStatus = document.getElementById('enemyStatus');
  if (enemyStatus) {
    const dx = g_characterX - g_enemy.x;
    const dz = g_characterZ - g_enemy.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (g_enemy.isChasing) {
      enemyStatus.innerHTML = `Enemy: CHASING! (${distance.toFixed(1)} units away)`;
      enemyStatus.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    } else {
      enemyStatus.innerHTML = `Enemy: Wandering (${distance.toFixed(1)} units away)`;
      enemyStatus.style.backgroundColor = 'rgba(100, 100, 100, 0.7)';
    }
  }
  
  // Show reset button if caught
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    if (checkPlayerCaught()) {
      resetButton.style.display = 'block';
    }
  }
}
// Modify the main function to initialize the enemy UI
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsFromHtmlUI();
  addEnemyUI(); // Add this line to initialize enemy UI
  
  // Setup camera
  camera = new Camera([0, 0, 3], [0, 0, 0], [0, 1, 0]);
  
  // Set up mouse controls
  canvas.onmousedown = function(ev) {
    g_mouseDown = true;
    g_lastX = ev.clientX;
  };
  
  canvas.onmouseup = function() {
    g_mouseDown = false;
  };
  
  canvas.onmousemove = function(ev) {
    if (g_mouseDown) {
        let deltaX = ev.clientX - g_lastX;
        g_lastX = ev.clientX;
        
        // Calculate horizontal angle in radians
        let angle = deltaX * 0.01;
        
        // Get camera direction vector
        let dir = new Vector3([
            camera.at.elements[0] - camera.eye.elements[0],
            camera.at.elements[1] - camera.eye.elements[1],
            camera.at.elements[2] - camera.eye.elements[2]
        ]);
        
        let x = dir.elements[0];
        let z = dir.elements[2];
        
        // Rotate view direction around Y axis
        let cosA = Math.cos(angle);
        let sinA = Math.sin(angle);
        let newX = x * cosA - z * sinA;
        let newZ = x * sinA + z * cosA;
        
        // Update camera look-at point
        camera.at.elements[0] = camera.eye.elements[0] + newX;
        camera.at.elements[2] = camera.eye.elements[2] + newZ;
        
        renderAllShapes();
    }
  };

  document.onkeydown = keydown;
  initTextures();

  gl.clearColor(0.8, 0.9, 1.0, 1.0);
  // Start animation loop
  g_startTime = performance.now()/1000.0;
  requestAnimationFrame(tick);
}

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  
  // FPS calculation
  let now = performance.now();
  g_frameCount++;
  if (now - g_lastFrameTime >= 1000.0) {
    g_fps = g_frameCount;
    g_frameCount = 0;
    g_lastFrameTime = now;
    sendTextToHtml(g_fps, 'fpsValue');
  }
  
  updateAnimationAngles();
  updateEnemy(); // Add this line to update the enemy
  updateEnemyUI(); // Add this line to update the enemy UI
  renderAllShapes();
  requestAnimationFrame(tick);
}

const COLLISION_BUFFER = 0.5; // Adjust this value for larger/smaller buffer
function checkCollision(newX, newZ) {
  // Check four points around the character (front, back, left, right)
  const pointsToCheck = [
    { x: newX + COLLISION_BUFFER, z: newZ },  // Right
    { x: newX - COLLISION_BUFFER, z: newZ },  // Left
    { x: newX, z: newZ + COLLISION_BUFFER },  // Front
    { x: newX, z: newZ - COLLISION_BUFFER }   // Back
  ];

  for (const point of pointsToCheck) {
    const gridX = Math.floor(point.x + 16);
    const gridZ = Math.floor(point.z + 16);
    
    // Check bounds
    if (gridX < 0 || gridX >= 32 || gridZ < 0 || gridZ >= 32) {
      return true;
    }
    
    // Check if any point would be in a wall
    if (g_map[gridZ][gridX] === 1) {
      return true;
    }
  }
  
  return false;
}
function updateAnimationAngles() {
  if (g_walkingAnimation) {
    // Walking animation logic

    
    // Calculate proposed new position
    const moveX = Math.sin(g_globalAngle * Math.PI / 180) * g_characterSpeed;
    const moveZ = Math.cos(g_globalAngle * Math.PI / 180) * g_characterSpeed;
    const newX = g_characterX + moveX;
    const newZ = g_characterZ + moveZ;
    
    // Only update position if no collision would occur
    if (!checkCollision(newX, newZ)) {
      g_headAngle = 10 * Math.sin(g_seconds * 2);
      g_leftArmAngle = 30 * Math.sin(g_seconds * 4);
      g_rightArmAngle = -30 * Math.sin(g_seconds * 4);
      g_leftLegAngle = -30 * Math.sin(g_seconds * 4);
      g_rightLegAngle = 30 * Math.sin(g_seconds * 4);
      g_characterX = newX;
      g_characterZ = newZ;
    } else {
      // Optional: Play a bump sound or show visual feedback
      console.log("Collision avoided!");
    }
  }
  
  // Keep existing yellow/magenta animation code
  if (g_yellowAnimation) {
    g_yellowAngle = 20 * Math.sin(g_seconds);
  }
  
  if (g_magentaAnimation) {
    g_magentaAngle = 15 * Math.sin(g_seconds * 2);
  }
}
const COLORS = {
  LIGHT_GRAY: [0.7, 0.7, 0.7, 1.0],
  DARK_GRAY: [0.6, 0.6, 0.6, 1.0],
  BLACK: [0.0, 0.0, 0.0, 1.0],
};

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function renderAllShapes() {
  var startTime = performance.now();
  // Set projection matrix
  let projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 100); 
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  
  // Use camera's view matrix
  let viewMat = new Matrix4();
  viewMat.setLookAt(
    camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2],
    camera.at.elements[0], camera.at.elements[1], camera.at.elements[2],
    camera.up.elements[0], camera.up.elements[1], camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
  
  // Global rotation
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw skybox
  var sky = new Cube();
  sky.textureNum = 0;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  // Draw floor
  var floor = new Cube();
  floor.color = [0.5, 0.5, 0.1, 1.0];
  floor.textureNum = -3;
  floor.matrix.translate(0, -0.75, 0);
  floor.matrix.scale(32, 0, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.matrix.translate(0, 0, -0.001);
  floor.render();

  // Draw map walls
  drawMap();
  
  // Draw enemy
  drawEnemy();

  // Draw character (your existing character code...)
  // --- Body ---
  var body = new Cube();
  body.color = [0.7, 0.7, 0.7, 1];
    
  // Position the character based on movement variables
  body.matrix.translate(g_characterX, -0.6, g_characterZ);
  body.matrix.rotate(g_globalAngle, 0, 1, 0); // Rotate character based on global angle
  body.matrix.scale(0.5, 0.7, 0.3);
  body.render();

  // Rest of your character rendering code...
  // --- Head ---
  var head = new Cube();
  head.color = COLORS.LIGHT_GRAY;
  head.matrix.set(body.matrix);
  head.matrix.translate(-0.1, 0.8, -0.2);
  head.matrix.translate(0.5,0.1,0.3);
  head.matrix.rotate(g_headAngle, 0,0,1);
  head.matrix.translate(-0.5,-0.1,-0.3);
  head.matrix.scale(0.6/0.5, 0.6/0.7, 1.5); // Bigger head
  head.render();

  // --- Left Ear ---
  var leftEar = new Cube();
  leftEar.color = COLORS.DARK_GRAY;
  leftEar.matrix.set(head.matrix);
  leftEar.matrix.translate(-0.2, 0.8, -0.001);
  leftEar.matrix.rotate(g_earAngle, 1,0,0);
  leftEar.matrix.scale(0.4, 0.4, 0.4); // Bigger ears
  leftEar.render();

  // --- Right Ear ---
  var rightEar = new Cube();
  rightEar.color = COLORS.DARK_GRAY;
  rightEar.matrix.set(head.matrix);
  rightEar.matrix.translate(0.85, 0.8, -0.001);
  rightEar.matrix.rotate(-g_earAngle, 1,0,0);
  rightEar.matrix.scale(0.4, 0.4, 0.4); // Bigger ears
  rightEar.render();

  var leftArm = new Cube();
  leftArm.color = COLORS.DARK_GRAY;
  leftArm.matrix.set(body.matrix);
  leftArm.matrix.translate(-0.3, 0.05, 0.15);
  leftArm.matrix.translate(0.25, 0.6, 0);
  leftArm.matrix.rotate(g_leftArmAngle, 0,0,1);
  leftArm.matrix.translate(-0.25, -0.6, 0);
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
  rightLeg.matrix.scale(0.2, 0.5, 0.2);
  rightLeg.render();

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "fpsCounter");
}

function drawMap() {
  // Only render visible chunks (simple view frustum culling)
  const cameraX = Math.floor(camera.eye.elements[0] + 16);
  const cameraZ = Math.floor(camera.eye.elements[2] + 16);
  const renderDistance = 30; // Only render blocks within this distance
  
  for (let z = Math.max(0, cameraZ - renderDistance); z < Math.min(32, cameraZ + renderDistance); z++) {
      for (let x = Math.max(0, cameraX - renderDistance); x < Math.min(32, cameraX + renderDistance); x++) {
          if (g_map[z][x] === 1) {  // Note: g_map[z][x] format
              const wall = new Cube();
              wall.color = [0.2, 0.5, 0.2, 1.0];
              wall.textureNum = -1;
              wall.matrix.translate(x - 16, -0.75, z - 16);
              wall.matrix.scale(1, 1, 1);
              wall.render();
          }
      }
  }
}

function keydown(ev) {
  if (!camera) {
    console.error("Camera not initialized!");
    return;
  }
  
  try {
    switch(ev.keyCode) {
      case 87: camera.forward(); break;    // W
      case 83: camera.backward(); break;   // S
      case 65: camera.left(); break;       // A
      case 68: camera.right(); break;      // D
      case 81: camera.panLeft(); break;    // Q
      case 69: camera.panRight(); break;   // E
      case 70: addBlockInFront(); break;   // F - Add block
      case 82: removeBlockInFront(); break;// R - Remove block
    }
    renderAllShapes();
  } catch (e) {
    console.error("Camera error:", e);
  }
}

function addBlockInFront() {
  // Calculate position in front of camera (1 unit away)
  const viewDir = new Vector3().set(camera.at).sub(camera.eye).normalize();
  const blockWorldX = camera.eye.elements[0] + viewDir.elements[0] * 1.5;
  const blockWorldZ = camera.eye.elements[2] + viewDir.elements[2] * 1.5;
  
  // Convert to map coordinates
  const blockX = Math.floor(blockWorldX + 16);
  const blockZ = Math.floor(blockWorldZ + 16);
  
  // Check bounds
  if (blockX >= 0 && blockX < 32 && blockZ >= 0 && blockZ < 32) {
      if (g_map[blockZ][blockX] === 0) {  // Note: g_map[z][x] format
          g_map[blockZ][blockX] = g_selectedBlockType;
          console.log(`Added block at (${blockX}, ${blockZ})`);
          renderAllShapes(); // Force immediate redraw
      }
  }
}

function removeBlockInFront() {
  // Calculate position in front of camera (1 unit away)
  const viewDir = new Vector3().set(camera.at).sub(camera.eye).normalize();
  const blockWorldX = camera.eye.elements[0] + viewDir.elements[0] * 1.5;
  const blockWorldZ = camera.eye.elements[2] + viewDir.elements[2] * 1.5;
  
  // Convert to map coordinates
  const blockX = Math.floor(blockWorldX + 16);
  const blockZ = Math.floor(blockWorldZ + 16);
  
  // Check bounds
  if (blockX >= 0 && blockX < 32 && blockZ >= 0 && blockZ < 32) {
      if (g_map[blockZ][blockX] === 1) {  // Note: g_map[z][x] format
          g_map[blockZ][blockX] = 0;
          console.log(`Removed block at (${blockX}, ${blockZ})`);
          renderAllShapes(); // Force immediate redraw
      }
  }
}


