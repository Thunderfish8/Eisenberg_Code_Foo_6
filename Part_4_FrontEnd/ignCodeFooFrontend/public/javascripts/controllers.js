var ignApp = angular.module("ignApp", []);

ignApp.controller("main", ['$scope', '$http', function($scope, $http){
    $scope.onArticles = true;
    $scope.articles = [];
    $scope.videos = [];

    //Swithces between articles and videos
    $scope.switchType = function(onArts){
        $scope.onArticles = onArts;
    }

    //The following functions help format times to mm:ss
    $scope.secToMin = function(sec){
        var mins = Math.floor(sec/60);
        var secs = sec % 60;
        secs = $scope.numTwoDig(secs);
        return mins + ":" + secs;
    }

    $scope.numTwoDig = function(num){
        if (num < 10){
            return "0" + num;
        }
        return num;
    }

    //These functions load articles and videos using the API given in the application.
    $scope.loadVideos = function(){
        $http.jsonp('http://ign-apis.herokuapp.com/videos?callback=JSON_CALLBACK', {params:{"startIndex": $scope.videos.length, "count" : 10}}).
        success(function(data){
            $scope.videos = $scope.videos.concat(data.data);
        }).
        error(function(err){
            console.log("oops");
        });
    }

    $scope.loadArticles = function(){
        $http.jsonp('http://ign-apis.herokuapp.com/articles?callback=JSON_CALLBACK', {params:{"startIndex": $scope.articles.length, "count" : 10}}).
        success(function(data){
            console.log(data.data);
            $scope.articles = $scope.articles.concat(data.data);
        }).
        error(function(err){
            console.log("oops");
        });
    }


    //These functions provide a method for navigating to the destination of the articles and videos pulled from the API.
    //Upon examing the url format for articles, I was able to recreate them using parts of the objects pulled from the API despite the articles not having a dedicated url property.
    $scope.followArticleLink = function(date, slug){

        var formattedDate = date.substring(0, 4) + "/" + (date.substring(5, 7)) + "/" + date.substring(8, 10);
        location.assign("http://www.ign.com/articles/" + formattedDate + "/" + slug);
    }

    $scope.followVideoLink = function(url){
        location.assign(url);
    }

    $scope.loadArticles();
    $scope.loadVideos();

}]);
