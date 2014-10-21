'use strict';


// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'ngResource',
  'ngSanitize',
  'ui.bootstrap',
  'ui.select',
]).
config(function(uiSelectConfig) {
  uiSelectConfig.theme = 'select2';
}).
factory('RecursionHelper', ['$compile', function($compile){
  return {
    /**
    * Manually compiles the element, fixing the recursion loop.
    * @param element
    * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
    * @returns An object containing the linking functions.
    */
    compile: function(element, link){
      // Normalize the link parameter
      if(angular.isFunction(link)){
        link = { post: link };
      }

      // Break the recursion loop by removing the contents
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
          /**
           * Compiles and re-adds the contents
           */
          post: function(scope, element){
            // Compile the contents
            if(!compiledContents){
              compiledContents = $compile(contents);
            }
            // Re-add the compiled contents to the element
            compiledContents(scope, function(clone){
              element.append(clone);
            });

            // Call the post-linking function, if any
            if(link && link.post){
              link.post.apply(null, arguments);
            }
          }
      };
    }
  };
}]).
factory('Util',function() {
  return {
    toNormalCase: function(text){ //text is underscore case i.e text_test_1
      var s = text.split('_');
      var r = '';
      for(var i=0; i < s.length; i++){
        var t = s[i];
        r += t.charAt(0).toUpperCase() + t.slice(1) + ' ';
      }
      return r;
    },
  }
}).
factory('DataFactory',['$resource', function($resource) {
  var p = $resource('sample/:table.json',{},{
    query: {method:'GET',params:{table:'table'},isArray:true},
  });
  return p;
}]).
factory('DataTable',['DataFactory','$q', function(DataFactory,$q) {

  //var tables = ['dynamic_table_2','static_table_1','table_3'];
  var tables = ['address','black_list','branch_info','contact_type','contact_info','country','custom_label','gender',
  'internal_classification','license_class','make','marital_status','model','nationality','propell',
  'purchase_type','race','security_info','security_group','stock_master','vehicle_info','vehicle_type',
  'visa_status'];
  var dTable = new DTable();

  var promises = [];
  _.each(tables,function(table){
    var data = DataFactory.query({table:table});
    promises.push(data.$promise.then(function(data){
      dTable.addData(table,data);
    }));          
  });

  return {
    getPromise: function(){
      var promise = $q.all(promises).then(function(){
        return dTable;
      });        
      return promise;
    },
    getDataTable: function(){
      return dTable;
    }, 
  };

  /*
  DTable.prototype.initData = function(tables,callbackFn){
    //dTable.currTable = val;

    var promises = [];
    _.each(tables,function(table){
      var data = DataFactory.query({table:table});
      promises.push(data.$promise.then(function(data){
        dTable.addData(table,refData);
      }));          
    });

    $q.all(promises).then(function(){
      if(_.isFunction(callbackFn))
        callbackFn();
    });    
    
    var data = DataFactory.query({table:val});
    data.$promise.then(function(data){
      //Get Data
      dTable.addData(val,data);

      //wait for combined promises
      var promises = [];
      //Get Headers & all necessary static data

      var tables = dTable.getRefTables();
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
        if(_.isFunction(callbackFn))
          callbackFn();
      });
    });
  };
  */ 


  //return dTable;
}]).
controller('LoginCtrl', ['$scope','$location',function($scope,$location){
  $scope.login = function(){
    $location.path('/data').replace();
  };
    
}]).
controller('DataTableCtrl', ['$scope','DataTable','$modal','$location','$routeParams','Util',
  function($scope,DataTable,$modal,$location,$routeParams,Util){  

  $scope.table = $routeParams.table || DataTable.getTableNames()[0];
  $scope.DataTable = DataTable;
  refresh();

  //watching changes in $scope.currentTable in js
  $scope.$watch('table',function(newVal,oldVal){

    if(newVal == undefined) return;    
    //DataTable.setCurrent(newVal);
    refresh();    
  });  

  $scope.translate = function (edge,rowObj){
    if(edge.obj.hide) return '...';
    return DataTable.getRefValue(edge,rowObj)
  };

  $scope.rowClass = function(row){
    if(row.$ops == 'delete')
      return 'strike';
    return '';
  };

  $scope.getDisplay = Util.toNormalCase;

  //for some reason, it returns all data even in filter we pass in "v" (in data).
  $scope.filterRef = function(data,query){
    //var query = $scope.query;
    var retArray;

    //filtering
    if(!query){
      retArray = _.toArray(data);
    }
    else{
      retArray = [];

      var edges =  DataTable.getEdgeHeaders($scope.table);

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
      var edge = DataTable.getHeaderTree($scope.table).find(orderBy);
      retArray = retArray.sort(function(a,b){
        var refA = DataTable.getRefValue(edge,a);
        var refB = DataTable.getRefValue(edge,b);
        return refA > refB;
      });
    }
    
    return retArray;
  };

  $scope.hide = function(id,enable){
    DataTable.hideHeader(id,enable,$scope.table);
    refresh();    
  };

  $scope.sort = function(colName){
    $scope.orderProp = colName;
  };

  function refresh(){
    $scope.headers = DataTable.getMultiLevelHeaders($scope.table);
    $scope.data = DataTable.getData($scope.table);
    $scope.edges = DataTable.getEdgeHeaders($scope.table)

  };

  $scope.dblClickRow = function(obj){
    $location.path('/edit/' + $scope.table + '/' + obj.id);
  }

  /*
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
  */
}]).
controller('FormCtrl',['$scope','$routeParams','$location','DataTable', function($scope,$routeParams,$location,DataTable) {
  var id = $routeParams.id;
   var dTable = DataTable; // for recursiveUpdate
  $scope.table = $routeParams.table; //get it from URL for easy debugging
  $scope.id = id;

  $scope.clone = function(){
    recursiveAdd($scope.obj,$scope.table);
    goToTable();
  };

  $scope.update = function(){          
    recursiveAdd($scope.obj,$scope.table,true);
    goToTable();
  };

  $scope.delete = function(){ 
    //soft delete
    var obj = $scope.obj;
    obj['$ops'] = 'delete';
    DataTable.update(obj,$scope.table);
    goToTable();
  };

  $scope.cancel = function(){      
    goToTable();
  };

  $scope.clear = function(){      
    $scope.obj = {};
  };

  function goToTable(){
    $location.path('/data/' + $scope.table);
  }



  //the diff b/w clone and update is only the 1st main call, we need to diff
  //else it's recursive add all the way as we will never recursive update.
  function recursiveAdd(obj,table,isUpdate){
    var headers = dTable.getHeader(table);
    _.each(headers, function(h){
      // from the edit form somehow a 2nd level new object attribute is undefined... vs null.. strange.
      if(h.isRefId() && (_.isNull(obj[h.id])||_.isUndefined(obj[h.id])) ){
        var child = obj['$'+h.id]; //should have something
        child = recursiveAdd(child,h.ref);
        obj[h.id] = child.id;
        obj['$'+h.id] = undefined; //erase
      }
    });

    if(isUpdate){
      DataTable.update(obj,table);
    }
    else{
      var id = DataTable.add(obj,table);
      return id;
    }
  }
}]).
directive('dynamicEditForm',['RecursionHelper','DataTable', function(RecursionHelper,DataTable) {
  //directive fn are run once ?
  function link(scope, element, attrs, dynamicMainForm) {    
    var dTable = DataTable.getDataTable();  // needed due to promise nature of the call.
    scope.mapOfData = dTable.mapOfData; //need to display values in form's select (link to foreign tables)
    scope.headers = dTable.getHeader(scope.table); //form will loop this to show all fields    

    //If id is given, this directive will get the obj from the cache
    //If not, it will create a new obj and stick it to the parent with attr    
    var id = scope.id;
    if(_.isNull(id)||_.isUndefined(id)){
      scope.obj = {};
      var attr = scope.attr;
      scope.parent['$'+attr] = scope.obj;
    }
    else{
      var tableData = dTable.getData(scope.table); 
      scope.obj =  _.clone(tableData[scope.id]); 
      scope.target = scope.obj;
    }
  }

  return {
    restrict: 'E',
    scope: {
      //require: '^dynamicMainForm',
      id: '=', // numeric id
      table: '=', // to show  which table
      parent: '=', //for linking back to obj
      attr: '=', // for linking back to obj's attr
      target: '=target', //this is for linking the main form obj to the directive scope of the top obj.
    },
    templateUrl: 'views/edit-form-inner.html',
    compile: function(element) {
      // Use the compile function from the RecursionHelper,
      // And return the linking function(s) which it returns
      return RecursionHelper.compile(element,link);
    },
    controller: function($scope){
      $scope.checkNull = function(obj){
        return _.isNull(obj) || _.isUndefined(obj);
      };

      $scope.getDisplay = function(obj){
        if(_.has(obj,'name')) return obj.name;
        if(_.has(obj,'value')) return obj.value;
        var omit = _.omit(obj,function(v,k){
          return k === 'id' || _.isFunction(v);
        });
        return _.values(omit).join(' ');
      };

      $scope.toArray = function(obj){ //for select2 conversion
        return _.values(obj);
      };

      $scope.selectFilter = function(array,search){
        var r = _.reduce(array,function(memo,obj){
          var v = _.find(obj,function(v){
            return _.isString(v) && v.indexOf(search) != -1;
          });
          if(!_.isUndefined(v)){
            memo.push(obj);
          }
          return memo;
        },[]);

        //r.push({id:-1, name:'< Create New >'});

        return r;
      };

    },
    //link: link, //doesn't work now that we override compile
  }
}]).
filter('cleanCol',['Util',function(Util){
  return Util.toNormalCase;
}]).
filter('custom',function(){ 
  return function(){
    var array = arguments[0];
    var value = arguments[1];
    var fn = arguments[2];
    return fn(array,value);
  }
}).
config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/data/:table?', {
    templateUrl: 'views/data-table.html',
    controller : 'DataTableCtrl',
    resolve : {
      DataTable : function(DataTable){
        return DataTable.getPromise();
      },
    },
  })
  .when('/edit/:table/:id', {
    templateUrl: 'views/edit-form.html',
    controller : 'FormCtrl',
    resolve : {
      DataTable : function(DataTable){
        return DataTable.getPromise();
      },
    },
  })  
  .when('/test', {
    templateUrl: 'views/test.html',
    controller : 'TestCtrl',
  })
  .when('/login', {
    templateUrl: 'views/kcaroo-login.html',
    controller : 'LoginCtrl',
  })
  .otherwise({redirectTo: '/login'});
}]);
