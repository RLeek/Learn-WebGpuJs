import { vec3, mat4 } from 'https://wgpu-matrix.org/dist/2.x/wgpu-matrix.module.js';

export const camera = class {
    // needs to have a forward matrix
    // needs to calculate the side vector;

    // Replace the rest of these with functions
    constructor(pos, fov, aspect, near, far) {
        this.pos = vec3.create(pos[0], pos[1], pos[2]);
        this.front = vec3.create(0, 0, -1);
        this.up = vec3.create(0,1,0);
        this.right = vec3.normalize(vec3.cross(this.front, this.up));
        this.speed = 0.1

        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.pitch = 0
        this.yaw = -90.0;
    }

    forward() {
        this.pos = vec3.add(this.pos, vec3.mulScalar(this.front,this.speed));
    }

    backward() {
        this.pos = vec3.add(this.pos, vec3.mulScalar(this.front,-this.speed));
    }

    strafeLeft() {
        this.pos = vec3.add(this.pos, vec3.mulScalar(this.right,this.speed));
    }

    strafeRight() {
        this.pos = vec3.add(this.pos, vec3.mulScalar(this.right,-this.speed));
    }

    // still doesn't work
    handleMouseDrag(x, y) {
        this.yaw += x * 0.01;
        this.pitch += y * 0.01;

        //this.yaw = this.yaw % (Math.PI*2);
        this.yaw = this.yaw % (Math.PI*2)
        this.pitch = Math.min(Math.max(this.pitch, -Math.PI/2+ 0.1), Math.PI/2-0.1)


        this.front[0] = Math.cos(this.yaw) * Math.cos(this.pitch);
        this.front[1] = Math.sin(this.pitch)
        this.front[2] = Math.sin(this.yaw) * Math.cos(this.pitch)
        this.front = vec3.normalize(this.front)
        this.right = vec3.normalize(vec3.cross(this.front, this.up));
        console.log(this.pitch);
    }

    getViewMatrix() {
        return mat4.lookAt(this.pos, vec3.add(this.pos, this.front), this.up);
    }

    getProjectionMatrix() {
        let projectionMatrix = mat4.perspective(this.fov, this.aspect, this.near, this.far);
        return projectionMatrix;
    }
}
