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

String.prototype.contains = function(text){
  return this.indexOf(text) != -1;
};

String.prototype.extracts = function(textArray){
  for(var i in textArray){
    if(this.contains(textArray[i])) return textArray[i];
  }
  return undefined;
};


function DTable (){
    /** Column standards “Using Convention Over Config"
      ===================================================
      id                  : each table will have one as primary key
      <ref table>_refid      : map to another table
      <named>-<ref table>_refid : 'named' ref table. this maps to a ref table but table header will show '<Colname> <ref table>'s col> on column header
      *_[date,email,month,num,time,url,week,bool] : show the respective angular widget
      Everything else will show a typeahead input type='text'
    **/
    // ref tablename vs map value i.e {'static_table_1':{ id:{col1:value1, col2:value2, ...}, ... }...}
    this.mapOfData= {}; 
    // ref tablename vs header data i.e {'static_table_1':[{name:col1, hide:false, ...}, {name:col2, hide:false, ...} ...]...}
    /** Headers will contain the following info
      id :  this will be the db col name to map back to the data key
      hide : true -> hidden
      sort : nil -> not sorted , true -> asc, false -> desc
      type : extracted from the <colname>-[date,email,month,num,time,url,week,bool,refid]
      ref : if != null, this header is a ref table id
      ref_col : if has ref, this will be ref table's col to be display
      named : text to show as 'named' ref

      The order of the header obj will determine the display col order.
    */
    this.mapOfHeaders = {};  

    // easier to call current data
    this.currTable;

}

DTable.prototype.getRefData = function(header,value){
  var refMap = this.getData(header.ref);
  if(refMap == null) return value;
  var refValue = refMap[value];
  return refValue == null ? value : refValue[header.ref_col];
}

DTable.prototype.hasTable = function(table){
  return this.mapOfData[table] != null;
}

DTable.prototype.addData = function(table,dataArray){

  if(this.hasTable(table)) return;

  var refMap = {};
  for(var i = 0; i < dataArray.length; i++) {
    var refId = dataArray[i].id;
    refMap[refId] = dataArray[i];
  };            
  this.mapOfData[table] = refMap;
  this.createHeaders(table,dataArray[0]);
}


/*** Tricky!
  1. Get data for table 1 (which has ref to table 2)
  2. Put data in cache map & extract headers (+info). At this pt, we don't know table2 col details yet.
  3. With headers info, get data for table 2 (with ref to table 3). Now we have table2 col details.. don't get table 3
  4. Continue from to 2 to create new table 1 headers with table 2 details.
*/
DTable.types = ['date','email','month','num','time','url','week','bool','refid'];

DTable.prototype.createHeaders = function(table,dataObj){
  var headers = [];
  for(var id in dataObj){ //loop keys
    if(!dataObj.hasOwnProperty(id)) continue;
    var type = id.extracts(DTable.types);
    var ref,named;
    if(type == 'refid'){ // create additional cols
      var i = id.indexOf('-');
      var j = id.lastIndexOf('_');
      // either named as 'named' table or take ref table name
      named = i != -1 ? id.substring(0,i) : id.substring(0,j);
      ref = i != -1 ? id.substring(i + 1,j) : named;
    }
    else{
      named = id;
    }
    headers.push({
      id:id, 
      hide:false,
      type:type,
      named:named,
      ref:ref,
    });
  }

  this.mapOfHeaders[table] = headers;
}

DTable.prototype.expandHeaders = function(table){
  var headers = this.mapOfHeaders[table];
  for(var i in headers){
    var newHeaders = [];
    if(headers[i].ref != undefined && headers[i].ref_col == undefined){
      var refTable = headers[i].ref;
      var refHeaders = this.mapOfHeaders[refTable];
      for(var j in refHeaders){
        if(refHeaders[j].id == 'id') continue;
        newHeaders.push({
          id:headers[i].id,  //curr table id
          hide:headers[i].hide,
          type:'refid',
          named:headers[i].named + '.' + refHeaders[j].id,
          ref:refTable,
          ref_col:refHeaders[j].id,
        });        
      }
      if(newHeaders.length != 0){ // splice and insert array
        headers.splice.apply(headers, [i,1].concat(newHeaders));
      }
    }
  }
}

DTable.prototype.currRefTables = function(){
  var r = [];
  var headers = this.currHeaders();
  for(var i in headers){
    if(headers[i].id.contains('refid') &&  headers[i].ref != undefined){
      r.push(headers[i].ref);
    }
  }
  return r;
}

DTable.prototype.getLastId = function (){
  var id = 0;

  var data = this.currData()
  for(var i in data){
    var c = data[i]['id'];
    if(c > id) id = c;
  }      
  return id;
}

DTable.prototype.rowContains = function (rowObj,text){
  var headers = this.currHeaders();
  for(var i in headers){ //Loop array
    var h = headers[i]; 
    if(!h.hide) continue;
    var value = rowObj[h.id];              
    var refData = dTable.getRefData(h,value);
    if(refData.contains(text)) return true;    
  }       
  return false;
}

/*
DTable.prototype.getDisplayData = function(data) {
  var displayData = {};

  var headers = this.currHeaders();
  for(var j in headers){ //Loop array
    var h = headers[j]; 
    var value = data[h.name];              
    var refValue = getRefValue(value,h.name);
    displayData[h.name] = refValue;
  }       
  return displayData
}    


*/


DTable.prototype.getData = function(table){
    return this.mapOfData[table];
}

DTable.prototype.getHeader = function(table){
    return this.mapOfHeaders[table];
}

DTable.prototype.currData = function(){
    return this.getData(this.currTable);
}

DTable.prototype.currHeaders = function(){
    return this.getHeader(this.currTable);
}

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
          dTable.expandHeaders(newVal);
          $scope.dTable = dTable;
        });
      });      
    });  

    $scope.getRefValue = function (value,header){
      return dTable.getRefData(header,value)
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

    $scope.hide = function(colName){
      var headers = currentHeader();
      for(var i in headers){
        if(headers[i].name == colName){
          headers[i].hide = true;
          return;
        }
      }
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
    //var table = extractTableName(input);
    //var r =  table == null ? input : table;
    //return r.toUnderscore();
    return input;
  }
}).
filter('convert',function(){
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
