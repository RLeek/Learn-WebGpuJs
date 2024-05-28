
export const cubeShaderCode=
`
@group(0) @binding(0) var<uniform> model:mat4x4f;
@group(0) @binding(1) var<uniform> view:mat4x4f;
@group(0) @binding(2) var<uniform> projection:mat4x4f;

struct vs_output {
    @builtin(position) position: vec4f,
    @location(0) color:vec3f
};


@vertex fn vs(
    @location(0) vertex:vec3f,
    @location(1) color:vec3f,
) -> vs_output {
    var output: vs_output;
    output.position = projection* view * model*vec4(vertex,1.0);
    output.color = color;
    return output;
}

@fragment fn fs(output:vs_output) -> @location(0) vec4f {
    return vec4(output.color, 1.0);
}

`;

export const worldShaderCode=
`
@group(0) @binding(0) var<uniform> model:mat4x4f;
@group(0) @binding(1) var<uniform> view:mat4x4f;
@group(0) @binding(2) var<uniform> projection:mat4x4f;

struct vs_output {
    @builtin(position) position: vec4f,
    @location(0) @interpolate(flat) color:vec2u
};


@vertex fn vs(
    @location(0) vertex:vec3f,
    @location(1) color:vec2u,
) -> vs_output {
    var output: vs_output;
    output.position = projection* view * model*vec4(vertex,1.0);
    output.color = color;
    return output;
}

@fragment fn fs(output:vs_output) -> @location(0) vec2u {
    return output.color;
}

`

export const normalShaderCode=
`
@group(0) @binding(0) var<uniform> model:mat4x4f;
@group(0) @binding(1) var<uniform> view:mat4x4f;
@group(0) @binding(2) var<uniform> projection:mat4x4f;

struct vs_output {
    @builtin(position) position: vec4f,
    @location(0) color:vec3f
};


@vertex fn vs(
    @location(0) vertex:vec3f,
    @location(1) color:vec3f,
) -> vs_output {
    var output: vs_output;
    output.position = projection* view * model*vec4(vertex,1.0);
    output.color = color;
    return output;
}

@fragment fn fs(output:vs_output) -> @location(0) vec4f {
    return vec4(output.color, 1.0);
}

`