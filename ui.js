import { inputHandler } from "./input.js";
import { block } from "./blocks.js"
import { worldCamera } from "./main.js";
import { vec3, mat4 } from 'https://wgpu-matrix.org/dist/2.x/wgpu-matrix.module.js';

const dirtButton = document.getElementById("dirt")
const grassButton = document.getElementById("grass")
const sandButton = document.getElementById("sand")
const stoneButton = document.getElementById("stone")
const woodButton = document.getElementById("wood")
const leafButton = document.getElementById("leaf")
const waterButton = document.getElementById("water")
const toggleBoundary = document.getElementById("toggleBoundary")
const resetCameraButton = document.getElementById("resetCamera")

const addBlockButton = document.getElementById("addBlock");
addBlockButton.addEventListener('click', (e)=>{
    inputHandler.removeBlock = false
    addBlockButton.classList.add("selectedToolButton")
    removeBlockButton.classList.remove("selectedToolButton")
})


const removeBlockButton = document.getElementById("removeBlock");
removeBlockButton.addEventListener('click', (e)=>{
    inputHandler.removeBlock = true
    addBlockButton.classList.remove("selectedToolButton")
    removeBlockButton.classList.add("selectedToolButton")
})


let currentlySelected = stoneButton

dirtButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.dirt
    currentlySelected.classList.remove("selectedToolButton")
    currentlySelected = dirtButton
    currentlySelected.classList.add("selectedToolButton")
});

grassButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.grass
    currentlySelected.classList.remove("selectedToolButton")
    currentlySelected = grassButton
    currentlySelected.classList.add("selectedToolButton")
});

sandButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.sand
    currentlySelected.classList.remove("selectedToolButton")
    currentlySelected = sandButton
    currentlySelected.classList.add("selectedToolButton")
});

stoneButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.stone
    currentlySelected.classList.remove("selectedToolButton")
    currentlySelected = stoneButton
    currentlySelected.classList.add("selectedToolButton")
});

woodButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.wood
    currentlySelected.classList.remove("selectedToolButton")
    currentlySelected = woodButton
    currentlySelected.classList.add("selectedToolButton")
});

leafButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.leaf
    currentlySelected.classList.remove("selectedToolButton")
    currentlySelected = leafButton
    currentlySelected.classList.add("selectedToolButton")
});

waterButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.water
    currentlySelected.classList.remove("selectedToolButton")
    currentlySelected = waterButton
    currentlySelected.classList.add("selectedToolButton")
});

toggleBoundary.addEventListener('change', (e)=> {
    inputHandler.showBoundary =!inputHandler.showBoundary
})


resetCameraButton.addEventListener('click', (e) => {
    worldCamera.pos = vec3.create(5,3,15)
    worldCamera.front = vec3.create(0,0,-1)
})