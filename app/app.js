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
    query: {method:'GET',params:{table:'table'},isArray:true},
  });
  return p;
}]).
factory('DataTable',['DataFactory','$q', function(DataFactory,$q) {
  var dTable = new DTable();

  DTable.prototype.initData = function(val,callbackFn){
    dTable.currTable = val;
    var data = DataFactory.query({table:val});
    data.$promise.then(function(data){
      //Get Data
      dTable.addData(val,data);

      //wait for combined promises
      var promises = [];
      //Get Headers & all necessary static data

      var tables = dTable.currRefTables();
      for(var i in tables){
        var table = tables[i];
        if(!_.isString(table)) continue;
        var refData = DataFactory.query({table:table});
        promises.push(refData.$promise.then(function(data){
          dTable.addData(table,refData);
        }));          
      }

      //all promises resolved, time to massage current table data
      $q.all(promises).then(function(){
        callbackFn();
      });
    });      
  };

  return dTable;
}]).
controller('DataTableCtrl', ['$scope','DataTable','$modal','$location','$rootScope',function($scope,DataTable,$modal,$location,$rootScope){  

  $scope.tables = ['dynamic_table_2','static_table_1'];
  $scope.currentTable = 'dynamic_table_2';

  function refresh(){
    var cols = DataTable.getEdgeHeaders();
    var headers = DataTable.getMultiLevelHeaders();
    var data = DataTable.currData();
    $scope.headers = headers;
    $scope.cols = cols;
    $scope.data =  data; //strip out arrays
    
  };

  //watching changes in $scope.currentTable in js
  $scope.$watch('currentTable',function(newVal,oldVal){

    if(newVal == undefined) return;    
    DataTable.initData(newVal,refresh);
  });  

  $scope.translate = function (edge,rowObj){
    if(edge.obj.hide) return '...';
    //var key = edge.obj.dheader.id;
    //rowObj = DataTable.getRefRow(edge,rowObj);
    //return rowObj[key];
    return DataTable.getRefValue(edge,rowObj)
  };

  $scope.rowClass = function(row){
    if(row.$ops == 'delete')
      return 'strike';
    return '';
  };

  //for some reason, it returns all data even in filter we pass in "v" (in data).
  $scope.filterRef = function(data){
    var query = $scope.query;
    var retArray;

    //filtering
    if(!query){
      retArray = _.toArray(data);
    }
    else{
      retArray = [];

      var edges = $scope.cols;

      for(var j in  data){
        var objRow = data[j];
        for(var i=0; i < edges.length; i++){
          var edge = edges[i];
          var refValue = DataTable.getRefValue(edge,objRow); //todo. prob need to improve the algo
          if(refValue.toString().contains(query)){
            retArray.push(objRow);
            break;
          }          
        }
      }
    }

    //sorting
    var orderBy = $scope.orderBy;    
    if(orderBy){
      var edge = DataTable.currHeaderTree().find(orderBy);
      retArray = retArray.sort(function(a,b){
        var refA = DataTable.getRefValue(edge,a);
        var refB = DataTable.getRefValue(edge,b);
        return refA > refB;
      });
    }
    
    return retArray;
  };

  $scope.hide = function(id,enable){
    //header.hide = enable;
    DataTable.hideHeader(id,enable);
    refresh();
  };

  $scope.sort = function(colName){
    $scope.orderProp = colName;
  };

  //$scope.select = function(id,field){      
  //  $scope.formObj = angular.copy(currentMap()[id]);
  //};

  //var modalInstance;

  $scope.dblClickRow = function(obj){
    $rootScope.$broadcast('SOME_TAG', 'your value'); //doesn't work 
    $location.path('/edit/' + obj.id);
  }

  var openModal = function(obj){
    var cloneObj = _.clone(obj);
    var childScope = $scope.$new();
    childScope.formObj = cloneObj;
    childScope.headers = $scope.headers[0]; //pass the root headers
    childScope.modalInstance = $modal.open({
      //templateUrl : 'editModal',
      templateUrl : 'views/edit-form.html',
      controller : 'FormCtrl',
      size : 'lg',        
      scope : childScope,
    });
  };

  /*
  $scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
    event.preventDefault();
  });
  */
}]).
controller('FormCtrl', ['$scope','$routeParams','$location','DataTable', function($scope,$routeParams,$location,DataTable){

  if(!DataTable.isInit){
    $location.path('/data');
    return;
  } 

  $scope.mapOfData = DataTable.mapOfData;

  var id = $routeParams.id;
  $scope.formObj = DataTable.currData()[id];
  $scope.headers = DataTable.currHeaders();  

  $scope.$on('SOME_TAG', function(response) {
    console.log(response);
  });

  $scope.clone = function(){          
    var formObj = $scope.formObj;
    DataTable.add(formObj);
    $scope.modalInstance.close();  
  };

  $scope.update = function(){          
    var formObj = $scope.formObj;
    DataTable.update(formObj);
    $scope.modalInstance.close();
  };

  $scope.delete = function(){ 
    //remove(formObj);
    //soft delete
    var formObj = $scope.formObj;
    formObj['$ops'] = 'delete';
    DataTable.update(formObj);
    $scope.modalInstance.close();
  };

  $scope.clear = function(){      
    $scope.formObj = {};
  };

}]).
filter('cleanCol',function(){
  return function(input){    
    //var table = extractTableName(input);
    //var r =  table == null ? input : table;
    //return r.toUnderscore();
    return input;
  }
}).
filter('custom',function(){ 
  return function(a,b,fn){
    //console.log('a=' + _(a).prettyPrint() +',b=' + b +',fn=' + fn);
    return fn(a);
  }
}).
config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/data', {
    templateUrl: 'views/data-table.html',
    controller : 'DataTableCtrl',
  })
  .when('/edit/:id', {
    templateUrl: 'views/edit-form.html',
    controller : 'FormCtrl',
  })  
  .when('/test', {
    templateUrl: 'views/test.html',
    controller : 'TestCtrl',
  })
  .otherwise({redirectTo: '/data'});
}]);
