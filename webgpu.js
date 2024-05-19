
console.log("HELLLO!!!");



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
        main();
    }
})

const canvas = document.querySelector('canvas');

observer.observe(canvas);


console.log("WE got here>!!!")

async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('Need a brwoser that supports WebGPU');
        return;
    }

    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format:presentationFormat
    });

    const module = device.createShaderModule({
        label: "Our shader",
        code: shaderCode
    })

    const pipeline = device.createRenderPipeline({
        label: 'Our pipeline',
        layout: 'auto',
        vertex: {
            module: module,
            buffers: [
                {
                    arrayStride: 2*4 +4,
                    attributes: [
                        {shaderLocation: 0, offset:0, format: 'float32x2'},
                        {shaderLocation:4, offset: 8, format: 'unorm8x4'}
                    ]
                },
                {
                    arrayStride: 4+2*4,
                    stepMode: 'instance',
                    attributes: [
                        {shaderLocation:1, offset: 0, format: 'unorm8x4'},
                        {shaderLocation:2, offset: 4, format: 'float32x2'},
                    ],
                },
                {
                    arrayStride: 2*4,
                    stepMode: 'instance',
                    attributes: [
                        {shaderLocation: 3, offset:0, format: 'float32x2'},
                    ]
                }
            ],
        },
        fragment: {
            module: module,
            targets: [{ format: presentationFormat}]
        }
    })

    const renderPassDescriptor = {
        label: 'Our render pass',
        colorAttachments: [
            {
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp: 'clear',
                storeOp: 'store'
            }
        ]
    }

    const kColorOffset = 0;
    const kScaleOffset = 0;
    const kOffsetOffset = 1;
  
    // Define Uniform
    const objects = 100;
    const objectInfos = [];
    const uniformBufferSize = 2*4 * objects;
    const staticBufferSize = (4 + 2 * 4) * objects;


    const staticStorageBuffer = device.createBuffer({
        label: 'storagebuffer',
        size: staticBufferSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const changingStorageBuffer = device.createBuffer({
        label: 'changingStorageBuffer',
        size:uniformBufferSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    
    const staticVertexValuesU8 = new Uint8Array(staticBufferSize);
    const staticVertexValuesF32 = new Float32Array(staticVertexValuesU8.buffer);
    for (let i =0; i < objects; i++) {
        const staticOffsetU8 = i * (4+2*4);
        const staticOffsetF32 = staticOffsetU8/4;

        staticVertexValuesU8.set([random() *255, random()*255, random()*255, 255], staticOffsetU8 + kColorOffset);
        staticVertexValuesF32.set([random(-0.9, 0.9), random(-0.9, 0.9)], staticOffsetF32 + kOffsetOffset);

        objectInfos.push({
            scale:random(0.2, 0.5),
        });
    }
    device.queue.writeBuffer(staticStorageBuffer, 0, staticVertexValuesF32)
    
    const {vertexData, indexData, numVertices} = createCircleVertices({
        radius: 0.5,
        innerRadius: 0.25,
    });

    const vertexBuffer = device.createBuffer({
        label: 'storage buffer vertices',
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertexData);
    const indexBuffer = device.createBuffer({
        label: 'index buffer',
        size: indexData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    
    device.queue.writeBuffer(indexBuffer, 0, indexData)


    renderPassDescriptor.colorAttachments[0].view =  
        context.getCurrentTexture().createView();

    const encoder = device.createCommandEncoder({label: 'Our encoder'});

    const pass = encoder.beginRenderPass(renderPassDescriptor);
    
    const aspect = canvas.width/canvas.height;
    
    const storageValues = new Float32Array(uniformBufferSize / 4);
    objectInfos.forEach(({scale}, ndx)=> {
        const offset = ndx *((2*4)/4);
        storageValues.set([scale/aspect, scale], offset + kScaleOffset);
    });
    
    device.queue.writeBuffer(changingStorageBuffer, 0, storageValues);
    
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setVertexBuffer(1, staticStorageBuffer);
    pass.setVertexBuffer(2, changingStorageBuffer)
    pass.setIndexBuffer(indexBuffer, 'uint32');
    pass.drawIndexed(numVertices, objects);

    pass.end()

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);


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