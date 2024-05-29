import { inputHandler } from "./input.js";
import { block } from "./blocks.js"
const dirtButton = document.getElementById("dirt")
const grassButton = document.getElementById("grass")
const sandButton = document.getElementById("sand")
const stoneButton = document.getElementById("stone")
const woodButton = document.getElementById("wood")
const leafButton = document.getElementById("leaf")
const waterButton = document.getElementById("water")


const actionToggle = document.getElementById("actionToggle");
let currentlySelected = dirtButton


actionToggle.addEventListener('click', (e) => {
    inputHandler.removeBlock = !inputHandler.removeBlock;
    actionToggle.innerText = inputHandler.removeBlock ? "Remove Block" : "Add Block"
    console.log(inputHandler.removeBlock);
});

dirtButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.dirt
    currentlySelected.style.border = "5px solid white"
    currentlySelected = dirtButton
    currentlySelected.style.border = "5px solid lightblue"
});

grassButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.grass
    currentlySelected.style.border = "5px solid white"
    currentlySelected = grassButton
    currentlySelected.style.border = "5px solid lightblue"
});

sandButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.sand
    currentlySelected.style.border = "5px solid white"
    currentlySelected = sandButton
    currentlySelected.style.border = "5px solid lightblue"
});

stoneButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.stone
    currentlySelected.style.border = "5px solid white"
    currentlySelected = stoneButton
    currentlySelected.style.border = "5px solid lightblue"
});

woodButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.wood
    currentlySelected.style.border = "5px solid white"
    currentlySelected = woodButton
    currentlySelected.style.border = "5px solid lightblue"
});

leafButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.leaf
    currentlySelected.style.border = "5px solid white"
    currentlySelected = leafButton
    currentlySelected.style.border = "5px solid lightblue"
});

waterButton.addEventListener('click', (e) => {
    inputHandler.blockSelected = block.water
    currentlySelected.style.border = "5px solid white"
    currentlySelected = waterButton
    currentlySelected.style.border = "5px solid lightblue"
});