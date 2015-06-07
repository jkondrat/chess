var app = require("express")();
var httpServer = require("http").Server(app);
var io = require("socket.io")(httpServer);
var Chess = require("chess.js").Chess;
var path = require("path");
var lessMiddleware = require("less-middleware");

var static = require('serve-static');
var port = process.env.PORT || 8000;

app.use('/img', static(__dirname + '/public/img', { maxAge: 86400000 }));
app.use('/js/jquery.min.js', static(__dirname + '/bower_components/jquery/dist/jquery.min.js'));
app.use('/js/jquery.min.map', static(__dirname + '/bower_components/jquery/dist/jquery.min.map'));
app.use('/js/jquery-ui.min.js', static(__dirname + '/bower_components/jquery-ui/jquery-ui.min.js'));
app.use('/js/angular.min.js', static(__dirname + '/bower_components/angularjs/angular.min.js'));
app.use('/js/angular.min.map', static(__dirname + '/bower_components/angularjs/angular.min.js.map'));
app.use('/js/chess.min.js', static(__dirname + '/bower_components/chess.js/chess.min.js'));
app.use(lessMiddleware(path.join(__dirname, 'src'), {
	dest: path.join(__dirname, 'public')
}));
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
