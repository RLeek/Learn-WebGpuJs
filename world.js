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
                            vertices = vertices.concat([worldVertex[0], worldVertex[1], worldVertex[2], this.color[index][0], this.color[index][1],this.color[index][2]])
                        }
                        index+=1
                    }

                }
            }
        }
        return new Float32Array(vertices);
    }


    getIndexVertices() {
        //return this.getVertices();
        let vertices = []
        for (let currZ = 0; currZ < this.zLength; currZ++) { // z
            for (let currY = 0; currY < this.xLength; currY++) { // y
                for (let currX = 0; currX < this.yLength; currX++) { // x
                    let blockLoc = currX + currY*this.yLength + currZ * this.yLength * this.xLength;
                    let blockType = world[blockLoc]
                    if (blockType == block.air) {
                        continue;
                    }
    
                    // starting position
                    let position = [currX, currY, currZ]
    
                    // Need to check top, bottom, left, right, front and back are air blocks
                    // or out of range
    
                    // The issue here is that if it is at the edges then the value should 
                    // be out of bounds not in bounds, so it should return being out of 
                    // bounds
    
                    let blockTopLoc =  currX + (currY+1)*this.yLength + (currZ) * this.yLength * this.xLength;
                    if (this.isEmpty(blockTopLoc, world) || this.outOfBounds([currX, currY+1, currZ])) {
                        // draw surface
                        vertices = vertices.concat([
                             blockLoc, blockLoc, blockLoc, 1,
                            blockLoc, blockLoc, blockLoc, 1 , 
                            blockLoc, blockLoc, blockLoc, 1, 
                            blockLoc, blockLoc, blockLoc, 1, 
                             blockLoc, blockLoc, blockLoc, 1,
                             blockLoc, blockLoc, blockLoc, 1,
                        ]);
                    }
    
                    let blockBottomLoc =  currX + (currY-1)*this.yLength + (currZ) * this.yLength * this.xLength;
                    if (this.isEmpty(blockBottomLoc, world) || this.outOfBounds([currX, currY-1, currZ])) {
                        // draw surface
                        vertices =vertices.concat([
                             blockLoc, blockLoc, blockLoc, 3,
                            blockLoc, blockLoc, blockLoc, 3,
                            blockLoc, blockLoc, blockLoc, 3,
                            blockLoc, blockLoc, blockLoc, 3,
                             blockLoc, blockLoc, blockLoc, 3,
                             blockLoc, blockLoc, blockLoc, 3,
                        ])
                    }
    
                    let blockFrontLoc =  (currX) + currY*this.yLength + (currZ+1) * this.yLength * this.xLength;
                    if (this.isEmpty(blockFrontLoc, world) || this.outOfBounds([currX, currY, currZ+1])) {
                        // draw surface
                        vertices =vertices.concat([
                             blockLoc, blockLoc, blockLoc, 4,
                            blockLoc, blockLoc, blockLoc, 4,
                            blockLoc, blockLoc, blockLoc, 4,
                            blockLoc, blockLoc, blockLoc, 4,
                             blockLoc, blockLoc, blockLoc, 4,
                             blockLoc, blockLoc, blockLoc, 4,
                        ])
                    }
    
                    let blockBackLoc =  currX + currY*this.yLength + (currZ-1) * this.yLength * this.xLength;
                    if (this.isEmpty(blockBackLoc, world) || this.outOfBounds([currX, currY, currZ-1])) {
                        // draw surface
                        vertices =vertices.concat([
                             blockLoc, blockLoc, blockLoc, 2,
                            blockLoc, blockLoc, blockLoc, 2,
                            blockLoc, blockLoc, blockLoc, 2,
                             blockLoc, blockLoc, blockLoc, 2,
                            blockLoc, blockLoc, blockLoc, 2,
                             blockLoc, blockLoc, blockLoc, 2,
                        ])
                    }
                    
                    let blockRightLoc = currX+1 + (currY)*this.yLength + currZ * this.yLength * this.xLength;
                    if (this.isEmpty(blockRightLoc, world) || this.outOfBounds([currX+1, currY, currZ])) {
                        // draw surface
                        vertices =vertices.concat([
                             blockLoc, blockLoc, blockLoc, 6,
                            blockLoc, blockLoc, blockLoc, 6,
                            blockLoc, blockLoc, blockLoc, 6,
                            blockLoc, blockLoc, blockLoc, 6,
                            blockLoc, blockLoc, blockLoc, 6,
                            blockLoc, blockLoc, blockLoc, 6,                
                        ])
                    }
    
                    let blockLeftLoc =  currX-1 + (currY)*this.yLength + currZ * this.yLength * this.xLength;
                    if (this.isEmpty(blockLeftLoc, world) || this.outOfBounds([currX-1, currY, currZ])) {
                        // draw surface
                        vertices =vertices.concat([
                            blockLoc, blockLoc, blockLoc, 5,
                            blockLoc, blockLoc, blockLoc, 5,
                            blockLoc, blockLoc, blockLoc, 5,
                            blockLoc, blockLoc, blockLoc, 5,
                            blockLoc, blockLoc, blockLoc, 5,
                            blockLoc, blockLoc, blockLoc, 5,
                        ])
                    }
                }
            }
        }
        return new Uint8Array(vertices);

    }

    // to be implemented
    getColorVertices() {
        let vertices = []
        for (let currZ = 0; currZ < this.zLength; currZ++) { // z
            for (let currY = 0; currY < this.xLength; currY++) { // y
                for (let currX = 0; currX < this.yLength; currX++) { // x
                    let blockLoc = currX + currY*this.yLength + currZ * this.yLength * this.xLength;
                    let blockType = world[blockLoc]
                    if (blockType == block.air) {
                        continue;
                    }
    
                    // starting position
                    let position = [currX, currY, currZ]
    
                    // Need to check top, bottom, left, right, front and back are air blocks
                    // or out of range
    
                    // The issue here is that if it is at the edges then the value should 
                    // be out of bounds not in bounds, so it should return being out of 
                    // bounds
    
                    let blockTopLoc =  currX + (currY+1)*this.yLength + (currZ) * this.yLength * this.xLength;
                    if (this.isEmpty(blockTopLoc, world) || this.outOfBounds([currX, currY+1, currZ])) {
                        // draw surface
                        vertices = vertices.concat([
                            position[0]+-0.5,  position[1]+0.5, position[2]+-0.5, blockLoc, blockLoc, blockLoc, 1,
                            position[0]+0.5,  position[1]+0.5, position[2]+-0.5, blockLoc, blockLoc, blockLoc, 1 , 
                            position[0]+0.5, position[1]+ 0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 1, 
                            position[0]+0.5,  position[1]+0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 1, 
                            position[0]+-0.5,  position[1]+0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 1,
                            position[0]+-0.5,  position[1]+0.5, position[2]+-0.5, blockLoc, blockLoc, blockLoc, 1,
                        ]);
                    }
    
                    let blockBottomLoc =  currX + (currY-1)*this.yLength + (currZ) * this.yLength * this.xLength;
                    if (this.isEmpty(blockBottomLoc, world) || this.outOfBounds([currX, currY-1, currZ])) {
                        // draw surface
                        vertices =vertices.concat([
                            position[0]+-0.5, position[1]+-0.5, position[2]+-0.5, blockLoc, blockLoc, blockLoc, 3,
                            position[0]+0.5, position[1]+-0.5, position[2]+-0.5, blockLoc, blockLoc, blockLoc, 3,
                            position[0]+0.5, position[1]+-0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 3,
                    
                            position[0]+0.5, position[1]+-0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 3,
                            position[0]+-0.5, position[1]+-0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 3,
                            position[0]+-0.5, position[1]+-0.5, position[2]+-0.5, blockLoc, blockLoc, blockLoc, 3,
                        ])
                    }
    
                    let blockFrontLoc =  (currX) + currY*this.yLength + (currZ+1) * this.yLength * this.xLength;
                    if (this.isEmpty(blockFrontLoc, world) || this.outOfBounds([currX, currY, currZ+1])) {
                        // draw surface
                        vertices =vertices.concat([
                            position[0]+-0.5, position[1]+-0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 4,
                            position[0]+0.5, position[1]+-0.5, position[2]+ 0.5, blockLoc, blockLoc, blockLoc, 4,
                            position[0]+0.5,  position[1]+0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 4,
                            position[0]+0.5,  position[1]+0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 4,
                            position[0]+-0.5,  position[1]+0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 4,
                            position[0]+-0.5, position[1]+-0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 4,
                        ])
                    }
    
                    let blockBackLoc =  currX + currY*this.yLength + (currZ-1) * this.yLength * this.xLength;
                    if (this.isEmpty(blockBackLoc, world) || this.outOfBounds([currX, currY, currZ-1])) {
                        // draw surface
                        vertices =vertices.concat([
                            position[0]+-0.5, position[1]+-0.5, position[2]+-0.5,  blockLoc, blockLoc, blockLoc, 2,
                            position[0]+0.5, position[1]+-0.5, position[2]+-0.5,  blockLoc, blockLoc, blockLoc, 2,
                            position[0]+0.5,  position[1]+0.5, position[2]+-0.5,  blockLoc, blockLoc, blockLoc, 2,
                            position[0]+-0.5, position[1]+-0.5, position[2]+-0.5,  blockLoc, blockLoc, blockLoc, 2,
                            position[0]+0.5,  position[1]+0.5, position[2]+-0.5,  blockLoc, blockLoc, blockLoc, 2,
                            position[0]+-0.5,  position[1]+0.5, position[2]+-0.5,  blockLoc, blockLoc, blockLoc, 2,
                        ])
                    }
                    
                    let blockRightLoc = currX+1 + (currY)*this.yLength + currZ * this.yLength * this.xLength;
                    if (this.isEmpty(blockRightLoc, world) || this.outOfBounds([currX+1, currY, currZ])) {
                        // draw surface
                        vertices =vertices.concat([
                            position[0]+0.5,  position[1]+0.5,  position[2]+0.5,  blockLoc, blockLoc, blockLoc, 6,
                            position[0]+0.5,  position[1]+0.5, position[2]+-0.5,blockLoc, blockLoc, blockLoc, 6,
                            position[0]+0.5, position[1]+-0.5, position[2]+-0.5, blockLoc, blockLoc, blockLoc, 6,
                            position[0]+0.5, position[1]+-0.5, position[2]+-0.5, blockLoc, blockLoc, blockLoc, 6,
                            position[0]+0.5, position[1]+-0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 6,
                            position[0]+0.5, position[1]+ 0.5,  position[2]+0.5, blockLoc, blockLoc, blockLoc, 6,                
                        ])
                    }
    
                    let blockLeftLoc =  currX-1 + (currY)*this.yLength + currZ * this.yLength * this.xLength;
                    if (this.isEmpty(blockLeftLoc, world) || this.outOfBounds([currX-1, currY, currZ])) {
                        // draw surface
                        vertices =vertices.concat([
                            position[0]+-0.5,  position[1]+0.5,  position[2]+0.5,blockLoc, blockLoc, blockLoc, 5,
                            position[0]+-0.5,  position[1]+0.5, position[2]+-0.5,blockLoc, blockLoc, blockLoc, 5,
                            position[0]+-0.5, position[1]+-0.5, position[2]+-0.5,blockLoc, blockLoc, blockLoc, 5,
                            position[0]+-0.5, position[1]+-0.5, position[2]+-0.5,blockLoc, blockLoc, blockLoc, 5,
                            position[0]+-0.5, position[1]+-0.5,  position[2]+0.5,blockLoc, blockLoc, blockLoc, 5,
                            position[0]+-0.5,  position[1]+0.5,  position[2]+0.5,blockLoc, blockLoc, blockLoc, 5,
                        ])
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



