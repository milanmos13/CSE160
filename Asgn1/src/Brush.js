class Brush {
  constructor() {
    this.type = 'brush';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 0.7]; // Default to semi-transparent
    this.size = 10.0;
    this.direction = [0.0, 0.0]; // For brush orientation
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    
    // Calculate brush orientation if there's direction data
    let angle = 0;
    if (this.direction[0] !== 0 || this.direction[1] !== 0) {
      angle = Math.atan2(this.direction[1], this.direction[0]);
    }
    
    const size = this.size;
    const segments = 8; // Brush segments
    
    // Main brush circle
    const d = size/200.0;
    let angleStep = 360/segments;
    
    for(var a = 0; a < 360; a += angleStep) {
      let centerPt = this.position;
      let angle1 = a;
      let angle2 = a + angleStep;
      let vec1 = [Math.cos(angle1*Math.PI/180)*d, Math.sin(angle1*Math.PI/180)*d];
      let vec2 = [Math.cos(angle2*Math.PI/180)*d, Math.sin(angle2*Math.PI/180)*d];
      let pt1 = [centerPt[0]+vec1[0], centerPt[1]+vec1[1]];
      let pt2 = [centerPt[0]+vec2[0], centerPt[1]+vec2[1]];
      
      drawTriangle([centerPt[0], centerPt[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
    }
    
    // Add directional elements to make the brush look more natural
    if (angle !== 0) {
      const tipLength = size/100.0;
      const tipX = this.position[0] + Math.cos(angle) * tipLength;
      const tipY = this.position[1] + Math.sin(angle) * tipLength;
      
      // Draw a small tip in the direction of movement
      gl.uniform4f(u_FragColor, 
        this.color[0]*0.8, this.color[1]*0.8, this.color[2]*0.8, this.color[3]);
      
      drawTriangle([
        tipX, tipY,
        this.position[0] + Math.cos(angle + Math.PI/2) * d/2,
        this.position[1] + Math.sin(angle + Math.PI/2) * d/2,
        this.position[0] + Math.cos(angle - Math.PI/2) * d/2,
        this.position[1] + Math.sin(angle - Math.PI/2) * d/2
      ]);
    }
  }
}

function drawTriangle(vertices) {
  var n = 3;
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, n);
}