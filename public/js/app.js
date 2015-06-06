window.addEventListener("load", function (event) {
    var socket;

    if (!socket || !socket.connected) {
        socket = io({forceNew: true});
    }
});
