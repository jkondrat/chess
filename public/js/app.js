var app = angular.module('chess', []);

app.controller('ChessController', ['$scope', function($scope) {
	$scope.cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	$scope.ranks = [8, 7, 6, 5, 4, 3, 2, 1];

	var chessboard = $("#chessboard");
	var rooms = $("#rooms");
	var chat = $("#chat");
	var join = $(".join");

	var chess;
	var socket;
	$scope.validMoves = [];
	var player;

	function validateMove(fromTile, toTile) {
		if (chess.turn() === player 
			&& fromTile.get(0) !== toTile.get(0)) {
			var sqTo = toTile.data("sq");
			return ($.inArray(sqTo, $scope.validMoves) != -1);
		}
		return false;
	}

	function findTile(sq) {
		return $("div[data-sq='" + sq + "']");
	}

	function doMove(sqFrom, sqTo) {
		var fromTile = findTile(sqFrom);
		var toTile = findTile(sqTo);
		toTile.empty();
		var piece = fromTile.children().css({top: 0, left: 0}).detach();
		piece.show();
		toTile.append(piece);
		chess.move({ from: sqFrom, to: sqTo });
		if (chess.game_over()) { 
			addMessage({
				"type": "status",
				"text": "Game over."
			});
			onGameEnded();
		}
	}

	function initBoard() {
		$.each($(".tile"), function(i, tile) {
			var tileEl = $(tile);
			tileEl.empty();
			var sq = tileEl.data("sq");
			var piece = chess.get(sq);
			if (piece != null) {
				var pieceEl = $('<span />');
				pieceEl.addClass('piece');
				if (piece.color === 'b') {
					pieceEl.addClass('black');
				} else {
					pieceEl.addClass('white');
				}
				pieceEl.addClass(piece.type);
				tileEl.append(pieceEl);
			}
		});

		$( ".piece" ).draggable({
			revert: 'invalid',
			start: function( event, ui ) {
				if (chess.turn() !== player) return;
				$scope.validMoves = [];
				var sq = $(this).parent().data("sq");
				var moves = chess.moves({square: sq, verbose: true});
				$.each(moves, function(i, m) {
					$scope.validMoves.push(m.to);
				});
				$scope.$apply();
			},
			stop: function( event, ui ) {
				$scope.validMoves = [];
				$scope.$apply();
			}
		});
		$( ".tile" ).droppable({
			accept: function (el) {
				return validateMove(el.parent(), $(this));
			},
			drop: function(event, ui) {
				$scope.validMoves = [];
				var draggable = ui.draggable;
				var droppable = $(this);
				var sqFrom = draggable.parent().data("sq");
				var sqTo = droppable.data("sq");
				findTile(sqFrom).children().hide();
				socket.emit('turn', sqFrom, sqTo);
			}
		});
	}

	function addMessage(msg) {
		$scope.messages.push(msg);
		if ($scope.messages.length > 10) {
			$scope.messages.splice(10, 1);
		}
	}

	function onGameEnded() {
		addMessage({
			"type": "back",
			"text": "Go back to room list"
		});
	}

	window.addEventListener("load", function (event) {
		if (!socket || !socket.connected) {
			socket = io({forceNew: true});
		}
		socket.on('connect', function () {
			socket.emit('listRooms');
		});
		socket.on('rooms', function (rooms) {
			$scope.rooms = rooms;
			$scope.$apply();
		});
		socket.on('start', function (col) {
			$scope.messages = [];
			$scope.alert = '';
			if (col === 'b') {
				$scope.ranks = [1, 2, 3, 4, 5, 6, 7, 8];
			}
			chess = new Chess();
			player = col;
			initBoard();
			rooms.hide();
			chessboard.show();
			chat.show();
			var color = (col === 'w' ? 'white' : 'black');
			$scope.messages.push({
				"type": "status",
				"text": "Game has started. You are playing as " + color + "."
			});
			$scope.$apply();
		});
		socket.on("turn", function(sqFrom, sqTo) {
			doMove(sqFrom, sqTo);
			$scope.$apply();
		});
		socket.on("msg", function(msg) {
			addMessage(msg);
			$scope.$apply();
		});
		socket.on("opponent", function(name) {
			$scope.opponent = name;
			$scope.$apply();
		});
		socket.on('status', function (status) {
			if (status === 'busy') {
				$scope.alert = 'This game has already started';
			} else if (status === 'duplicate username') {
				$scope.alert = 'There is already a player with that name in this room';
			} else if (status === 'waiting') {
				$scope.alert = 'Waiting for players';
				rooms.hide();
			} else if (status === 'disconnected') {
				$scope.alert = 'Player disconnected';
				onGameEnded();
			}
			$scope.$apply();
		});
	});

	$scope.joinRoom = function(room) {
		var roomName = $scope.room;
		if (!!room) {
			if (room.status === 'busy') {
				return;
			}
			roomName = room.name;
		}
		if (!roomName) {
			$scope.alert = 'Room name not specified';
		} else if (!$scope.user) {
			$scope.alert = 'Nickname not specified';
		} else {
			socket.emit('join', $scope.user, roomName);
		}
	};

	$scope.sendMessage = function() {
		if (!!$scope.message) {
			socket.emit('msg', $scope.message);
			$scope.message = '';
		}
	};

	$scope.chessboardClass = function() {
		if (chess && chess.turn() === 'w') {
			return 'shadow-white';
		}
		return 'shadow-black'
	}

	$scope.tileClass = function(sq) {
		if ($.inArray(sq, $scope.validMoves) !== -1) {
			return 'valid-move';
		}
		return '';
	}


	$scope.goBack = function() {
		$scope.rooms = [];
		$scope.messages = [];
		socket.emit('listRooms');
		chat.hide();
		rooms.show();
	}

	$scope.fetchRooms = function() {
		socket.emit('listRooms');
	}

	$scope.isGameStarted = function() {
		return (!!chess && !chess.game_over());
	}
}]);
