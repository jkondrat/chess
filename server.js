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
app.use('/js/bootstrap.min.js', static(__dirname + '/bower_components/bootstrap/dist/js/bootstrap.min.js'));
app.use('/css/bootstrap.min.css', static(__dirname + '/bower_components/bootstrap/dist/css/bootstrap.min.css'));
app.use('/fonts', static(__dirname + '/bower_components/bootstrap/dist/fonts'));
app.use(lessMiddleware(path.join(__dirname, 'src'), {
	dest: path.join(__dirname, 'public')
}));
app.use(static(__dirname + '/public'));

var rooms = [];

function findRoom(name) {
	var room = rooms.filter(function(el, idx) {
		return el.name == name;
	});
	if (room.length > 0) {
		return room[0];
	} else {
		return null;
	}
}

function findRoomBySocket(socket) {
	var room = rooms.filter(function(el, idx) {
		return (!!el.black && el.black.socket == socket) 
		|| (!!el.white && el.white.socket == socket);
	});
	if (room.length > 0) {
		return room[0];
	} else {
		return null;
	}
};

function cleanUp(socket) {
	var room = findRoomBySocket(socket);
	if (room) {
		io.to(room.name).emit("status", "disconnected");
		if (room.white) {
			room.white.socket.leave(room.name);
		}
		if (room.black) {
			room.black.socket.leave(room.name);
		}
		var idx = rooms.indexOf(room);
		rooms.splice(idx, 1);
	}
}

io.sockets.on("connection", function (socket) {
	console.log("new connection");

	socket.on("join", function (userName, roomName) {
		if (!userName || !roomName) {
			return;
		}
		var user = {};
		user.socket = socket;
		user.name = userName;
		var existingRoom = findRoom(roomName);
		if (existingRoom != null && (existingRoom.white != null
			|| existingRoom.black.name == userName)) {
			socket.emit("status", "busy");
			return;
		}
		socket.join(roomName);
		if (existingRoom != null) {
			existingRoom.white = user;
			existingRoom.game = new Chess();
			existingRoom.black.socket.emit("start", "b");
			existingRoom.white.socket.emit("start", "w");
		} else {
			var room = {}
			room.name = roomName;
			room.black = user;
			rooms.push(room);
			socket.emit("status", "waiting");
		}
	});

	socket.on("disconnect", function() {
		cleanUp(socket);
	});

	socket.on("turn", function(sqFrom, sqTo) {
		var room = findRoomBySocket(socket);
		if (!!room) {
			var move = room.game.move({ from: sqFrom, to: sqTo });
			if (move != null) {
				io.to(room.name).emit("turn", sqFrom, sqTo);
				if (room.game.game_over()) {
					var idx = rooms.indexOf(room);
					rooms.splice(idx, 1);
				}
			}
		}
	});

	socket.on("listRooms", function() {
		var roomList = [];
		for (var i = 0; i < rooms.length; i++) {
			var room = {};
			room.name = rooms[i].name;
			if (!rooms[i].white) {
				room.status = "available";
			} else {
				room.status = "busy";
			}
			roomList.push(room);
		}
		socket.emit("rooms", roomList);
	});

	socket.on("msg", function(text) {
		var room = findRoomBySocket(socket);
		if (!!room) {
			var msg = {};
			msg.text = text;
			if (!!room.white && room.white.socket == socket) {
				msg.name = room.white.name;
			} else {
				msg.name = room.black.name;
			}
			io.to(room.name).emit("msg", msg);
		}
	});

	socket.on("error", function (err) {
		console.dir(err);
	});
});


httpServer.listen(port, function () {
	console.log("listening on port " + port);
});
