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
controller('DataTableCtrl', ['$scope','DataFactory','$timeout','$q','$modal',function($scope,DataFactory,$timeout,$q,$modal){
    
    // ref tablename vs map value i.e {'static_table_1':{ 1:name1, 2:name2 }, 'static_table_2':{ 1:name1, 2:name2 } }
    var mapOfMap= {}; 
    //map of current table id vs real key:value
    //use for cell selection
    var idObjMap = {}; 
    //current table headers array is used as index
    var headers = [];

    var data = DataFactory.query({table:'dynamic_table_2'});
    data.$promise.then(function(data){
      //Get Data
      for(var i in data) {
        var id = data[i].id;
        idObjMap[id] = data[i];
      };

      //wait for combined promises
      var promises = [];
      //Get Headers & all necessary static data
      //for(var k in data[0]){
      angular.forEach(data[0], function(value, k){            
        //if(data[0].hasOwnProperty(k)){ //filter out hidden properties like $.
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
        //};      
      });
      //all promises resolved, time to massage current table data
      $q.all(promises).then(function(){
        $scope.headers = headers;        
        $scope.mapOfMap = mapOfMap;

        /*var displayData = [];
        for(var i = 0; i < data.length; i++) {
          displayData.push(getDisplayData(data[i]));
        };
        $scope.displayData = displayData;*/
        $scope.displayData = data;
      });
    });

    
    function getDisplayData(data) {
      var displayData = {};

      for(var j in headers){
        var h = headers[j]; 
        var value = data[h];              
        var refValue = getRefValue(value,h);
        displayData[h] = refValue;
      }       
      return displayData
    }    

    function getRefValue(value,refTable){
      var refMap = mapOfMap[refTable];
      if(refMap == null) return value;
      var refValue = refMap[value];
      return refValue == null ? value : refValue.name;
    }

    $scope.getRefValue = getRefValue;

    $scope.sort = function(colName){
      $scope.orderProp = colName;
    };

    $scope.select = function(id,field){      
      $scope.formObj = angular.copy(idObjMap[id]);
    };

    function findDisplayData(obj, isReplace){
      for(var i in $scope.displayData){
        if($scope.displayData[i]['id'] == obj['id']){
          if(isReplace){
            $scope.displayData.splice(i,1,obj);
          }
          return;
        }
      }
    };

    function add(obj){
      idObjMap[obj['id']] = obj;
      $scope.displayData.push(obj);
    };

    function update(obj){
      idObjMap[obj['id']] = obj;
      findDisplayData(obj,true);
    };

    function remove(obj){
      idObjMap[obj['id']] = undefined;
      findDisplayData(obj,false);
    };


    function getLastId(){
      var id = 0;
      for(var i in idObjMap){
        var c = idObjMap[i]['id'];
        if(c > id) id = c;
      }
      return id;
    };

    $scope.clone = function(){      
      var formObj = $scope.formObj;
      formObj['id'] = getLastId() + 1;
      add(formObj);
      modalInstance.close();
    };

    $scope.update = function(){      
      var formObj = $scope.formObj;
      update(formObj);
      modalInstance.close();
    };

    $scope.delete = function(){ 
      //remove(formObj);
      //soft delete
      var formObj = $scope.formObj;
      formObj['$ops'] = 'delete';
      update(formObj);
      modalInstance.close();
    };

    $scope.clear = function(){      
      $scope.formObj = {};
    };

    $scope.rowClass = function(row){
      if(row.$ops == 'delete')
        return 'strike';
      return '';
    };

    $scope.filterRefValue = function(obj){
      var query = $scope.query;
      if(!query) return true;
      var display = getDisplayData(obj);
      
      for(var k in display){
        if(k == 'id') continue;
        if(display.hasOwnProperty(k) && display[k].indexOf(query) != -1) return true
      }
      return false;
    };

    var modalInstance;

    $scope.openModal = function(id,field){
      $scope.formObj = angular.copy(idObjMap[id]);
      modalInstance = $modal.open({
        templateUrl : 'editModal',
        //controller : 'DataTableCtrl',
        size : 'lg',        
        scope : $scope,
      });
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
filter('convert',function(){
  return function(value,idx,fn){
    return fn(value,idx);      
  }
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
