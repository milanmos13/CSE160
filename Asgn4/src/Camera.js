// class Camera {
//     constructor(eye, at, up) {
//       this.eye = new Vector3(eye);
//       this.at = new Vector3(at);
//       this.up = new Vector3(up);
//       this.stepSize = 0.05;
//       this.rotationAngle = 5 * Math.PI / 180;
//     }
  
//     _viewDir() {
//         return new Vector3().set(this.at).sub(this.eye);
//       }
  
//     forward() {
//         const stepVec = new Vector3().set(this._viewDir()).normalize().mul(this.stepSize);
//         this.eye = this.eye.add(stepVec);
//         this.at = this.at.add(stepVec);
//       }
    
//       backward() {
//         const stepVec = new Vector3().set(this._viewDir()).normalize().mul(this.stepSize);
//         this.eye = this.eye.sub(stepVec);
//         this.at = this.at.sub(stepVec);
//       }
    
//       left() {
//         const strafeVec = Vector3.cross(this._viewDir(), this.up).normalize().mul(this.stepSize);
//         this.eye = this.eye.sub(strafeVec);
//         this.at = this.at.sub(strafeVec);
//       }
    
//       right() {
//         const strafeVec = Vector3.cross(this._viewDir(), this.up).normalize().mul(this.stepSize);
//         this.eye = this.eye.add(strafeVec);
//         this.at = this.at.add(strafeVec);
//       }
  
//       panLeft() {
//         this._rotateAroundUp(-this.rotationAngle);
//       }
    
//       panRight() {
//         this._rotateAroundUp(this.rotationAngle);
//       }
    
//       _rotateAroundUp(angle) {
//         const dir = new Vector3().set(this.at).sub(this.eye);
//         const x = dir.elements[0];
//         const z = dir.elements[2];
//         const y = dir.elements[1];
    
//         const cosA = Math.cos(angle);
//         const sinA = Math.sin(angle);
//         const newX = x * cosA - z * sinA;
//         const newZ = x * sinA + z * cosA;
    
//         const rotatedDir = new Vector3([newX, y, newZ]);
//         this.at = new Vector3().set(this.eye).add(rotatedDir);
//       }
//   }

class Camera {
  constructor() {
      this.eye = new Vector3([0, 0, 3]);
      this.at = new Vector3([-0.25, -0.15, 0.0]); // Centered around the body
      this.up = new Vector3([0, 1, 0]);
      this.viewMatrix = new Matrix4();
  }

  forward() { // Using the forward direction formula
      var f = new Vector3(); 
      f.set(this.at);
      f.sub(this.eye);
      f.normalize();
      this.eye = this.eye.add(f);
      this.at = this.at.add(f);
  }

  back() { // Using the back direction formula
      var f = new Vector3(); 
      f.set(this.at);
      f.sub(this.eye);
      f.normalize();
      this.eye = this.eye.sub(f);
      this.at = this.at.sub(f);
  }

  left() { // Using the left direction formula
      var f = new Vector3();
      var s = new Vector3();
      f.set(this.at);
      f.sub(this.eye);
      s.set(Vector3.cross(f, this.up));
      s.normalize();
      this.at = this.at.sub(s);
      this.eye = this.eye.sub(s);
  }

  right() { // Using the right direction formula
      var f = new Vector3();
      var s = new Vector3();
      f.set(this.at);
      f.sub(this.eye);
      s.set(Vector3.cross(f, this.up));
      s.normalize();
      this.at = this.at.add(s);
      this.eye = this.eye.add(s);
  }

  panLeft() { // Using the left pan rotation formula
      var f = new Vector3();
      var f_prime = new Vector3();
      var rotationMatrix = new Matrix4();
      f.set(this.at);
      f.sub(this.eye);
      rotationMatrix.setRotate(5, this.up.elements[0], this.up.elements[1], this.up.elements[2]); // Panning by +5 degrees
      f_prime = rotationMatrix.multiplyVector3(f);
      this.at.set(this.eye);
      this.at.add(f_prime);
  }

  panRight() { // Using the right pan rotation formula
      var f = new Vector3();
      var f_prime = new Matrix4();
      var rotationMatrix = new Matrix4();
      f.set(this.at);
      f.sub(this.eye);
      rotationMatrix.setRotate(-5, this.up.elements[0], this.up.elements[1], this.up.elements[2]); // Panning by -5 degrees
      f_prime = rotationMatrix.multiplyVector3(f);
      this.at.set(this.eye);
      this.at.add(f_prime);
  }

  updateCamera(theta, phi) {
      // Set radius and phi
      var radius = Math.sqrt((this.eye.elements[0] - this.at.elements[0]) ** 2 + (this.eye.elements[1] - this.at.elements[1]) ** 2 + (this.eye.elements[2] - this.at.elements[2]) ** 2); // Define radius as length from center (at) to edge of sphere (eye)
      phi = Math.max(0.0001, Math.min(Math.PI - 0.0001, phi));

      // Move the eye vector based on phi and theta
      this.eye.elements[0] = this.at.elements[0] + radius * Math.sin(phi) * Math.sin(theta);
      this.eye.elements[1] = this.at.elements[1] + radius * Math.sin(phi) * Math.cos(phi);
      this.eye.elements[2] = this.at.elements[2] + radius * Math.sin(phi) * Math.cos(theta);

      // Testing prints
      // console.log("EYE[0]", this.eye.elements[0]);
      // console.log("EYE[1]", this.eye.elements[1]);
      // console.log("EYE[2]", this.eye.elements[2]);
      // console.log("AT[0]", this.at.elements[0]);
      // console.log("AT[1]", this.at.elements[1]);
      // console.log("AT[2]", this.at.elements[2]);
      // console.log("UP[0]", this.up.elements[0]);
      // console.log("UP[1]", this.up.elements[1]);
      // console.log("UP[2]", this.up.elements[2]);

      // Update your view matrix here
      this.viewMatrix.setLookAt(
          this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
          this.at.elements[0], this.at.elements[1], this.at.elements[2],
          this.up.elements[0], this.up.elements[1], this.up.elements[2],
      );
  }
}