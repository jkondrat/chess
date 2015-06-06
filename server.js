var app = require("express")();
var httpServer = require("http").Server(app);
var io = require("socket.io")(httpServer);
var Chess = require('chess.js').Chess;

var static = require('serve-static');
var port = process.env.PORT || 8000;

app.use('/img', static(__dirname + '/public/img', { maxAge: 86400000 }));
app.use('/js/jquery.min.js', static(__dirname + '/bower_components/jquery/dist/jquery.min.js'));
app.use('/js/jquery.min.map', static(__dirname + '/bower_components/jquery/dist/jquery.min.map'));
app.use(static(__dirname + '/public'));

io.sockets.on("connection", function (socket) {
	console.log("connect");

    socket.on("login", function (name) {
    });

    socket.on('disconnect', function() {
    });
    
    socket.on("error", function (err) {
        console.dir(err);
    });
});


httpServer.listen(port, function () {
	console.log("test");
});
