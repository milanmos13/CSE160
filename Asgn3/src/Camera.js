class Camera {
    constructor(eye, at, up) {
      this.eye = new Vector3(eye);
      this.at = new Vector3(at);
      this.up = new Vector3(up);
      this.stepSize = 0.05;
      this.rotationAngle = 5 * Math.PI / 180;
    }
  
    _viewDir() {
        return new Vector3().set(this.at).sub(this.eye);
      }
  
    forward() {
        const stepVec = new Vector3().set(this._viewDir()).normalize().mul(this.stepSize);
        this.eye = this.eye.add(stepVec);
        this.at = this.at.add(stepVec);
      }
    
      backward() {
        const stepVec = new Vector3().set(this._viewDir()).normalize().mul(this.stepSize);
        this.eye = this.eye.sub(stepVec);
        this.at = this.at.sub(stepVec);
      }
    
      left() {
        const strafeVec = Vector3.cross(this._viewDir(), this.up).normalize().mul(this.stepSize);
        this.eye = this.eye.sub(strafeVec);
        this.at = this.at.sub(strafeVec);
      }
    
      right() {
        const strafeVec = Vector3.cross(this._viewDir(), this.up).normalize().mul(this.stepSize);
        this.eye = this.eye.add(strafeVec);
        this.at = this.at.add(strafeVec);
      }
  
    panLeft() {
      this._rotateAroundUp(this.rotationAngle);
    }
  
    panRight() {
      this._rotateAroundUp(-this.rotationAngle);
    }
  
    _rotateAroundUp(angle) {
      const rotationMat = new Matrix4();
      rotationMat.setRotate(angle * 180/Math.PI, 
                           this.up.elements[0], 
                           this.up.elements[1], 
                           this.up.elements[2]);
      
      const viewDir = this._viewDir();
      const rotatedViewDir = new Vector3();
      rotationMat.multiplyVector3(viewDir, rotatedViewDir);
      
      this.at = new Vector3().set(this.eye).add(rotatedViewDir);
    }
  }