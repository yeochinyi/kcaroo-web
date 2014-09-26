'use strict';


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

  $scope.tables = ['dynamic_table_2','static_table_1'];
  $scope.currentTable = 'dynamic_table_2';

  var dTable = new DTable();

  $scope.$watch('currentTable',function(newVal,oldVal){

    if(newVal == undefined) return;
    dTable.currTable = newVal;

    var data = DataFactory.query({table:newVal});
    data.$promise.then(function(data){
        //Get Data
        dTable.addData(newVal,data);

        //wait for combined promises
        var promises = [];
        //Get Headers & all necessary static data

        var tables = dTable.currRefTables();
        for(var i in tables){
          var table = tables[i];
          var refData = DataFactory.query({table:table});
          promises.push(refData.$promise.then(function(data){
            dTable.addData(table,refData);
          }));          
        }

        //all promises resolved, time to massage current table data
        $q.all(promises).then(function(){
          //dTable.linkHeaders(newVal);
          $scope.dTable = dTable;
        });
      });      
  });  

  $scope.translate = function (value,header){
    return dTable.translate(header,value)
  };

  $scope.sort = function(colName){
    $scope.orderProp = colName;
  };

  $scope.select = function(id,field){      
    $scope.formObj = angular.copy(currentMap()[id]);
  };

  function add(obj){
    dTable.currData()[obj['id']] = obj;
  };

  function update(obj){
    dTable.currData()[obj['id']] = obj;
  };

  function remove(obj){
    dTable.currData()[obj['id']] = undefined;
  };

  $scope.hide = function(header,enable){
    header.hide = enable;
  }

  $scope.clone = function(){      
    var formObj = $scope.formObj;
    formObj['id'] = dTable.getLastId() + 1;
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
    return dTable.rowContains(obj,query);
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

  /*
  $scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
    event.preventDefault();
  });
  */
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
    //var table = extractTableName(input);
    //var r =  table == null ? input : table;
    //return r.toUnderscore();
    return input;
  }
}).
filter('convert',function(){ // NG ie. : {{ v[k.id] | convert:k:translate }}
  return function(header,value,fn){
    return fn(header,value);      
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
