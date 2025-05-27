class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;  // Default to solid color
    this.normalMatrix = new Matrix4();
  }

  render() {
    var rgba = this.color;

    // Pass the texture number to u_whichTexture
    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color to u_FragColor
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    //Front 
    drawTriangle3DUVNormal([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0], [0,0,-1,0,0,-1,0,0,-1]);
    drawTriangle3DUVNormal([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1], [0,0,-1,0,0,-1,0,0,-1]);

    // var colorScale = 0.9
    // gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Right
    drawTriangle3DUVNormal([1, 1, 0, 1, 1, 1, 1, 0, 0], [0,0,0,1,1,1], [1, 0, 0, 1, 0, 0, 1, 0, 0]);
    drawTriangle3DUVNormal([1, 0, 0, 1, 1, 1, 1, 0, 1], [0,0,1,1,1,0], [1, 0, 0, 1, 0, 0, 1, 0, 0]);
        
    // colorScale = 0.8
    // gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Top
    drawTriangle3DUVNormal([0, 1, 0, 0, 1, 1, 1, 1, 1], [0,0,0,1,1,1], [0, 1, 0, 0, 1, 0, 0, 1, 0]);
    drawTriangle3DUVNormal([0, 1, 0, 1, 1, 1, 1, 1, 0], [0,0,1,1,1,0], [0, 1, 0, 0, 1, 0, 0, 1, 0]);
        
    // colorScale = 0.7
    // gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Left
    drawTriangle3DUVNormal([0, 1, 0, 0, 1, 1, 0, 0, 0], [0,0,0,1,1,1], [-1, 0, 0, -1, 0, 0, -1, 0, 0]);
    drawTriangle3DUVNormal([0, 0, 0, 0, 1, 1, 0, 0, 1], [0,0,1,1,1,0], [-1, 0, 0, -1, 0, 0, -1, 0, 0]);

    // colorScale = 0.6
    // gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Back
    drawTriangle3DUVNormal([0, 0, 1, 1, 1, 1, 1, 0, 1], [0,0,0,1,1,1], [0, 0, 1, 0, 0, 1, 0, 0, 1]);
    drawTriangle3DUVNormal([0, 0, 1, 0, 1, 1, 1, 1, 1], [0,0,1,1,1,0], [0, 0, 1, 0, 0, 1, 0, 0, 1]);

    // colorScale = 0.5
    // gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Bottom
    drawTriangle3DUVNormal([0, 0, 0, 0, 0, 1, 1, 0, 1], [0,0,0,1,1,1], [0, -1, 0, 0, -1, 0, 0, -1, 0]);
    drawTriangle3DUVNormal([0, 0, 0, 1, 0, 1, 1, 0, 0], [0,0,1,1,1,0], [0, -1, 0, 0, -1, 0, 0, -1, 0]);

    // gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  }
}