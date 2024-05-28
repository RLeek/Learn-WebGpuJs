import { block } from './blocks.js'
import { vec3, mat4 } from 'https://wgpu-matrix.org/dist/2.x/wgpu-matrix.module.js';

export const world = class {

    constructor(xLength, yLength, zLength) {
        this.xLength = xLength
        this.yLength = yLength
        this.zLength = zLength
        this.world = Array(this.xLength * this.yLength * this.zLength).fill(block.dirt)
        this.sides = [vec3.create(0, 1, 0), vec3.create(0,-1,0), vec3.create(0,0,1), vec3.create(0,0,-1), vec3.create(1,0,0), vec3.create(-1,0,0)]
        this.color = [vec3.create(1, 0, 1), vec3.create(0,1,1), vec3.create(0,0,1), vec3.create(1,0,0), vec3.create(1,1,0), vec3.create(0,1,0)]
        this.normal = [1,3,4,2,6,5]
        this.sidesVertices = [
            [
                vec3.create(-0.5, 0.5, -0.5),
                vec3.create(0.5, 0.5, -0.5),
                vec3.create(0.5, 0.5, 0.5),
                vec3.create(0.5, 0.5, 0.5),
                vec3.create(-0.5, 0.5, 0.5),
                vec3.create(-0.5, 0.5, -0.5)
            ], [
                vec3.create(-0.5, -0.5, -0.5),
                vec3.create(0.5, -0.5, -0.5),
                vec3.create(0.5, -0.5, 0.5),
                vec3.create(0.5, -0.5, 0.5),
                vec3.create(-0.5, -0.5, 0.5),
                vec3.create(-0.5, -0.5, -0.5),
            ],[
                vec3.create(-0.5, -0.5, 0.5), 
                vec3.create(0.5, -0.5, 0.5), 
                vec3.create(0.5,  0.5, 0.5), 
                vec3.create(0.5,  0.5, 0.5), 
                vec3.create(-0.5, 0.5, 0.5), 
                vec3.create(-0.5, -0.5, 0.5), 

            ],[
                vec3.create(-0.5, -0.5, -0.5),
                vec3.create(0.5, -0.5, -0.5),
                vec3.create(0.5, 0.5, -0.5),
                vec3.create(-0.5, -0.5, -0.5), 
                vec3.create(0.5, 0.5, -0.5),
                vec3.create(-0.5, 0.5, -0.5), 
            ],[
                vec3.create(0.5, 0.5, 0.5), 
                vec3.create(0.5, 0.5, -0.5), 
                vec3.create(0.5, -0.5, -0.5),
                vec3.create(0.5, -0.5, -0.5),
                vec3.create(0.5, -0.5, 0.5), 
                vec3.create(0.5,  0.5, 0.5),                 

            ], [
                vec3.create(-0.5, 0.5, 0.5),
                vec3.create(-0.5, 0.5, -0.5),
                vec3.create(-0.5, -0.5, -0.5),
                vec3.create(-0.5, -0.5, -0.5),
                vec3.create(-0.5, -0.5, 0.5),
                vec3.create(-0.5, 0.5, 0.5),
            ]
        ]
    }

    removeBlock(index) {
        this.world[index] = block.air
    }
    // place block of arbitrary color ( need to embed color in block (fairly easy))
    // remove block (easy)

    // Need seperate color that simply provides
    // indexPos
    getVertices() {
        let vertices = []
        for (let currZ = 0; currZ < this.zLength; currZ++) { // z
            for (let currY = 0; currY < this.xLength; currY++) { // y
                for (let currX = 0; currX < this.yLength; currX++) { // x
                    let blockType = this.world[currX + currY*this.yLength + currZ * this.yLength * this.xLength]
                    if (blockType == block.air) {
                        continue;
                    }
    
                    // starting position
                    let position = vec3.create(currX, currY, currZ);
                    let index = 0
                    for (var side of this.sides) {
                        let blockLoc = vec3.add(position, side)
                        if (!this.outOfBounds(blockLoc) && !this.isEmpty(blockLoc)) {
                            index+=1
                            continue;
                        }
                        for (var vertex of this.sidesVertices[index]) {
                            var worldVertex = vec3.add(position,vertex);
                            vertices = vertices.concat([worldVertex[0], worldVertex[1], worldVertex[2]])
                        }
                        index+=1
                    }

                }
            }
        }
        return new Float32Array(vertices);
    }


    getIndexVertices() {
        let vertices = []
        for (let currZ = 0; currZ < this.zLength; currZ++) { // z
            for (let currY = 0; currY < this.xLength; currY++) { // y
                for (let currX = 0; currX < this.yLength; currX++) { // x
                    let blockIndex = currX + currY*this.yLength + currZ * this.yLength * this.xLength
                    let blockType = this.world[blockIndex]
                    if (blockType == block.air) {
                        continue;
                    }

                    // starting position
                    let position = vec3.create(currX, currY, currZ);
                    let index = 0
                    for (var side of this.sides) {
                        let blockLoc = vec3.add(position, side)
                        if (!this.outOfBounds(blockLoc) && !this.isEmpty(blockLoc)) {
                            index+=1
                            continue;
                        }
                        for (var vertex of this.sidesVertices[index]) {
                            vertices = vertices.concat([blockIndex, this.normal[index]])
                        }
                        index+=1
                    }
                }
            }
        }
        return new Uint32Array(vertices);
    }

    // to be implemented
    getColorVertices() {
        let vertices = []
        for (let currZ = 0; currZ < this.zLength; currZ++) { // z
            for (let currY = 0; currY < this.xLength; currY++) { // y
                for (let currX = 0; currX < this.yLength; currX++) { // x
                    let blockType = this.world[currX + currY*this.yLength + currZ * this.yLength * this.xLength]
                    if (blockType == block.air) {
                        continue;
                    }
    
                    // starting position
                    let position = vec3.create(currX, currY, currZ);
                    let index = 0
                    for (var side of this.sides) {
                        let blockLoc = vec3.add(position, side)
                        if (!this.outOfBounds(blockLoc) && !this.isEmpty(blockLoc)) {
                            index+=1
                            continue;
                        }
                        for (var vertex of this.sidesVertices[index]) {
                            vertices = vertices.concat([this.color[index][0], this.color[index][1],this.color[index][2]])
                        }
                        index+=1
                    }

                }
            }
        }
        return new Float32Array(vertices);    
    }


    outOfBounds(position) {
        if (position[0] >= this.xLength || position[0] < 0) {
            return true;
        }
        if (position[1] >= this.yLength || position[1] < 0) {
            return true;
        }
        if (position[2] >= this.zLength || position[2] < 0) {
            return true;
        }
        return false;
    }

    isEmpty(blockPos) {
        const index = blockPos[0] + blockPos[1]*this.yLength + blockPos[2] * this.yLength * this.xLength
        //console.log(index)
        if (this.world[index] == block.air) {
            return true
        }
        return false;
    }


}



