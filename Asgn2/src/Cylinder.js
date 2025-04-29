class Cylinder {
    constructor(parentMatrix = null) {
      this.type = 'cylinder';
      this.position = [0.0, 0.0, 0.0];  // Position of the cylinder in 3D space
      this.color = [1.0, 1.0, 1.0, 1.0];  // RGBA color
      this.radius = 5.0;  // Radius of the cylinder's base
      this.height = 10.0;  // Height of the cylinder
      this.segments = 20;  // Number of segments (slices) for the cylinder's sides
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
  
      var angleStep = 360 / this.segments;
      var vertices = [];
  
      // Draw the side faces of the cylinder (connecting top and bottom)
      for (var angle = 0; angle < 360; angle += angleStep) {
        let angle1 = angle * Math.PI / 180;
        let angle2 = (angle + angleStep) * Math.PI / 180;
        
        // Points for the top and bottom circles
        let x1 = Math.cos(angle1) * this.radius;
        let y1 = Math.sin(angle1) * this.radius;
        let x2 = Math.cos(angle2) * this.radius;
        let y2 = Math.sin(angle2) * this.radius;
        
        // Top and bottom center points
        let topCenter = [0.0, 0.0, this.height / 2];
        let bottomCenter = [0.0, 0.0, -this.height / 2];
        
        // Top and bottom circle points
        let topPoint1 = [x1, y1, this.height / 2];
        let topPoint2 = [x2, y2, this.height / 2];
        let bottomPoint1 = [x1, y1, -this.height / 2];
        let bottomPoint2 = [x2, y2, -this.height / 2];
        
        // Side faces (quad split into two triangles)
        // Top triangle
        vertices.push(topCenter[0], topCenter[1], topCenter[2], topPoint1[0], topPoint1[1], topPoint1[2], topPoint2[0], topPoint2[1], topPoint2[2]);
        // Bottom triangle
        vertices.push(bottomCenter[0], bottomCenter[1], bottomCenter[2], bottomPoint2[0], bottomPoint2[1], bottomPoint2[2], bottomPoint1[0], bottomPoint1[1], bottomPoint1[2]);
  
        // Side faces (connect top and bottom)
        vertices.push(topPoint1[0], topPoint1[1], topPoint1[2], bottomPoint1[0], bottomPoint1[1], bottomPoint1[2], topPoint2[0], topPoint2[1], topPoint2[2]);
        vertices.push(bottomPoint1[0], bottomPoint1[1], bottomPoint1[2], bottomPoint2[0], bottomPoint2[1], bottomPoint2[2], topPoint2[0], topPoint2[1], topPoint2[2]);
      }
  
      // Now render the cylinder vertices
      this.drawCylinderVertices(vertices);
    }
  
    drawCylinderVertices(vertices) {
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
  
      // Draw the cylinder by drawing all the triangles (vertices.length / 3 for x, y, z triples)
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
    }
  }
  