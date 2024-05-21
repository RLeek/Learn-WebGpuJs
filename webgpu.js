
import { cubeShaderCode } from './shader.js'
import { vec3, mat4 } from 'https://wgpu-matrix.org/dist/2.x/wgpu-matrix.module.js';

/*
const observer = new ResizeObserver(async entries=> {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('Need a brwoser that supports WebGPU');
        return;
    }
    for (const entry of entries) {
        const canvas = entry.target;
        const width = entry.contentBoxSize[0].inlineSize;
        const height = entry.contentBoxSize[0].blockSize;
        canvas.width = Math.max(1,Math.min(width,device.limits.maxTextureDimension2D));
        canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
        render();
    }
})
*/
const canvas = document.querySelector('canvas');
// observer.observe(canvas);

render();

async function getDevice() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('Need a brwoser that supports WebGPU');
        return;
    }
    return device;
}

function getContext(device) {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    return context;
}



async function render() {
    const device = await getDevice();
    const context =  getContext(device);
    
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format:presentationFormat
    });

    const cubeModule = device.createShaderModule({
        label: "Cube Shader",
        code: cubeShaderCode
    })

    const cubePipeline = device.createRenderPipeline({
        label: 'Cube Pipeline',
        layout: 'auto',
        vertex: {
            module: cubeModule,
            buffers: [
                {
                    arrayStride: 6*4,
                    attributes: [
                        {shaderLocation: 0, offset:0, format: 'float32x3'},
                        {shaderLocation: 1, offset:12, format: 'float32x3'}
                    ]
                }
            ],
        },
        fragment: {
            module: cubeModule,
            targets: [{ format: presentationFormat}]
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    })

    const cubeVertices = getCubeVertices();

    const cubeVertexBuffer = device.createBuffer({
        label: 'cubeVertexBuffer',
        size: cubeVertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(cubeVertexBuffer, 0, cubeVertices)

    // We now need to write the uniform values
    const modelUniformBuffer = device.createBuffer({
        label:'modelBuffer',
        size: 4*4*4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    let modelMatrix = mat4.identity();
    modelMatrix = mat4.translate(modelMatrix, [0,0,0]);
    modelMatrix = mat4.rotateY(modelMatrix, Math.PI * 0.75);
    modelMatrix = mat4.rotateX(modelMatrix, Math.PI * 0.75);


    device.queue.writeBuffer(modelUniformBuffer, 0, modelMatrix)

    const viewUniformBuffer = device.createBuffer({
        label:'viewBuffer',
        size: 4*4*4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    
    let viewMatrix = mat4.identity();
    viewMatrix = mat4.translate(viewMatrix, [0,0,-8]);

    device.queue.writeBuffer(viewUniformBuffer, 0, viewMatrix)

    const projectionUniformBuffer = device.createBuffer({
        label:'projectionBuffer',
        size: 4*4*4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    const fov = 60 * Math.PI / 180
    const aspect = canvas.width / canvas.height;
    const near = 0.1;
    const far = 1000;
    const projectionMatrix = mat4.perspective(fov, aspect, near, far);
    device.queue.writeBuffer(projectionUniformBuffer, 0, projectionMatrix)

    let xRotation = 0.0
    let yRotation = 0.0

    
    while(true) {
        let canvasTexture = context.getCurrentTexture();
        let depthTexture = device.createTexture({
            label: 'Depth texture',
            size: [canvasTexture.width, canvasTexture.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        
        let canvasView = canvasTexture.createView();
        let depthview = depthTexture.createView();
        
        xRotation += 0.0005;
        yRotation += 0.0005;
        if (xRotation > 2) {
            xRotation = 0;
        }
        if (yRotation > 2) {
            yRotation = 0;
        }
        const renderPassDescriptor = {
            label: 'Our render pass',
            colorAttachments: [
                {
                    clearValue: [0.3, 0.3, 0.3, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                    view: canvasView
                }
            ],
            depthStencilAttachment: {
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                view: depthview
            }
        }
        
        modelMatrix = mat4.identity();
        modelMatrix = mat4.translate(modelMatrix, [0,0,0]);
        modelMatrix = mat4.rotateY(modelMatrix, Math.PI *xRotation);
        modelMatrix = mat4.rotateX(modelMatrix, Math.PI * yRotation);


        device.queue.writeBuffer(modelUniformBuffer, 0, modelMatrix)

        const matrixBindGroup = device.createBindGroup({
            label: 'matrix bind group',
            layout: cubePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: modelUniformBuffer}},
                { binding: 1, resource: { buffer: viewUniformBuffer}},
                { binding: 2, resource: { buffer: projectionUniformBuffer}}
            ]
        })
        const encoder = device.createCommandEncoder({label: 'Our encoder'});
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        pass.setPipeline(cubePipeline);
        pass.setBindGroup(0, matrixBindGroup);
        pass.setVertexBuffer(0, cubeVertexBuffer);
        pass.draw(cubeVertices.length/6);

        pass.end()

        const commandBuffer = encoder.finish();

        device.queue.submit([commandBuffer]);
        await new Promise(r => setTimeout(r, 2));
    }
}

function random(min, max) {
    if (min === undefined) {
        min = 0;
        max = 1;
    } else if (max === undefined) {
        max = min;
        min = 0;
    }
    return min + Math.random() * (max-min);
}




function getCubeVertices() {

    const block = Object.freeze({
        air: 0,
        dirt: 1,
    })

    const width = 3;
    const height = 3;
    const length = 3;

    // world is just an array, first 3 correspend to width,
    // next correspond to length
    // next*next correspond to height
    const world = [
        block.dirt, block.dirt, block.dirt,
        block.air, block.dirt, block.air,
        block.air, block.air, block.air,
        block.dirt, block.air, block.dirt,
        block.air, block.air, block.dirt,
        block.air, block.dirt, block.air,
        block.dirt, block.air, block.air,
        block.air, block.air, block.air,
        block.air, block.air, block.air
    ]

    var vertices = [];


    // Now need to figure out how to populate a list of verticies
    // from this

    // We are assuming that blocks have a length of 1 here, right?
    for (let currHeight = 0; currHeight < height; currHeight++) { // z
        for (let currWidth = 0; currWidth < width; currWidth++) { // y
            for (let currLength = 0; currLength < length; currLength++) { // x
                let blockLoc = currLength + currWidth*length + currHeight * length * width;
                let blockType = world[blockLoc]
                if (blockType == block.air) {
                    continue;
                }

                // starting position
                let position = [currLength, currWidth, currHeight]

                // Need to check top, bottom, left, right, front and back are air blocks
                // or out of range

                let blockTopLoc =  currLength + currWidth*length + (currHeight+1) * length * width;
                if (isEmpty(blockTopLoc, world)) {
                    // draw surface
                    vertices = vertices.concat([
                        position[0]+-0.5,  position[1]+0.5, position[2]+-0.5, 1, 0, 1,
                        position[0]+0.5,  position[1]+0.5, position[2]+-0.5, 1, 0, 1,
                        position[0]+0.5, position[1]+ 0.5,  position[2]+0.5, 1, 0, 1,
                        position[0]+0.5,  position[1]+0.5,  position[2]+0.5, 1, 0, 1,
                        position[0]+-0.5,  position[1]+0.5,  position[2]+0.5, 1, 0, 1,
                        position[0]+-0.5,  position[1]+0.5, position[2]+-0.5, 1, 0, 1
                    ]);
                }

                let blockBottomLoc =  currLength + currWidth*length + (currHeight-1) * length * width;
                if (isEmpty(blockBottomLoc, world)) {
                    // draw surface
                    vertices =vertices.concat([
                        position[0]+-0.5, position[1]+-0.5, position[2]+-0.5, 0, 1, 1,
                        position[0]+0.5, position[1]+-0.5, position[2]+-0.5, 0, 1, 1,
                        position[0]+0.5, position[1]+-0.5,  position[2]+0.5, 0, 1, 1,
                
                        position[0]+0.5, position[1]+-0.5,  position[2]+0.5, 0, 1, 1,
                        position[0]+-0.5, position[1]+-0.5,  position[2]+0.5, 0, 1, 1,
                        position[0]+-0.5, position[1]+-0.5, position[2]+-0.5, 0, 1, 1,
                    ])
                }

                let blockFrontLoc =  currLength + (currWidth+1)*length + currHeight * length * width;
                if (isEmpty(blockFrontLoc, world)) {
                    // draw surface
                    vertices =vertices.concat([
                        position[0]+-0.5, position[1]+-0.5,  position[2]+0.5, 0, 0, 1,
                        position[0]+0.5, position[1]+-0.5, position[2]+ 0.5, 0, 0, 1,
                        position[0]+0.5,  position[1]+0.5,  position[2]+0.5, 0, 0, 1,
                        position[0]+0.5,  position[1]+0.5,  position[2]+0.5, 0, 0, 1,
                        position[0]+-0.5,  position[1]+0.5,  position[2]+0.5, 0, 0, 1,
                        position[0]+-0.5, position[1]+-0.5,  position[2]+0.5, 0, 0, 1,
                    ])
                }

                let blockBackLoc =  currLength + (currWidth-1)*length + currHeight * length * width;
                if (isEmpty(blockBackLoc, world)) {
                    // draw surface
                    vertices =vertices.concat([
                        position[0]+-0.5, position[1]+-0.5, position[2]+-0.5,  1, 0, 0,
                        position[0]+0.5, position[1]+-0.5, position[2]+-0.5, 1, 0, 0,
                        position[0]+0.5,  position[1]+0.5, position[2]+-0.5, 1, 0, 0,
                        position[0]+-0.5, position[1]+-0.5, position[2]+-0.5, 1, 0, 0,
                        position[0]+0.5,  position[1]+0.5, position[2]+-0.5, 1, 0, 0,
                        position[0]+-0.5,  position[1]+0.5, position[2]+-0.5, 1, 0, 0,
                    ])
                }

                let blockLeftLoc =  (currLength+1) + currWidth*length + currHeight * length * width;
                if (isEmpty(blockLeftLoc, world)) {
                    // draw surface
                    vertices =vertices.concat([
                        position[0]+-0.5,  position[1]+0.5,  position[2]+0.5, 0, 1, 0,
                        position[0]+-0.5,  position[1]+0.5, position[2]+-0.5, 0, 1, 0,
                        position[0]+-0.5, position[1]+-0.5, position[2]+-0.5, 0, 1, 0,
                        position[0]+-0.5, position[1]+-0.5, position[2]+-0.5, 0, 1, 0,
                        position[0]+-0.5, position[1]+-0.5,  position[2]+0.5, 0, 1, 0,
                        position[0]+-0.5,  position[1]+0.5,  position[2]+0.5, 0, 1, 0,
                    ])
                }

                let blockRighLoc =  (currLength-1) + currWidth*length + currHeight * length * width;
                if (isEmpty(blockRighLoc, world)) {
                    // draw surface
                    vertices =vertices.concat([
                        position[0]+0.5,  position[1]+0.5,  position[2]+0.5, 1, 1, 0,
                        position[0]+0.5,  position[1]+0.5, position[2]+-0.5, 1, 1, 0,
                        position[0]+0.5, position[1]+-0.5, position[2]+-0.5, 1, 1, 0,
                        position[0]+0.5, position[1]+-0.5, position[2]+-0.5, 1, 1, 0,
                        position[0]+0.5, position[1]+-0.5,  position[2]+0.5, 1, 1, 0,
                        position[0]+0.5, position[1]+ 0.5,  position[2]+0.5, 1, 1, 0,                
                    ])
                }
            }
        }
    }

    function isEmpty(index, world) {
        if (index < 0) {
            return true
        }
        if (index > length *width *height) {
            return true
        }

        if (world[index] == block.air) {
            return true
        }
        return false;
    }

    const verticies = [
        // Back
        -0.5, -0.5, -0.5,  1, 0, 0,
        0.5, -0.5, -0.5, 1, 0, 0,
        0.5,  0.5, -0.5, 1, 0, 0,
        -0.5, -0.5, -0.5, 1, 0, 0,
        0.5,  0.5, -0.5, 1, 0, 0,
        -0.5,  0.5, -0.5, 1, 0, 0,

        // Front
        -0.5, -0.5,  0.5, 0, 0, 1,
        0.5, -0.5,  0.5, 0, 0, 1,
        0.5,  0.5,  0.5, 0, 0, 1,
        0.5,  0.5,  0.5, 0, 0, 1,
        -0.5,  0.5,  0.5, 0, 0, 1,
        -0.5, -0.5,  0.5, 0, 0, 1,

        // Left
        -0.5,  0.5,  0.5, 0, 1, 0,
        -0.5,  0.5, -0.5, 0, 1, 0,
        -0.5, -0.5, -0.5, 0, 1, 0,
        -0.5, -0.5, -0.5, 0, 1, 0,
        -0.5, -0.5,  0.5, 0, 1, 0,
        -0.5,  0.5,  0.5, 0, 1, 0,

        // Right
        0.5,  0.5,  0.5, 1, 1, 0,
        0.5,  0.5, -0.5, 1, 1, 0,
        0.5, -0.5, -0.5, 1, 1, 0,
        0.5, -0.5, -0.5, 1, 1, 0,
        0.5, -0.5,  0.5, 1, 1, 0,
        0.5,  0.5,  0.5, 1, 1, 0,

        // Bottom
        -0.5, -0.5, -0.5, 0, 1, 1,
        0.5, -0.5, -0.5, 0, 1, 1,
        0.5, -0.5,  0.5, 0, 1, 1,

        0.5, -0.5,  0.5, 0, 1, 1,
        -0.5, -0.5,  0.5, 0, 1, 1,
        -0.5, -0.5, -0.5, 0, 1, 1,

        // top
        -0.5,  0.5, -0.5, 1, 0, 1,
        0.5,  0.5, -0.5, 1, 0, 1,
        0.5,  0.5,  0.5, 1, 0, 1,
        0.5,  0.5,  0.5, 1, 0, 1,
        -0.5,  0.5,  0.5, 1, 0, 1,
        -0.5,  0.5, -0.5, 1, 0, 1,
    ]
    
    console.log(vertices)
    return new Float32Array(vertices);
}



function createCircleVertices({
    radius = 1,
    numSubdivisions = 24,
    innerRadius = 0,
    startAngle = 0,
    endAngle = Math.PI*2,
} = {}) {
  // 2 vertices at each subdivision, + 1 to wrap around the circle.
  const numVertices = (numSubdivisions + 1) * 2;
  // 2 32-bit values for position (xy) and 1 32-bit value for color (rgb_)
  // The 32-bit color value will be written/read as 4 8-bit values
  const vertexData = new Float32Array(numVertices * (2 + 1));
  const colorData = new Uint8Array(vertexData.buffer);
 
  let offset = 0;
  let colorOffset = 8;
  const addVertex = (x, y, r, g, b) => {
    vertexData[offset++] = x;
    vertexData[offset++] = y;
    offset += 1;  // skip the color
    colorData[colorOffset++] = r * 255;
    colorData[colorOffset++] = g * 255;
    colorData[colorOffset++] = b * 255;
    colorOffset += 9;  // skip extra byte and the position
    };
 
    const innerColor = [1, 1, 1];
    const outerColor = [0.1, 0.1, 0.1];
    // 2 triangles per subdivision
  //
  // 0  2  4  6  8 ...
  //
  // 1  3  5  7  9 ...
  for (let i = 0; i <= numSubdivisions; ++i) {
    const angle = startAngle + (i + 0) * (endAngle - startAngle) / numSubdivisions;
 
    const c1 = Math.cos(angle);
    const s1 = Math.sin(angle);
 
    addVertex(c1 * radius, s1 * radius, ...outerColor);
    addVertex(c1 * innerRadius, s1 * innerRadius, ...innerColor);
  }

  const indexData = new Uint32Array(numSubdivisions * 6);
  let ndx = 0;
 
  // 0---2---4---...
  // | //| //|
  // |// |// |//
  // 1---3-- 5---...
  for (let i = 0; i < numSubdivisions; ++i) {
    const ndxOffset = i * 2;
 
    // first triangle
    indexData[ndx++] = ndxOffset;
    indexData[ndx++] = ndxOffset + 1;
    indexData[ndx++] = ndxOffset + 2;
 
    // second triangle
    indexData[ndx++] = ndxOffset + 2;
    indexData[ndx++] = ndxOffset + 1;
    indexData[ndx++] = ndxOffset + 3;
  }

  return {
    vertexData,
    indexData,
    numVertices: indexData.length,
  };
}