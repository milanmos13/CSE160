// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0, 400, 400);        // Fill a rectangle with the color

  document.getElementById("submit").addEventListener('click', handleDrawEvent);
  document.getElementById("operate").addEventListener('click', handleDrawOperationEvent);
}

function handleDrawEvent(){
  var v1x = parseFloat(document.getElementById("v1x").value);
  var v1y = parseFloat(document.getElementById("v1y").value);

  var v2x = parseFloat(document.getElementById("v2x").value);
  var v2y = parseFloat(document.getElementById("v2y").value);

  var v1 = new Vector3([v1x, v1y, 0]);
  var v2 = new Vector3([v2x, v2y, 0]);

  var canvas = document.getElementById('example');  
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, 400, 400);

  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  var scalar = document.getElementById("scalar").value;
  var value = document.getElementById("operations").value;
  var v1x = parseFloat(document.getElementById("v1x").value);
  var v1y = parseFloat(document.getElementById("v1y").value);

  var v2x = parseFloat(document.getElementById("v2x").value);
  var v2y = parseFloat(document.getElementById("v2y").value);

  var v1 = new Vector3([v1x, v1y, 0]);
  var v2 = new Vector3([v2x, v2y, 0]);
  handleDrawEvent();
  if (value == "add") {
    let v3 = new Vector3();
    v3.set(v1);
    v3.add(v2);
    drawVector(v3,"green");
  }
  else if (value == "sub") {
    let v3 = new Vector3();
    v3.set(v1);
    v3.sub(v2);
    drawVector(v3,"green");
  }

  else if (value == "mul") {
    let v3 = new Vector3();
    let v4 = new Vector3();
    v3.set(v1);
    v4.set(v2);
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3,"green");
    drawVector(v4,"green");
  }

  else if (value == "div") {
    if (scalar == 0) {
      alert("Scalar cannot be 0 for div");
      return;
    }
    let v3 = new Vector3();
    let v4 = new Vector3();
    v3.set(v1);
    v4.set(v2);
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3,"green");
    drawVector(v4,"green");
  }

  else if (value == "mag") {
    console.log("Magnitude v1: ", v1.magnitude());
    console.log("Magnitude v2: ", v2.magnitude());
  }

  else if (value == "normal") {
    v1.normalize();
    v2.normalize();
    drawVector(v1,"green");
    drawVector(v2,"green");
  }

  else if (value == "angle") {
    var mag1 = v1.magnitude();
    var mag2 = v2.magnitude();
    var dot = Vector3.dot(v1,v2);
    console.log("Angle: ", Math.acos((dot/mag1)/mag2)*(180/Math.PI) );
  }

  else if (value == "area") {
    var cross = Vector3.cross(v1,v2);
    console.log(cross.elements);
    console.log("Area of the triangle: ", areaTriangle(v1,v2));
  }
}

function areaTriangle(v1, v2) {
  var cross = Vector3.cross(v1,v2);
  return cross.magnitude()/2;

}

function drawVector(v, color) {
  var canvas = document.getElementById('example');  
  var ctx = canvas.getContext('2d');
  var x = v.elements[0];
  var y = v.elements[1];
  var scaledX = x * 20;
  var scaledY = y * 20;
  ctx.beginPath();
  ctx.moveTo(200, 200);
  ctx.lineTo(200 + scaledX, 200 - scaledY);
  ctx.strokeStyle = color;
  ctx.stroke();
}