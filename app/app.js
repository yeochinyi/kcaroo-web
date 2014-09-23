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
    
    // ref tablename vs map value i.e {'static_table_1':{ id:{col1:value1, col2:value2, ...}, ... }...}
    var mapOfMap= {}; 
    // ref tablename vs header data i.e {'static_table_1':[{name:col1, hide:false, ...}, {name:col2, hide:false, ...} ...]...}
    var mapOfHeaders = {};

    $scope.tables = ['dynamic_table_2','static_table_1'];

    var currentTable;

    $scope.$watch('currentTable',function(newVal,oldVal){

      if(newVal == undefined) return;
      currentTable = newVal;

      var data = DataFactory.query({table:currentTable});
      data.$promise.then(function(data){
        //Get Data
        setMapFromQuery(data,currentTable);

        //wait for combined promises
        var promises = [];
        //Get Headers & all necessary static data

        var headers = [];

        angular.forEach(data[0], function(v, k){            
          var hide = k.indexOf('desc') != -1 
          headers.push({name:k, hide:hide});
          var refTable = extractTableName(k);
          if(refTable != null){
            if(mapOfMap[refTable] == null){
              var refData = DataFactory.query({table:refTable});
              promises.push(refData.$promise.then(function(data){
                setMapFromQuery(refData,refTable);
              }));    
            }
          };
        });

        mapOfHeaders[currentTable] = headers;

        //all promises resolved, time to massage current table data
        $q.all(promises).then(function(){
          $scope.headers = currentHeader();        
          $scope.mapOfMap = mapOfMap;
          $scope.displayData = data;
        });
      });      
    });



    function setMapFromQuery(refData,refTable){
      var refMap = {};
      for(var i = 0; i < refData.length; i++) {
        var refId = refData[i].id;
        refMap[refId] = refData[i];
      };            
      //store into a map for ref
      mapOfMap[refTable] = refMap;
      mapOfMap[refTable + '_id'] = refMap; //For easy lookup using col id
    }

    function currentMap(){
      return mapOfMap[currentTable];
    }

    function currentHeader(){
      return mapOfHeaders[currentTable];
    }    
    
    function getDisplayData(data) {
      var displayData = {};

      var headers = currentHeader();
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
      $scope.formObj = angular.copy(currentMap()[id]);
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
      currentMap()[obj['id']] = obj;
      $scope.displayData.push(obj);
    };

    function update(obj){
      currentMap()[obj['id']] = obj;
      findDisplayData(obj,true);
    };

    function remove(obj){
      currentMap()[obj['id']] = undefined;
      findDisplayData(obj,false);
    };


    function getLastId(){
      var id = 0;

      for(var i in currentMap()){
        var c = currentMap()[i]['id'];
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
      $scope.formObj = angular.copy(currentMap()[id]);
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
