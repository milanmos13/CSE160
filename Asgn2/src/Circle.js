// class Circle {
//     constructor () {
//       this.type = 'circle';
//       this.position = [0.0,0.0,0.0];
//       this.color = [1.0,1.0,1.0,1.0];
//       this.size = 5.0;
//       this.segments = 10;
//     }
  
//     render() {
//       var xy = this.position;
//       var rgba = this.color;
//       var size = this.size;
  
//       // Pass the color of a point to u_FragColor variable
//       gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

//         var d = size/200.0; // delta

//         let angleStep = 360/this.segments;
//         for(var angle = 0; angle < 360; angle += angleStep) {
//         let centerPt = [xy[0], xy[1]];
//         let angle1 = angle;
//         let angle2 = angle + angleStep;
//         let vec1 = [Math.cos(angle1*Math.PI/180)*d, Math.sin(angle1*Math.PI/180)*d];
//         let vec2 = [Math.cos(angle2*Math.PI/180)*d, Math.sin(angle2*Math.PI/180)*d];
//         let pt1 = [centerPt[0]+vec1[0], centerPt[1]+vec1[1]];
//         let pt2 = [centerPt[0]+vec2[0], centerPt[1]+vec2[1]];

//         drawTriangle([xy[0], xy[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
//         }

//     }

// }

// function drawTriangle(vertices) {
//     // var vertices = new Float32Array([
//     //   0, 0.5,   -0.5, -0.5,   0.5, -0.5
//     // ]);
//     var n = 3; // The number of vertices
  
//     // Create a buffer object
//     var vertexBuffer = gl.createBuffer();
//     if (!vertexBuffer) {
//       console.log('Failed to create the buffer object');
//       return -1;
//     }
  
//     // Bind the buffer object to target
//     gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
//     // Write date into the buffer object
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  
//     // var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
//     // if (a_Position < 0) {
//     //   console.log('Failed to get the storage location of a_Position');
//     //   return -1;
//     // }
//     // Assign the buffer object to a_Position variable
//     gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  
//     // Enable the assignment to a_Position variable
//     gl.enableVertexAttribArray(a_Position);
//     gl.drawArrays(gl.TRIANGLES, 0, n);
  
//     // return n;
//   }
class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0, 0.0]; // Position in 3D space
    this.color = [1.0, 1.0, 1.0, 1.0]; // RGBA color
    this.size = 5.0; // Radius of the circle
    this.segments = 10; // Number of segments (slices of the circle)
    this.matrix = new Matrix4(); // Transformation matrix
  }

  render() {
    var rgba = this.color;
    
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Apply the transformation matrix (if any)
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var d = this.size / 200.0; // Delta to scale the vertices
    let angleStep = 360 / this.segments; // Angle between each segment

    // Array to hold all the vertices for the circle
    var vertices = [];

    for (var angle = 0; angle < 360; angle += angleStep) {
      let centerPt = [this.position[0], this.position[1]]; // Circle center in the XY plane
      let angle1 = angle;
      let angle2 = angle + angleStep;

      // Convert angles to radians and calculate the points on the circle's circumference
      let vec1 = [Math.cos(angle1 * Math.PI / 180) * d, Math.sin(angle1 * Math.PI / 180) * d];
      let vec2 = [Math.cos(angle2 * Math.PI / 180) * d, Math.sin(angle2 * Math.PI / 180) * d];

      // Calculate the vertices for the triangle to form a segment of the circle
      let pt1 = [centerPt[0] + vec1[0], centerPt[1] + vec1[1]];
      let pt2 = [centerPt[0] + vec2[0], centerPt[1] + vec2[1]];

      // Add vertices to the array (center point + 2 points for the segment)
      vertices.push(centerPt[0], centerPt[1], pt1[0], pt1[1], pt2[0], pt2[1]);
    }

    // Draw the triangles for the circle
    this.drawCircleVertices(vertices);
  }

  drawCircleVertices(vertices) {
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Get attribute location and enable it
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Draw the circle by drawing all the triangles (vertices.length / 2 for x, y pairs)
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
  }
}

function drawTriangle(vertices) {
  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3); // Draw the triangle
}
