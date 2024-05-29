// Set listener that then sets the key value
// Then use that to transform camera



export const inputHandler = {
    removeBlock: true,
    wPressed: false,
    sPressed: false,
    dPressed: false,
    aPressed: false,
    leftMousePressed: false,
    rightMousePressed: false,
    rightMouseDragged: false,
    mouseMove: {
        x: 0,
        y: 0,
    },

    setKeyPressed: function(e, self) {
        if (e.code == 'KeyW') {
            self.wPressed = true;
        } else if (e.code == 'KeyS') {
            self.sPressed = true;
        } else if (e.code == 'KeyA') {
            self.dPressed = true;
        } else if (e.code == 'KeyD') {
            self.aPressed = true;
        }
        e.preventDefault();
        e.stopPropagation();
    },

    setKeyReleased: function(e, self) {
        if (e.code == 'KeyW') {
            self.wPressed = false;
        } else if (e.code == 'KeyS') {
            self.sPressed = false;
        } else if (e.code == 'KeyA') {
            self.dPressed = false;
        } else if (e.code == 'KeyD') {
            self.aPressed = false;
        }
        e.preventDefault();
        e.stopPropagation();
    },

    setMousePressed: function (e, self) {
        if (e.button == 2) {
            self.rightMousePressed = true;
        }
        e.preventDefault();
        e.stopPropagation();
    },

    setMouseReleased: function (e, self) {
        if (e.button == 2) {
            self.rightMousePressed = false;
            self.mouseDragged = false
        }
        e.preventDefault();
        e.stopPropagation();
    },

    setMouseMoveInfo: function (e, self) {
        if (self.rightMousePressed) {
            self.mouseDragged = true
            self.mouseMove.x += e.movementX
            self.mouseMove.y += e.movementY
        }
        e.preventDefault();
        e.stopPropagation();
    }
}