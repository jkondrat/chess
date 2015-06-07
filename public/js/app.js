var app = angular.module('chess', []);

app.controller('ChessController', ['$scope', function($scope) {
	$scope.chars = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
	$scope.ranks = [1, 2, 3, 4, 5, 6, 7, 8];

	var socket;

	window.addEventListener("load", function (event) {
	    if (!socket || !socket.connected) {
	        socket = io({forceNew: true});
	    }
	});
}]);
