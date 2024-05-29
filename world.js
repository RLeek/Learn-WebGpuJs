import { block } from './blocks.js'
import { vec3, mat4 } from 'https://wgpu-matrix.org/dist/2.x/wgpu-matrix.module.js';

export const world = class {

    constructor(xLength, yLength, zLength) {
        this.xLength = xLength
        this.yLength = yLength
        this.zLength = zLength
        this.world = Array(this.xLength * this.yLength * this.zLength).fill(block.air)
        for (let currZ = 0; currZ < this.zLength; currZ++) { // z
            for (let currX = 0; currX < this.xLength; currX++) { // x
                let blockLoc = currX + currZ * this.yLength * this.xLength
                this.world[blockLoc] = block.stone
            }
        
        }


        this.sides = [vec3.create(0, 1, 0), vec3.create(0,-1,0), vec3.create(0,0,1), vec3.create(0,0,-1), vec3.create(1,0,0), vec3.create(-1,0,0)]
        this.color = [1.0, 0.2, 0.4, 0.5, 0.6, 0.7]
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
        console.log("Is this being called?")
        this.world[index] = block.air
    }
    // place block of arbitrary color ( need to embed color in block (fairly easy))
    // remove block (easy)

    // Need seperate color that simply provides
    // indexPos
    getVertices() {
        let vertices = []
        for (let currZ = 0; currZ < this.zLength; currZ++) { // z
            for (let currY = 0; currY < this.yLength; currY++) { // y
                for (let currX = 0; currX < this.xLength; currX++) { // x
                    let blockType = this.world[currX + currY*this.xLength + currZ * this.yLength * this.xLength]
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
            for (let currY = 0; currY < this.yLength; currY++) { // y
                for (let currX = 0; currX < this.xLength; currX++) { // x
                    let blockIndex = currX + currY*this.xLength + currZ * this.yLength * this.xLength
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
            for (let currY = 0; currY < this.yLength; currY++) { // y
                for (let currX = 0; currX < this.xLength; currX++) { // x
                    let blockType = this.world[currX + currY*this.xLength + currZ * this.yLength * this.xLength]
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
                            if (blockType == block.dirt) {
                                vertices = vertices.concat([0.5764 * this.color[index], 0.2784 * this.color[index], 0.2039 * this.color[index]])
                            } else if (blockType == block.grass) {
                                vertices = vertices.concat([0.5215 * this.color[index], 0.6745 * this.color[index], 0.1960 * this.color[index]])
                            } else if (blockType == block.sand) {
                                vertices = vertices.concat([0.9411 * this.color[index], 0.925 * this.color[index], 0.3568 * this.color[index]])
                            } else if (blockType == block.stone) {
                                vertices = vertices.concat([0.3568 * this.color[index], 0.3607 * this.color[index], 0.3529 * this.color[index]])
                            } else if (blockType == block.wood) {
                                vertices = vertices.concat([0.5411 * this.color[index], 0.451 * this.color[index], 0.3686 * this.color[index]])
                            } else if (blockType == block.leaf) {
                                vertices = vertices.concat([0.572 * this.color[index], 0.9215 * this.color[index], 0.5411 * this.color[index]])
                            } else if (blockType == block.water) {
                                vertices = vertices.concat([0.4117 * this.color[index], 0.7803 * this.color[index], 0.9411 * this.color[index]])
                            }
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
        const index = blockPos[0] + blockPos[1]*this.xLength + blockPos[2] * this.yLength * this.xLength
        //console.log(index)
        if (this.world[index] == block.air) {
            return true
        }
        return false;
    }

    addBlock(index, normal, block) {
        console.log(index, normal)
        // convert index into x, y, z
        // Then determine the normal transformation
        // determine whether it is out of bounds or empty

        // Do relevant action as required

        let worldPos = [index %this.xLength, ~~(index /this.xLength) %this.yLength, ~~(index / (this.xLength * this.yLength))]
        console.log("WORLD POSITION:")
        console.log(worldPos)
        console.log("BLOCKTYPE")
        console.log(block)
    
        if (normal == 1) { // y +1
            worldPos[1] +=1        
        } else if (normal == 3) { // y-1
            worldPos[1] -=1        

        } else if (normal == 4) { // z +1
            worldPos[2] +=1        

        } else if (normal == 2) { // z-1
            worldPos[2] -=1        

        } else if (normal == 6) { // x +1
            worldPos[0] +=1        

        } else if (normal == 5) { // x -1
            worldPos[0] -=1        
        }

        if (this.outOfBounds(worldPos)) {
            return;
        }

        if (this.isEmpty(worldPos)) {
            this.world[worldPos[0]  + worldPos[1] * this.xLength + worldPos[2] * this.xLength * this.yLength] = block
        }


    }


}



