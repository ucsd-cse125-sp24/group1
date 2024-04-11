import { mat4, vec3, vec4 } from "gl-matrix";

class Camera {
  position: vec3;
  forwardDir: vec3;
  upDir: vec3;
  fovY: number;
  aspectRatio: number;
  nearBound: number;
  farBound: number;

  constructor(
    position: vec3,
    forwardDir: vec3,
    upDir: vec3,
    fovY: number,
    aspectRatio: number,
    nearBound: number,
    farBound: number
  ) {
    this.position = position;
    this.forwardDir = forwardDir;
    this.upDir = upDir;
    this.fovY = fovY;
    this.aspectRatio = aspectRatio;
    this.nearBound = nearBound;
    this.farBound = farBound;
  }

  update(transform: mat4): void {
    vec3.transformMat4(this.position, this.position, transform);
    const newForwardDir = vec4.fromValues(
      this.forwardDir[0],
      this.forwardDir[1],
      this.forwardDir[2],
      0
    );
    vec4.transformMat4(newForwardDir, newForwardDir, transform);
    vec3.set(
      this.forwardDir,
      newForwardDir[0],
      newForwardDir[1],
      newForwardDir[2]
    );
  }

  getViewProjectionMatrix(): mat4 {
    const lookAt = mat4.lookAt(
      mat4.create(),
      this.position,
      vec3.add(vec3.create(), this.position, this.forwardDir),
      this.upDir
    );
    const perspective = mat4.perspective(
      mat4.create(),
      this.fovY,
      this.aspectRatio,
      this.nearBound,
      this.farBound
    );
    return mat4.multiply(mat4.create(), perspective, lookAt);
  }
}

export default Camera;
