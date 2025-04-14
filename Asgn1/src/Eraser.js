class Eraser {
  constructor() {
    this.type = 'eraser';
    this.position = [0.0, 0.0];
    this.size = 10.0;
    this.direction = [0.0, 0.0];
  }

  render() {
    // Eraser is just a white circle that draws over everything
    gl.uniform4f(u_FragColor, 0.0, 0.0, 0.0, 1.0);
    
    const d = this.size/200.0;
    const segments = 12;
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
  }
}
