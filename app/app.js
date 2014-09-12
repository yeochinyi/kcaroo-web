'use strict';

function extractTableName(text){
  var index = text.indexOf('_id');
  if(index == -1){
    return null;
  }
  return text.substring(0,index);
}

String.prototype.toUnderscore = function(){
  return this.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
};

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'ngResource',
  'myApp.view1',
  'myApp.view2',
  'myApp.version'
]).
factory('DataFactory',['$resource', function($resource) {
  var p = $resource('sample/:table.json',{},{
    query: {method:'GET',params:{table:'table'},isArray:true}
  });
  return p;
}]).
factory('SyncDataFactory',['$resource','$q','$timeout', function($resource,$q,$timeout) {

  function sync() {

    var deferred = $q.defer();

    $timeout(function(){
      deferred.notify('Notify!123');

      var data = $resource('sample/static1.json');

      if(data != null){
        deferred.resolve(data);
      }
      else{
        deferred.reject("Timeout!");
      }

    },1000);

    return deferred.promise;
  };  

  return {
    sync : sync,
  }
}]).
controller('DataTableCtrl', ['$scope','DataFactory','$timeout', function($scope,DataFactory,$timeout){
    
    var mapOfMap= {}; // store all ref Tables
    var map = {}; //map of id vs row.. use for cell selection
    var headers = [];
    var data = DataFactory.query({table:'primary1'});

    data.$promise.then(function(data){
      //Get Data
      for(var i in data) {
        var id = data[i].id;
        map[id] = data[i];
      };

      var promises = [];

      //Get Headers
      for(var k in data[0]){
        if(data[0].hasOwnProperty(k)){
          headers.push(k);

          var refTable = extractTableName(k);
          if(refTable != null){

            var refData = DataFactory.query({table:refTable});

            promises.push(refData.$promise);

            refData.$promise.then(function(data){
              var refMap = {};
              for(var ri in refData) {
                var refId = refData[ri].id;
                refMap[refId] = refData[ri];
              };            
              //store into a map for ref
              mapOfMap[refTable] = refMap;
              mapOfMap[refTable + '_id'] = refMap;
            });    
          };
        };      
      };

      $timeout(function(){
        $scope.headers = headers;        
        $scope.mapOfMap = mapOfMap;

        var displayData = {};
       //
        for(var i in data) {          
          for(var h in headers){
            displayData[h] = getRefValue(data[i][h]);
          }                    
        };
        $scope.data = displayData;


      },1000);

    });

    function getRefValue(value,refTable){
      var map = mapOfMap[refTable];
      if(map == null) return value;
      var refValue = map[value];
      return refValue == null ? value : refValue.name;
    }

    $scope.sort = function(colName){
      $scope.orderProp = colName;
    };

    $scope.select = function(id,field){      
      //$scope.selectObj = map[id];
      $scope.selectObj = angular.copy(map[id]);
    };

    $scope.submit = function(){
      //$scope.submitted = submitted;
    };

    //$scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
    //  event.preventDefault();
    //});
}]).
controller('TestCtrl', ['$scope','$http','DataFactory', 'SyncDataFactory','$q','$interval', function($scope,$http,DataFactory,SyncDataFactory,$q,$interval){

  $scope.data = "NYS!";

    var data = DataFactory.query({table:'primary1'});

    data.$promise.then(function(data){
      $scope.data = data;
    });

    /*
    var promise = SyncDataFactory.sync();

    promise.then(function(data){
      $scope.data = data;
    }, function(reason){
      $scope.data = reason;
    }, function(update){
      $scope.data = update;
    });*/


}]).
filter('cleanCol',function(){
  return function(input){    
    var table = extractTableName(input);
    var r =  table == null ? input : table;
    return r.toUnderscore();
  }
}).
controller('FormCtrl', function($scope){
    $scope.submit = function(){
      $scope.submitted = '';
    };

}).
config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/data', {
    templateUrl: 'views/data-table.html',
    controller : 'DataTableCtrl',
  })
  .when('/test', {
    templateUrl: 'views/test.html',
    controller : 'TestCtrl',
  })
  .otherwise({redirectTo: '/view1'});
}]);
