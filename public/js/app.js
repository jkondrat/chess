var app = angular.module('chess', []);

app.controller('ChessController', ['$scope', function($scope) {
	$scope.rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	$scope.ranks = [8, 7, 6, 5, 4, 3, 2, 1];

	var chess = new Chess();
	var socket;
	var validMoves = [];

	function validateMove(fromTile, toTile) {
		if (fromTile.get(0) !== toTile.get(0)) {
			var sqTo = toTile.data("sq");
			return ($.inArray(sqTo, validMoves) != -1);
		}
		return false;
	}

	function initBoard() {
		$.each($(".tile"), function(i, tile) {
			var tileEl = $(tile);
			var sq = tileEl.data("sq");
			var piece = chess.get(sq);
			if (piece != null) {
				var pieceEl = $('<span />');
				pieceEl.addClass('piece');
				if (piece.color == 'b') {
					pieceEl.addClass('black');
				} else {
					pieceEl.addClass('white');
				}
				pieceEl.addClass(piece.type);
				tileEl.empty();
				tileEl.append(pieceEl);
			}
		});

		$( ".piece" ).draggable({
			revert: 'invalid',
			start: function( event, ui ) {
				validMoves = [];
				var sq = $(this).parent().data("sq");
				var moves = chess.moves({square: sq, verbose: true});
				$.each(moves, function(i, m) {
					validMoves.push(m.to);
				});
			}
		});
		$( ".tile" ).droppable({
			accept: function (el) {
				return validateMove(el.parent(), $(this));
			},
			drop: function(event, ui) {
				var draggable = ui.draggable;
				var droppable = $(this);
				var sqFrom = draggable.parent().data("sq");
				var sqTo = droppable.data("sq");
				chess.move({ from: sqFrom, to: sqTo });
				
				droppable.empty();
				$(draggable).detach().css({top:0, left:0}).appendTo(droppable);
  			}
		});
	}

	window.addEventListener("load", function (event) {
		if (!socket || !socket.connected) {
			socket = io({forceNew: true});
		}

		initBoard();
	});
}]);
