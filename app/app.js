'use strict';


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

Function.prototype.copy = function(obj){
  for(var k in obj){
    if(obj.dataObj.hasOwnProperty(k)){
      this.k = obj.k;
    }
  }
};

DHeader.types = ['date','email','month','num','time','url','week','bool','refid'];


function DHeader (id){
  /** 
    The order of the header obj will determine the display col order.
  */
  //id :  this will be the db col name to map back to the data key
  this.id = id;

  // if true -> hidden
  this.hide = false;

  //sort : null -> not sorted , true -> asc, false -> desc
  this.sort = undefined;

  //type : extracted from the <colname>-[date,email,month,num,time,url,week,bool,refid]
  this.type = id.extracts(DHeader.types);

  //if != null, this header is a ref table id
  this.ref = undefined;

  //if has ref, this will be ref table's col to be display
  //this.ref_col = undefined;

  //text to show as 'named' ref
  this.named = undefined;

  this.dheader = undefined;
  
  if(this.type == 'refid'){ // create additional cols
    var i = id.indexOf('-');
    var j = id.lastIndexOf('_');
    this.hide = true;
    // either named as 'named' table or take ref table name
    this.named = i != -1 ? id.substring(0,i) : id.substring(0,j);
    this.ref = i != -1 ? id.substring(i + 1,j) : this.named;
  }
  else{
    this.named = id;
  }
};

DHeader.prototype = {

  isRefId : function(){
    return this.type == 'refid';
  },

  getDisplay : function(){
    //return this.hide ? '...' : this.named;
    return this.named;
  },

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
    // ref tablename vs map value i.e {'static_table_1':{ id:{DHeader1:value1, DHeader2:value2, ...}, ... }...}
    this.mapOfData= {}; 

    // ref tablename vs header data i.e {'static_table_1':[DHeader1, DHeader2, ...} ...]...}
    this.mapOfHeaders = {};  

    // ref tablename vs map of header id vs DHeader
    this.mapOfColHeaderMap = {};

    // easier to call current table data
    this.currTable;

}

DTable.prototype = {
  translate : function(header,value){
    if(header.hide) return '';
    if(header.isRefId()){

      var refMap = this.getData(header.ref);
      if(refMap == null) return value;  
      return refMap[value];
      //var refValue = refMap[value];
      //return refValue == null ? value : refValue[header.ref_col];
    }

    return value;
  },

  hasTable : function(table){
    return this.mapOfData[table] != null;
  },

  addData : function(table,dataArray){
    if(this.hasTable(table)) return;
    this.createHeaders(table,dataArray[0]);

    var refMap = {}; // row id vs dataObj
    for(var i = 0; i < dataArray.length; i++) { //loop each row
      var data = dataArray[i]
      refMap[data.id] = data;
    };            
    this.mapOfData[table] = refMap;  
  },

  /*** Tricky!
    1. Get data for table 1 (which has ref to table 2)
    2. Put data in cache map & extract headers (+info). At this pt, we don't know table2 col details yet.
    3. With headers info, get data for table 2 (with ref to table 3). Now we have table2 col details.. don't get table 3
    4. Continue from to 2 to create new table 1 headers with table 2 details.
  */

  createHeaders : function(table,dataObj){

    var colHeaderMap = {};
    var headers = [];
    for(var id in dataObj){ //loop keys
      if(!dataObj.hasOwnProperty(id)) continue; //skip all funny $
      var dheader = new DHeader(id);
      headers.push(dheader);
      colHeaderMap[id] = dheader;
    }
    this.mapOfHeaders[table] = headers;
    this.mapOfColHeaderMap[table] = colHeaderMap

    return colHeaderMap;
  },

  linkHeaders : function(table){    /*
    var headers = this.mapOfHeaders[table];
    for(var i in headers){ 
      var newHeaders = [];
      var header =  headers[i];
      if(header.ref == undefined || header.ref_col != undefined) continue; //skip if processed.
      var refTable = headers[i].ref;
      var refHeaders = this.mapOfColHeaderMap[refTable]; //return DHeader
      for(var j in refHeaders){ //looping all ref table headers
        var refDheader = refHeaders[j];
        if(refDheader.id == 'id') continue;
        var dheader = new DHeader(headers[i].id);//curr current col id
        dheader.copy({
          hide:header.hide,
          type:'refid',
          named:header.named + '.' + refDheader.id,
          ref:refTable,
          ref_col: refDheader.id,
          dheader: refDheader, //Pointer to ref table col
        });
        newHeaders.push(dheader);        
      }
      if(newHeaders.length != 0){ // splice and insert array
        headers.splice.apply(headers, [i,1].concat(newHeaders));
      }    
    }*/
  },

  currRefTables : function(){
    var r = [];
    var headers = this.currHeaders();
    for(var i in headers){
      if(headers[i].id.contains('refid') &&  headers[i].ref != undefined){
        r.push(headers[i].ref);
      }
    }
    return r;
  },

  getLastId : function (){
    var id = 0;

    var data = this.currData()
    for(var i in data){
      var c = data[i]['id'];
      if(c > id) id = c;
    }      
    return id;
  },

  rowContains : function (rowObj,text){
    var headers = this.currHeaders();
    for(var i in headers){ //Loop array
      var h = headers[i]; 
      if(!h.hide) continue;
      var value = rowObj[h.id];              
      var refData = dTable.getRefData(h,value);
      if(refData.contains(text)) return true;    
    }       
    return false;
  },

  getData : function(table){
    return this.mapOfData[table];
  },

  getHeader : function(table){
    return this.mapOfHeaders[table];
  },

  currData : function(){
    return this.getData(this.currTable);
  },

  currHeaders : function(){
    var headers = this.getHeader(this.currTable);
    
    var expandedHeaders = [];

    for(var i in headers){
      var h = headers[i];

      expandedHeaders.push(h);
      if(h.isRefId() && !h.hide){ // expand it

      }
    }


    return expandedHeaders;
  },

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
          dTable.linkHeaders(newVal);
          $scope.dTable = dTable;
          //$scope.currentTable = 'dynamic_table_2'; //$scope.tables[0];
          //$scope.$digest();
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
