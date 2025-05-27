class Pyramid {
    constructor(parentMatrix = null) {
      this.type = 'pyramid';
      this.position = [0.0, 0.0, 0.0];  // Position of the pyramid in 3D space
      this.color = [1.0, 1.0, 1.0, 1.0];  // RGBA color
      this.size = 5.0;  // Size (height and base)
      this.matrix = new Matrix4();  // Transformation matrix
      this.parentMatrix = parentMatrix;  // Matrix of the parent (head)
    }
  
    render() {
      var rgba = this.color;
      
      // Pass the color of a point to u_FragColor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  
      // Apply the parent's transformation matrix (head's matrix)
      if (this.parentMatrix) {
        this.matrix.multiply(this.parentMatrix);  // Inherit transformations from parent (head)
      }
  
      // Apply the transformation matrix (if any)
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      // Define pyramid vertices
      var baseSize = this.size;  // Base size of the pyramid
      var height = this.size;  // Height of the pyramid
  
      // Base vertices
      var v0 = [-baseSize / 2, -baseSize / 2, 0];  // Bottom left corner
      var v1 = [baseSize / 2, -baseSize / 2, 0];   // Bottom right corner
      var v2 = [baseSize / 2, baseSize / 2, 0];    // Top right corner
      var v3 = [-baseSize / 2, baseSize / 2, 0];   // Top left corner
      var apex = [0.0, 0.0, height];  // Apex of the pyramid
  
      // Array to store vertices for the pyramid faces
      var vertices = [
        // Base (quadrilateral, divided into two triangles)
        ...this.createTriangle(v0, v1, v2),
        ...this.createTriangle(v0, v2, v3),
  
        // Sides (4 triangular faces)
        ...this.createTriangle(v0, v1, apex),
        ...this.createTriangle(v1, v2, apex),
        ...this.createTriangle(v2, v3, apex),
        ...this.createTriangle(v3, v0, apex)
      ];
  
      // Render the pyramid
      this.drawPyramidVertices(vertices);
    }
  
    // Helper method to create a triangle
    createTriangle(v1, v2, v3) {
      return [
        v1[0], v1[1], v1[2],
        v2[0], v2[1], v2[2],
        v3[0], v3[1], v3[2]
      ];
    }
  
    // Method to draw the pyramid's vertices
    drawPyramidVertices(vertices) {
      // Create a buffer object
      var vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return;
      }
  
      // Bind the buffer object to target
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      // Write data into the buffer object
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  
      // Get attribute location for position and enable it
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
      }
      
      // Assign the buffer object to a_Position variable
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      // Draw the pyramid by drawing all the triangles (vertices.length / 3 for x, y, z triples)
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
    }
  }
  