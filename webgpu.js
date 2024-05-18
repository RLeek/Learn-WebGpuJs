
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
    const kOffsetOffset = 4;
  
    // Define Uniform
    const objects = 100;
    const objectInfos = [];
    const uniformBufferSize = 2*4;    
    const staticBufferSize = 4*4 + 2 * 4 + 2*4;


    for (let i = 0; i< objects; i++) {    
        const staticUniformBuffer = device.createBuffer({
            size: staticBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        let uniformValues = new Float32Array(staticBufferSize/4);
        
        uniformValues.set([random(),random(),random(),1], kColorOffset);
        uniformValues.set([random(-0.9, 0.9), random(-0.9, 0.9)], kOffsetOffset);
        device.queue.writeBuffer(staticUniformBuffer, 0 ,uniformValues);

        uniformValues = new Float32Array(uniformBufferSize/4);
        const uniformBuffer = device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const bindGroup = device.createBindGroup({
            label: `bind group for ${i}`,
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: {buffer:staticUniformBuffer}},
                {binding: 1, resource: {buffer:uniformBuffer}}
            ]
        })

        objectInfos.push({
            scale: random(0.2, 0.5),
            uniformBuffer,
            uniformValues,
            bindGroup,
        });
    }






    renderPassDescriptor.colorAttachments[0].view =  
        context.getCurrentTexture().createView();

    const encoder = device.createCommandEncoder({label: 'Our encoder'});

    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
   
    const aspect = canvas.width/canvas.height;

    for (const {scale, bindGroup, uniformBuffer, uniformValues} of objectInfos) {
        uniformValues.set([scale/aspect, scale], kScaleOffset);
        device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
        pass.setBindGroup(0, bindGroup)
        pass.draw(3);
    }
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