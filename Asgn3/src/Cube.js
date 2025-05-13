class Cube {
  constructor() {
    this.type = 'cube';

    this.color = [1.0,1.0,1.0,1.0];

    this.matrix = new Matrix4();
    this.textureNum=-2;
  }

  render() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    //Front 
    drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0]);
    drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);

    var colorScale = 0.9
    gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Right
    drawTriangle3DUV([1,0,0, 1,0,1, 1,1,1], [0,0, 1,0, 1,1]);
    drawTriangle3DUV([1,0,0, 1,1,0, 1,1,1], [0,0, 0,1, 1,1]);

    colorScale = 0.8
    gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Top
    drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1]);
    drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0]);
    
    colorScale = 0.7
    gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Left
    drawTriangle3DUV([0,0,0, 0,0,1, 0,1,1], [0,0, 1,0, 1,1]);
    drawTriangle3DUV([0,0,0, 0,1,0, 0,1,1], [0,0, 0,1, 1,1]);

    colorScale = 0.6
    gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Back
    drawTriangle3DUV([1,1,1, 0,0,1, 0,1,1], [1,1, 0,0, 0,1]);
    drawTriangle3DUV([1,1,1, 0,0,1, 1,0,1], [1,1, 0,0, 1,0]);

    colorScale = 0.5
    gl.uniform4f(u_FragColor, rgba[0]*colorScale, rgba[1]*colorScale, rgba[2]*colorScale, rgba[3]);

    //Bottom
    drawTriangle3DUV([0,0,0, 0,0,1, 1,0,0], [0,0, 0,1, 1,0]);
    drawTriangle3DUV([0,0,1, 1,0,0, 1,0,1], [0,1, 1,0, 1,1]);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
  }
}