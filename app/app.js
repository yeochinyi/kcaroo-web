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
controller('DataTableCtrl', ['$scope','DataTable','$modal',function($scope,DataTable,$modal){  

  $scope.tables = ['dynamic_table_2','static_table_1'];
  $scope.currentTable = 'dynamic_table_2';

  function refresh(){
    var cols = DataTable.currHeaderTree().traverseEdges();
    var headers = DataTable.getStrippedTableHeaders();
    var data = DataTable.currData();
    $scope.headers = headers;
    $scope.cols = cols;
    //$scope.data =  _.values(data); //strip out arrays
    $scope.data =  data; //strip out arrays
    $scope.mapOfData = DataTable.mapOfData;
  };

  //watching changes in $scope.currentTable in js
  $scope.$watch('currentTable',function(newVal,oldVal){

    if(newVal == undefined) return;    
    DataTable.initData(newVal,refresh);
  });  

  $scope.translate = function (edge,rowObj){
    return DataTable.translate(edge,rowObj);
  };

  $scope.rowClass = function(row){
    if(row.$ops == 'delete')
      return 'strike';
    return '';
  };

  $scope.filterRef = function(objArray){
    var query = $scope.query;
    var retArray;
    if(!query){
      retArray = objArray;
    }
    else{
      retArray = [];
      _.each(objArray,function(obj){
        if(_.propertyContains(obj,query)){
          retArray.push(obj);
        }        
      });      
    }

    //sorting
    var orderBy = $scope.orderBy;
    if(orderBy){
      var splitted = orderBy.split(".");
      retArray = retArray.sort(function(a,b){
        for(var i=0; i<splitted.length; i++){
          var s = splitted[i];
          if(i !== splitted.length - 1) s +=  '_refid';
          a = a[s];
          b = b[s];
        }
        return a > b;
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

  $scope.openModal = function(obj){
    //var clone = angular.copy(obj);
    var cloneObj = _.clone(obj);

    _.each(cloneObj,function(v,k){ //reduce all refid back to {} as don't want to change obj inside
      if(_.isObject(v)){
        cloneObj[k] = {id:v.id};
      } 
    });

    $scope.formObj = cloneObj;
    $scope.modalInstance = $modal.open({
      //templateUrl : 'editModal',
      templateUrl : 'views/edit-form.html',
      controller : 'FormCtrl',
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
controller('FormCtrl', ['$scope','DataTable', function($scope,DataTable){

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
  .when('/test', {
    templateUrl: 'views/test.html',
    controller : 'TestCtrl',
  })
  .otherwise({redirectTo: '/data'});
}]);
