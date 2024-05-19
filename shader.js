const shaderCode = 
`

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@vertex fn vs(
    @location(0) position:vec2f,
    @location(4) perVertexColor: vec3f,
    @location(1) color: vec4f,
    @location(2) offset: vec2f,
    @location(3) scale: vec2f
) -> VSOutput {
    var vsOut:VSOutput;

    vsOut.position = vec4f(position * scale + offset, 0.0, 1.0);
    vsOut.color = color * vec4f(perVertexColor, 1);
    return vsOut;
}

@fragment fn fs(vsOut:VSOutput) -> @location(0) vec4f {
    return vsOut.color;
}
`
