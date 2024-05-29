
import { cubeShaderCode, worldShaderCode } from './shader.js'
import { camera } from './camera.js'
import { vec3, mat4 } from 'https://wgpu-matrix.org/dist/2.x/wgpu-matrix.module.js';
import { inputHandler } from './input.js';
import { world } from './world.js'

async function getDevice() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('Need a brwoser that supports WebGPU');
        return;
    }
    return device;
}

function getContext() {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    return context;
}


// shader class that has:
    // code 
    // pipeline
    // Define the buffers
        // Projection buffer,
        // model buffer,
        // view buffer
        // vertex buffer
    // bind group (When we create this we need to give the corresponding binds)
    // Textures
        // Render pass descriptor 


function getWorldPipeline(device) {
    const worldModule = device.createShaderModule({
        label: "Cube Shader",
        code: worldShaderCode
    })

    const worldPipeline = device.createRenderPipeline({
        label: 'Cube Pipeline',
        layout: 'auto',

        vertex: {
            module: worldModule,
            buffers: [
                {
                    arrayStride: 3*4,
                    attributes: [
                        {shaderLocation: 0, offset:0, format: 'float32x3'}, //vertex
                    ]
                },
                {
                    arrayStride: 2*4,
                    attributes: [
                        {shaderLocation: 1, offset:0, format: 'uint32x2'} // index + normal value(??)
                    ]
                }
            ],
        },
        fragment: {
            module: worldModule,
            targets: [{ format: 'rg32uint'}]
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    })
    return worldPipeline;
}

function getCubePipeline(device, presentationFormat) {
    
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
                    arrayStride: 3*4,
                    attributes: [
                        {shaderLocation: 0, offset:0, format: 'float32x3'} // vertex
                    ]
                }, 
                {
                    arrayStride:3*4,
                    attributes: [
                        {shaderLocation:1, offset:0, format: 'float32x3'} // color 
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
    return cubePipeline;
}


async function main() {

    const device = await getDevice();
    const canvas = document.querySelector('canvas');
    const context =  getContext();

    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          const canvas = entry.target;
          const width = entry.contentBoxSize[0].inlineSize;
          const height = entry.contentBoxSize[0].blockSize;
          canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
          canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
          // re-render
        }
    });
    observer.observe(canvas);

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format:presentationFormat
    });
    
    const worldPipeline = getWorldPipeline(device)
    const cubePipeline = getCubePipeline(device, presentationFormat)

    // Initialize world here
    const voxelWorld = new world(10, 10, 10);
    let cubeVertices = voxelWorld.getVertices();
    let cubeColor = voxelWorld.getColorVertices();

    let cubeIndex = voxelWorld.getIndexVertices();

    
    // Creates shared vertex buffer
    var cubeVertexBuffer = device.createBuffer({
        label: 'cubeVertexBuffer',
        size: cubeVertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    
    device.queue.writeBuffer(cubeVertexBuffer, 0, cubeVertices)
    
    var cubeColorBuffer = device.createBuffer({
        label: 'cubeVertexBuffer',
        size: cubeColor.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    
    device.queue.writeBuffer(cubeColorBuffer, 0, cubeColor)


    var cubeIndexBuffer = device.createBuffer({
        label: 'cubeVertexBuffer',
        size: cubeIndex.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    
    device.queue.writeBuffer(cubeIndexBuffer, 0, cubeIndex)

    // Creates shared model matrix
    const modelUniformBuffer = device.createBuffer({
        label:'modelBuffer',
        size: 4*4*4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    
    let modelMatrix = mat4.identity();
    modelMatrix = mat4.translate(modelMatrix, [0,0,0]);
    
    device.queue.writeBuffer(modelUniformBuffer, 0, modelMatrix)
    
    // Initialize camera
    const worldCamera = new camera([5,3,15], 60 * Math.PI / 180,canvas.width / canvas.height, 0.1, 1000);
    
    window.addEventListener('keydown', (e)=> inputHandler.setKeyPressed(e, inputHandler))
    window.addEventListener('keyup', (e)=> inputHandler.setKeyReleased(e, inputHandler))
    canvas.addEventListener('mousemove', (e)=> inputHandler.setMouseMoveInfo(e, inputHandler))
    canvas.addEventListener('mousedown', (e)=> inputHandler.setMousePressed(e, inputHandler))
    canvas.addEventListener('mouseup', (e) => inputHandler.setMouseReleased(e, inputHandler))

    const viewUniformBuffer = device.createBuffer({
        label:'viewBuffer',
        size: 4*4*4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(viewUniformBuffer, 0, worldCamera.getViewMatrix())

    const projectionUniformBuffer = device.createBuffer({
        label:'projectionBuffer',
        size: 4*4*4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(projectionUniformBuffer, 0, worldCamera.getProjectionMatrix())


    // Buffer for results of clicking
    // Can be defined later
    const pickBuffer = device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    
    async function render() {
        if (inputHandler.wPressed === true) {
            // update camera view matrix
            worldCamera.forward();
        }

        if (inputHandler.sPressed === true) {
            worldCamera.backward();
        }
        
        if (inputHandler.dPressed === true) {
            worldCamera.strafeRight();
        }

        if (inputHandler.aPressed === true) {
            worldCamera.strafeLeft();
        }
        
        if (inputHandler.rightMouseDragged == true || inputHandler.mouseMove.x != 0 || inputHandler.mouseMove.y != 0) {
            worldCamera.handleMouseDrag(inputHandler.mouseMove.x, -inputHandler.mouseMove.y);
            inputHandler.mouseMove.x = 0;
            inputHandler.mouseMove.y = 0;
        }
        
        device.queue.writeBuffer(viewUniformBuffer, 0, worldCamera.getViewMatrix())

        let canvasTexture = context.getCurrentTexture();
        let depthTexture = device.createTexture({
            label: 'Depth texture',
            size: [canvasTexture.width, canvasTexture.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        
        let canvasView = canvasTexture.createView();
        let depthview = depthTexture.createView();

        // Is this creating the framebuffer equivalent??
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
        pass.setVertexBuffer(1, cubeColorBuffer);
        pass.draw(cubeVertices.length/3);

        pass.end()

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);


    }
    
    // Create event listener (Note: This requires a bunch of vars to be provided at the end so that we can 
    // trigger the correct funcions)
    canvas.addEventListener('mousedown', async event => {
        if (event.button == 2) {
            return;
        }
        const bb = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - bb.left)/bb.width * canvas.width)
        const y = Math.floor((event.clientY-bb.top)/ bb.height * canvas.height)
        let values = await getWorldMouseClick(canvas,device,worldPipeline, cubeIndex, cubeIndexBuffer, cubeVertices, cubeVertexBuffer,pickBuffer,modelUniformBuffer,viewUniformBuffer,projectionUniformBuffer, x, y);
        
        if (values[1] == 0) {
            return;
        }

        if (inputHandler.removeBlock) {
            voxelWorld.removeBlock(values[0])
        } else {
            voxelWorld.addBlock(values[0], values[1], inputHandler.blockSelected)
        }
        console.log(values)
        cubeVertices = voxelWorld.getVertices();
        cubeColor = voxelWorld.getColorVertices();
        cubeIndex = voxelWorld.getIndexVertices();

        cubeVertexBuffer = device.createBuffer({
            label: 'cubeVertexBuffer',
            size: cubeVertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        cubeColorBuffer = device.createBuffer({
            label: 'cubeVertexBuffer',
            size: cubeColor.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        cubeIndexBuffer = device.createBuffer({
            label: 'cubeVertexBuffer',
            size: cubeIndex.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(cubeVertexBuffer, 0, cubeVertices)
        device.queue.writeBuffer(cubeColorBuffer, 0, cubeColor)
        device.queue.writeBuffer(cubeIndexBuffer, 0, cubeIndex)

    })


    requestAnimationFrame(frame);


    async function frame() {
        await render();
        requestAnimationFrame(frame);
    }


}


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
// observer.observe(canvas);


main();




async function getWorldMouseClick(canvasTexture,device,worldPipeline,cubeIndex,cubeIndexBuffer, cubeVertices, cubeVertexBuffer,pickBuffer,modelUniformBuffer,viewUniformBuffer,projectionUniformBuffer, x, y) {
    let depthTexture = device.createTexture({
        label: 'Depth texture',
        size: [canvasTexture.width, canvasTexture.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    let selectionTexture = device.createTexture({
        label: 'Selection texture',
        size: [canvasTexture.width, canvasTexture.height],
        format: 'rg32uint',
        usage: GPUTextureUsage.COPY_SRC |GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const matrixBindGroup = device.createBindGroup({
        label: 'matrix bind group',
        layout: worldPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: modelUniformBuffer}},
            { binding: 1, resource: { buffer: viewUniformBuffer}},
            { binding: 2, resource: { buffer: projectionUniformBuffer}}
        ]
    })

    // Okay this looks to just work??
    // so now we need to do this whenever the mouse is clicked
    const pickRenderPassDescriptorDescriptor = {
        label: 'Our render pass',
        colorAttachments: [
            {
                clearValue: [0, 0, 0, 0],
                loadOp: 'clear',
                storeOp: 'store',
                view: selectionTexture.createView()
            }
        ],
        depthStencilAttachment: {
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            view: depthTexture.createView()
        }
    }
    
    const encoder = device.createCommandEncoder({label: 'Our123 encoder'});
    const pass = encoder.beginRenderPass(pickRenderPassDescriptorDescriptor);

    pass.setPipeline(worldPipeline);
    pass.setBindGroup(0, matrixBindGroup);
    pass.setVertexBuffer(0, cubeVertexBuffer);
    pass.setVertexBuffer(1, cubeIndexBuffer);
    pass.draw(cubeVertices.length/3);

    pass.end()

    encoder.copyTextureToBuffer({
        texture: selectionTexture,
        // mipLevel: 0,
        origin: {
          x: x,
          y: y,
        }
  
      }, {
        buffer: pickBuffer,
        //bytesPerRow: ((3 * 4 + 255) | 0) * 256,
        //rowsPerImage: 3,
      }, {
        width: 1
        // height: 1,
        // depth: 1,
    });
      
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    await pickBuffer.mapAsync(GPUMapMode.READ);
    const values = new Uint32Array(pickBuffer.getMappedRange());
    var value1 = [values[0], values[1]]
    pickBuffer.unmap();
    return value1
}
