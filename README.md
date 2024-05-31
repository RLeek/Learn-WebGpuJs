# Voxel Builder
A webgpu based voxel editor for creating small scenes on the web.

This is my first custom project after learning graphics programming for ~1.5 months. Originally, this was supposed to be done using WGPU and C++, however the verbosity of using the C++ bindings and lack of good tutorials led me to choosing javascript and keeping this to the web as opposed to a native/cross-platform app.  

Features include:
- Editing 10x10x10 voxel worlds
- Supports free-moving camera using WASD and right-click to pan
- Removing and adding voxels using left-click with tools

Link:

[voxels.arkanlily.dev](https://voxels.arkanlily.dev/) (Requires chrome or firefox nightly build)

To run locally, simply run http-server and open localhost in a browser with WebGPU support

Demo of current state:

![demo](Animation.gif)

Potential future features include:
- Support for 20x20x20 voxel worlds and beyond, through improving performance + using chunks for voxel worlds
- Arbitrary colors for blocks + eyedropper tool for referencing previously used colors
- Custom skyboxes
- Custom block textures (+ potentially normal mapping and materials)
- Dynamic directional lighting, including shadow mapping
- Dynamic point lights through voxels
