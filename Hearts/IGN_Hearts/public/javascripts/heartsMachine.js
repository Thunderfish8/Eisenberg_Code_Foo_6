var heartsApp = angular.module("heartsApp", []);

heartsApp.service("game", ["$http", function($http){

    var state = "menu";
    var gameOver = false;

    var cards = [];

    $http.get('../cards.json').success(function(data){
        cards = data.cards;
    });

    var changeState = function(next){
        state = next;
    }

    var getState = function(){
        return state;
    }

    var getCards = function(){
        return cards;
    }

    var refreshCards = function(){
        $http.get('../cards.json').success(function(data){
            cards = data.cards;
        });
    }

    var gameEnded = function(){
        return gameOver;
    }

    return {
        changeState: changeState,
        getState: getState,
        getCards: getCards,
        refreshCards: refreshCards,
        gameEnded: gameEnded
    };

}]);

heartsApp.service('scoring', function(){

    var scoreBoard = [];
    var test = true;

    var addRound = function(round){

        var shotMoon = false;
        for (var c = 0 ; c < 4 ; ++c){
            if (round[c] == 26){
                shotMoon = true;
            }
        }

        if (shotMoon){
            for (var c = 0 ; c < 4 ; ++c){
                round[c] = Math.abs(round[c] - 26);
            }
        }

        if (scoreBoard.length == 0){
            scoreBoard.push(round);
        }
        else {
            var lastRound = scoreBoard[scoreBoard.length - 1];
            var newRound = [0,0,0,0];
            for (var p = 0 ; p < 4 ; ++p){
                var nextScore = lastRound[p] + round[p];
                newRound[p] = nextScore;
                if (nextScore > 99){
                    gameOver = true;
                }
            }
            scoreBoard.push(newRound);
        }

    }

    var getScores = function(){
        return scoreBoard;
    }

    var getTest = function(){
        return test;
    }

    var resetGame = function(){
        scoreBoard = [];
    }

    return {
        addRound: addRound,
        getScores: getScores,
        getTest: getTest,
        resetGame: resetGame
    };

});

heartsApp.controller("round", ["$scope", "$http", "$timeout", "scoring", "game", function($scope, $http, $timeout, scoring, game){

    $scope.scoring = scoring;
    $scope.game = game;
    $scope.hands = [[],[],[],[]];
    $scope.plays = [{pic: "card_back.gif"}, {pic: "card_back.gif"}, {pic: "card_back.gif"}, {pic: "card_back.gif"}];
    $scope.gameScore = [0,0,0,0];
    $scope.heartsBroken = false;
    $scope.turnStarting = true;
    $scope.currentSuit = -1;
    $scope.trickWinner = -1;
    $scope.finalWinner = -1;
    $scope.errorMessage = "";
    $scope.trading = true;
    $scope.tradeStagger = 1;
    $scope.trades = [[],[],[],[]];

    $scope.turn = 0;
    $scope.start = 0;

//Watches for the state of the app to change to the round.  Triggers the setup for a game when the view changes to the round view.
    $scope.$watch('game.getState()', function(newValue, oldValue){
        if (newValue == "round"){
            $scope.setup();
        }
    })

    $timeout(function(){ $scope.loadCards(); }, 500);


//Setup Functions and Card Handling Functions
    $scope.loadCards = function(){
        $scope.cards = game.getCards();
    }

//Deals 13 cards to each of 4 players from the deck.
    $scope.dealHand = function(){
        for (var c = 0 ; c < 13 ; ++c){
            for (var p = 0 ; p < 4 ; ++p){
                var incoming = Math.floor(Math.random() * $scope.cards.length)
                $scope.hands[p].push($scope.cards[incoming]);
                if ($scope.cards[incoming].suit == 0 && $scope.cards[incoming].rank == 2){
                    $scope.turn = p;
                    $scope.start = p;
                }
                $scope.cards.splice(incoming, 1);
            }
        }
        $scope.game.refreshCards();
    }

//Sorts all players hands by suit, then by rank in ascending order.
    $scope.sortHands = function(){
        for (var h = 0 ; h < 4 ; ++h){
            $scope.hands[h].sort(function(a, b){
                if (a.suit == b.suit){
                    if (a.rank < b.rank){
                        return -1;
                    }
                    else {
                        return 1;
                    }
                }
                else if (a.suit < b.suit){
                    return -1;
                }
                return 1;
            });
        }
    }

//Prepares for a round to start
    $scope.setup = function(){

        if ($scope.scoring.getScores().length == 0){
            $scope.tradeStagger = 1;
        }

        $scope.loadCards();
        $scope.dealHand();
        $scope.sortHands();
        if ($scope.tradeStagger == 0){
            $scope.trading = false;
            $scope.startRound();
        }
        else {
            $scope.errorMessage = "Select 3 Cards to Pass to An Opponent";
        }
    }

//Starts the round, if the player is not leading off.
    $scope.startRound = function(){
        if ($scope.turn > 0){
            $scope.enemyTurn();
        }
    }

    $scope.getScore = function(id){
        var scores = $scope.scoring.getScores()
        return scores[scores.length - 1][id];
    }


//Functions pertaining to trading at the start of rounds.

    $scope.makeTrades = function(){
        for (t = 0 ; t < 4 ; ++t){
            var target = $scope.hands[(t + $scope.tradeStagger) % 4];
            for (c = 0 ; c < 3 ; ++c){
                target.push($scope.trades[t][c]);
            }
        }
        $scope.trading = false;
        $scope.trades = [[],[],[],[]];
        $scope.tradeStagger = ($scope.tradeStagger + 1) % 4;
        $scope.sortHands();
        $scope.startRound();
        $scope.errorMessage = "";
    }

    $scope.enemyTrades = function(){
        for (var player = 1 ; player < 4 ; ++player){
            var hand = $scope.hands[player];
            for (var trade = 0 ; trade < 3 ; ++trade){
                var maxRank = 0;
                var maxIndex = 0;
                for (var c = 0 ; c < hand.length ; ++c){
                    if (hand[c].rank > maxRank){
                        maxRank = hand[c].rank;
                        maxIndex = c;
                    }
                }
                $scope.trades[player].push(hand[maxIndex]);
                $scope.hands[player].splice(maxIndex, 1);
            }
        }

        $scope.makeTrades();
    }

    $scope.tradeCard = function(index, card){
        $scope.trades[0].push(card);
        $scope.hands[0].splice(index, 1);
        if ($scope.trades[0].length == 3){
            $scope.enemyTrades();
        }
    }





//Enemy AI Code.  Enemies follow a series of decisions that help them make intelligent plays.  In testing, the AI opponents know when to play a low card, and when its time to discard a high card.
    $scope.enemyTurn = function(){
        while ($scope.turn > 0 && (!($scope.turn == $scope.start && !$scope.turnStarting))){
            $scope.turnStarting = false;
            var hand = $scope.hands[$scope.turn];

            //If the trick has already begun.
            if ($scope.turn != $scope.start){
                if ($scope.hasSuit($scope.turn)){
                    if ($scope.isSafe($scope.turn)){
                        var index = $scope.playSafe($scope.turn);
                        $scope.plays[$scope.turn] = hand[index];
                        hand.splice(index, 1);
                    }
                    else {
                        var index = -1;
                        if (($scope.turn + 1) % 4 == $scope.start){
                            index = $scope.playReckless($scope.turn);
                        }
                        else {
                            index = $scope.playHopeful($scope.turn);
                        }
                        $scope.plays[$scope.turn] = hand[index];
                        hand.splice(index, 1);
                        $scope.trickWinner = $scope.turn;
                    }
                }
                else {
                    var index = $scope.maxPoints($scope.turn);
                    $scope.plays[$scope.turn] = hand[index];
                    hand.splice(index, 1);
                }
            }

            //If the enemy is leading the trick.
            else {
                if (hand[0].suit == 0 && hand[0].rank == 2){
                    $scope.plays[$scope.turn] = hand[0];
                    $scope.currentSuit = hand[0].suit;
                    hand.splice(0,1);
                }
                else {
                    var index = $scope.minLead($scope.turn);
                    $scope.plays[$scope.turn] = hand[index];
                    $scope.currentSuit = hand[index].suit;
                    hand.splice(index, 1);
                }
                $scope.trickWinner = $scope.turn;
            }

            $scope.turn = ($scope.turn + 1) % 4;
        }

        if ($scope.start == $scope.turn){
            $scope.determineTrick();
        }

    }

//This function dictates how the player's turn pans out.  Most checks determine if the play is valid within the rules.
    $scope.playCard = function(index, card){
        var valid = false;
        if ($scope.turn == 0){

            //Case 1: First trick of the round, leading off
            if ($scope.currentSuit == -1 && $scope.trickWinner == -1 && $scope.hands[1].length == 13){
                if (card.suit == 0 && card.rank ==2){
                    $scope.plays[0] = card;
                    $scope.hands[0][0] = {played: true};
                    $scope.trickWinner = 0;
                    $scope.currentSuit = 0;
                    valid = true;
                }
                else {
                    $scope.errorMessage = "You must start the round by playing the 2 of Clubs.";
                }
            }

            //Case 2: Leading a trick that is not the first trick.
            else if ($scope.start == 0){
                if ($scope.heartsBroken || card.suit < 3){
                    $scope.plays[0] = card;
                    $scope.hands[0][index] = {played: true};
                    $scope.trickWinner = 0;
                    $scope.currentSuit = card.suit;
                    valid = true;
                }
                else {
                    $scope.errorMessage = "You cannot play hearts until hearts have been broken.";
                }
            }

            //Case 3: Following suit during a trick.
            else if (card.suit == $scope.currentSuit){
                $scope.plays[0] = card;
                $scope.hands[0][index] = {played: true};
                if (card.rank > $scope.plays[$scope.trickWinner].rank){
                    $scope.trickWinner = 0;
                }
                valid = true;
            }

            //Case 4: Breaking suit due to lack of proper suit.
            else {
                if (!$scope.hasSuit(0)){
                    if ($scope.hands[1].length == 13){
                        if (card.points == 0){
                            $scope.plays[0] = card;
                            $scope.hands[0][index] = {played: true};
                            valid = true;
                        }
                    }
                    else{
                        if (card.points > 0){
                            $scope.heartsBroken = true;
                        }
                        $scope.plays[0] = card;
                        $scope.hands[0][index] = {played: true};
                        valid = true;
                    }
                }
                else {
                    $scope.errorMessage = "You must play a card of the same suit as the leading card.";
                }
            }
        }

        if (valid){
            $scope.errorMessage = "";
            $scope.turn = 1;
            $scope.turnStarting = false;
            if ($scope.start == 1){
                $scope.determineTrick();
            }
            else {
                $scope.enemyTurn();
            }
        }
    }


//The following functions are used to help determine whether plays are valid, and to help guide AI opponents to make the correct plays based on their situation.
    $scope.hasSuit = function(player){
        var hand = $scope.hands[player];
        for (var c = 0 ; c < hand.length ; ++c){
            if (hand[c].suit == $scope.currentSuit){
                return true;
            }
        }
        return false;
    }

//Function determines if an AI will be forced to take the cards from a trick.
    $scope.isSafe = function(player){
        var hand = $scope.hands[player];
        var opp = $scope.plays[$scope.trickWinner];
        for (var c = 0 ; c < hand.length ; ++c){
            if (hand[c].suit == opp.suit){
                if (hand[c].rank < opp.rank){

                    return true;
                }
            }
            else if (hand[c].suit > opp.suit){
                return false;
            }
        }
        return false;
    }

//Function for when an AI knows they will not "win" the trick.
    $scope.playSafe = function(player){
        var hand = $scope.hands[player];
        var opp = $scope.plays[$scope.trickWinner];
        for (var c = 0 ; c < hand.length ; ++c){
            if (hand[c].suit == opp.suit){
                if (hand[c].rank > opp.rank){
                    return c - 1;
                }
            }
            else if (hand[c].suit > opp.suit){
                return c - 1;
            }
        }
        return hand.length - 1;
    }

//Function for when an AI can't guarantee a "win" or a "loss" for the trick.
    $scope.playHopeful = function(player){
        var hand = $scope.hands[player];
        for (var c = 0 ; c < hand.length ; ++c){
            if (hand[c].suit == $scope.currentSuit){
                if (hand[c].suit == 2 && hand[c].rank == 12 && hand[c+1].suit == $scope.currentSuit){
                    return c + 1;
                }
                return c;
            }
        }
    }

//Function for when an AI knows they are going to "win" the trick.
    $scope.playReckless = function(player){
        var hand = $scope.hands[player];
        for (var c = 0 ; c < hand.length ; ++c){
            if (hand[c].suit > $scope.currentSuit){
                if (hand[c - 1].rank == 12 && hand[c - 1].suit == 2 && hand[c - 2].suit == $scope.currentSuit){
                    return c - 2;
                }
                return c - 1;
            }
        }
        if (hand[c - 1].rank == 12 && hand[c - 1].suit == 2 && hand[c - 2].suit == $scope.currentSuit){
            return c - 2;
        }
        return c - 1;
    }

//Determines the card that is worth the most points that is valid to play in a player's hand.
    $scope.maxPoints = function(player){
        var hand = $scope.hands[player];
        var maxP = 0;
        var maxIndex = 0;
        for (var c = 0 ; c < hand.length ; ++c){
            if (hand[c].points > maxP){
                if (hand.length < 13){
                    maxP = hand[c].points;
                    maxIndex = c;
                }
            }
            else if (hand[c].points == maxP && hand[c].rank > hand[maxIndex].rank){
                maxP = hand[c].points;
                maxIndex = c;
            }
        }
        if (hand[maxIndex].points > 0){
            $scope.heartsBroken = true;
        }
        return maxIndex;
    }

//Determines lowest rank card in a hand that can be played.
    $scope.minLead = function(player){
        var hand = $scope.hands[player];
        var minRank = 15;
        var minIndex = -1;
        for (var c = 0 ; c < hand.length ; ++c){
            if (hand[c].rank < minRank){
                if (hand[c].suit == 3 && !$scope.heartsBroken){
                    return minIndex;
                }
                minRank = hand[c].rank;
                minIndex = c;
            }
        }
        return minIndex;
    }


//Filter player input based on whether the round is in the trading phase or game phase.
    $scope.selectCard = function(index, card){
        if ($scope.trading){
            $scope.tradeCard(index, card);
        }
        else {
            $scope.playCard(index, card);
        }
    }

//After all players have played a card, this function determines who wins the trick.
    $scope.determineTrick = function(){
        for (var c = 0 ; c < 4 ; ++c){
            $scope.gameScore[$scope.trickWinner] += $scope.plays[c].points;
        }
        $scope.finalWinner = $scope.trickWinner;

        $timeout(function(){
            if ($scope.hands[1].length == 0){
                $scope.endRound();
            }
            else {
                $scope.turn = $scope.trickWinner;
                $scope.start = $scope.trickWinner;
                $scope.turnStarting = true;
                $scope.currentSuit = -1;
                $scope.trickWinner = -1;
                $scope.finalWinner = -1;
                $scope.plays = [{pic: "card_back.gif"}, {pic: "card_back.gif"}, {pic: "card_back.gif"}, {pic: "card_back.gif"}];
                if ($scope.turn > 0){
                    $scope.enemyTurn();
                }
            }
        }, 2000);
    }

//After all cards in a round have been played, this function deals with setting up results and preparing for a potential next round.
    $scope.endRound = function(){
        $scope.scoring.addRound($scope.gameScore);
        $scope.turnStarting = true;
        $scope.currentSuit = -1;
        $scope.trickWinner = -1;
        $scope.finalWinner = -1;
        $scope.trading = true;
        $scope.heartsBroken = false;
        $scope.plays = [{pic: "card_back.gif"}, {pic: "card_back.gif"}, {pic: "card_back.gif"}, {pic: "card_back.gif"}];
        $scope.hands = [[],[],[],[]];
        $scope.gameScore = [0,0,0,0];
        $scope.game.changeState("results");
    }

}]);


//This controller handles the results screen that displays after every round.
heartsApp.controller("results", ["$scope", "scoring", "game", function($scope, scoring, game){

    $scope.scoring = scoring;
    $scope.game = game;
    $scope.gameOver = false;
    $scope.winners = ["You", "Computer A", "Computer B", "Computer C"];
    $scope.winningIndex = -1;
    $scope.scoreBoard = scoring.getScores();

    $scope.$watch('game.getState()', function(newValue, oldValue){
        if (newValue == "results"){
            var lastScore = $scope.scoreBoard[$scope.scoreBoard.length - 1];
            if ($scope.scoreBoard.length > 0){
                for (var s = 0 ; s < 4 ; ++s){
                    if (lastScore[s] > 99){
                        $scope.gameOver = true;
                    }
                    else{
                        console.log(lastScore[s]);
                    }
                }

                if ($scope.gameOver){
                    var min = 200;
                    for (var p = 0 ; p < 4 ; ++p){
                        if (lastScore[p] < min){
                            min = lastScore[p];
                            $scope.winningIndex = p;
                        }
                    }
                }
            }
        }
    })




    $scope.nextRound = function(){
        $scope.game.changeState('round');
    }

    $scope.newGame = function(){
        $scope.scoring.resetGame();
        $scope.game.changeState('round');
    }

    $scope.mainMenu = function(){
        $scope.game.changeState("menu");
    }

}]);


//This controller handles the home page that displays when navigating to the website.
heartsApp.controller("menu", ["$scope", "game", function($scope, game){

    $scope.game = game;

    $scope.startGame = function(){
        game.changeState("round")
    }

}]);
