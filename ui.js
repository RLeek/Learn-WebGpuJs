import { inputHandler } from "./input.js";


const actionToggle = document.getElementById("actionToggle");

actionToggle.addEventListener('click', (e) => {
    inputHandler.removeBlock = !inputHandler.removeBlock;
    actionToggle.innerText = inputHandler.removeBlock ? "Remove Block" : "Add Block"
    console.log(inputHandler.removeBlock);
});



