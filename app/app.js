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
  'ui.bootstrap',
]).
factory('DataFactory',['$resource', function($resource) {
  var p = $resource('sample/:table.json',{},{
    query: {method:'GET',params:{table:'table'},isArray:true}
  });
  return p;
}]).
/*
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
}]).*/
controller('DataTableCtrl', ['$scope','DataFactory','$timeout','$q', function($scope,DataFactory,$timeout,$q){
    
    // ref tablename vs map value i.e {'static_table_1':{ 1:name1, 2:name2 }, 'static_table_2':{ 1:name1, 2:name2 } }
    var mapOfMap= {}; 
    //map of current table id vs real key:value
    //use for cell selection
    var map = {}; 
    //current table headers array is used as index
    var headers = [];

    // displayMap of id vs display key:value
    //var displayMap = {};

    var lastId = 0;

    var data = DataFactory.query({table:'primary1'});
    data.$promise.then(function(data){
      //Get Data
      for(var i in data) {
        var id = data[i].id;
        map[id] = data[i];
      };

      //wait for combined promises
      var promises = [];
      //Get Headers & all necessary static data
      for(var k in data[0]){
        if(data[0].hasOwnProperty(k)){ //filter out hidden properties like $.
          headers.push(k);

          var refTable = extractTableName(k);
          if(refTable != null){
            var refData = DataFactory.query({table:refTable});
            promises.push(refData.$promise.then(function(data){
              var refMap = {};
              for(var i = 0; i < refData.length; i++) {
                var refId = refData[i].id;
                refMap[refId] = refData[i];
              };            
              //store into a map for ref
              mapOfMap[refTable] = refMap;
              mapOfMap[refTable + '_id'] = refMap; //For easy lookup using col id
            }));    
          };
        };      
      };
      //all promises resolved, time to massage current table data
      $q.all(promises).then(function(){
        $scope.headers = headers;        
        $scope.mapOfMap = mapOfMap;

        var displayData = [];
        //var displayMap = {};
        for(var i = 0; i < data.length; i++) {
          displayData.push(getDisplayData(data[i]));
          //displayMap[data[i]['id']] = getDisplayData(data[i]);
        };
        $scope.displayData = displayData;
        //$scope.displayMap = displayMap;
      });
    });

    function getDisplayData(data) {
      var displayData = {};

      //Store last id for demo
      if(data['id'] > lastId) lastId = data['id'];

      for(var j in headers){
        var h = headers[j];
        var value = data[h];
        var refValue = getRefValue(value,h)
        displayData[h] = refValue;
      }       
      return displayData
    }

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
      $scope.formObj = angular.copy(map[id]);
    };

    $scope.clone = function(){      
      var formObj = $scope.formObj;
      formObj['id'] = lastId + 1;
      $scope.displayData.push(getDisplayData(formObj));
    };

    $scope.update = function(){      
      var formObj = $scope.formObj;
      //$scope.displayData.pop(formObj.id);
      //$scope.displayData.push(getDisplayData(formObj));
      $s

    };

    $scope.delete = function(){      
    };

    $scope.clear = function(){      
      $scope.formObj = {};
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
  .otherwise({redirectTo: '/data'});
}]);
