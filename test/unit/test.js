'use strict';

var skipFn = function(key,obj){ 
  if(key === 'parent')
    return true;
  return false; 
}

/*
describe('t-js',function(){
  it('test traverse', function(){
    var test =  {
       name : 'root',
       child: [ //array
           { name : 'b1' },
           { name : 'b2',
               child: [ //array
                   { name : 'c1', },
                   { name : 'c2', }
               ]
           }
       ]
    };

    var printIt = function(node,par,ctrl){ 
      console.log(node.name); 
      if(node.child != undefined) {
        console.log(' has ' + node.child.length + ' kids!'); 
      };
    };

    var config = { 
      childrenName : 'child',
      order:'post',
    };

    console.log("\nBFS\n---\n")
    t.bfs(test, config, printIt);
    console.log("\nDFS\n---\n")
    t.dfs(test, config ,printIt);
  });
});*/

/*
describe('Tree',function(){
  it('Test Traverse',function(){
    var tree = new Tree();

    tree.addChildren('', [{id:1}]);
    tree.addChildren('', [{id:2},{id:3}]);

    tree.addChildren(2,[{id:21},{id:22}]);
    tree.addChildren(2,{id:23});

    tree.addChildren(1,[{id:11},{id:12},{id:13},]);
    tree.removeAllChildren(2);


    console.log(tree.prettyPrint(0,skipFn));

    var tb = tree.traverseBreadth();
    console.log('Breadth:\n' + tb.prettyPrint(0,skipFn));

    var te = tree.traverseEdges();
    console.log('Edge:\n' + te.prettyPrint(0,skipFn));
  });
});*/


describe('DTable',function(){

  beforeEach(function(){
    this.addMatchers({
      equals: function(expected) {
        this.message = function() {
          return 'Expected ->\n' +  _(expected).prettyPrint() + '\n VS \nActual->\n' + _(this.actual).prettyPrint();
        }
        return angular.equals(this.actual, expected);        
      }
    });
  });  

  it('test ops', function(){
    var d = new DTable();

    d.addData('table1',
    [
      {
        'id': 1,
        'name': 't11',
        'table2_refid': 2,
        'name1-table2_refid': 1,
      },
      {
        'id': 2,
        'name': 't12',
        'table2_refid': 1,
        'name1-table2_refid': 2,
      },

    ]);

    d.addData('table2',
    [
      {
        'id': 1,
        'name': 't21',
      },
      {
        'id': 2,
        'name': 't22',
      }
    ]);    

    d.currTable = 'table1';
    //d.expandHeaders('table1');

    expect(d.hasTable('table1')).equals(true);
    
    //var headers = deleteBlankProp(d.currHeaders());
    var headers = d.currHeaders();

    expect(headers).equals(
      [
        { id : 'id',    named : 'id', }, 
        { id : 'name',  named : 'name', }, 
        { id : 'table2_refid',       type : 'refid', named : 'table2', ref : 'table2' }, 
        { id : 'name1-table2_refid', type : 'refid', named : 'name1', ref : 'table2' },
      ]
    );

    //console.log('headerTree\n----------------\n' + d.currHeaderTree().prettyPrint(0,skipFn));

    d.hideHeader('table2_refid',false);

    //console.log('headerTree\n----------------\n' + d.currHeaderTree().prettyPrint(0,skipFn));

    //console.log('data\n------\n' + d.currData().prettyPrint(0,skipFn));

    d.hideHeader('name1-table2_refid',false);

    //console.log('headerTree\n----------------\n' + d.currHeaderTree().prettyPrint(0,skipFn));

    var data = d.currData();

    //console.log('data\n------\n' + data.prettyPrint(0,skipFn));

    
    var headerOpsTB = d.currHeaderTree().traverseBreadth();
    console.log('headerOpsTB\n----------------\n' + _(headerOpsTB).prettyPrint(0,skipFn));
    
    var headerOpsEdge = d.currHeaderTree().traverseEdges();  
    //console.log('headerOpsEdge\n----------------\n' + headerOpsEdge.prettyPrint(0,skipFn));

    //console.log('d.currHeaderTree\n----------------\n' + d.currHeaderTree().prettyPrint(0,skipFn));

    //console.log(_(data).keys());

    //console.log('headerOpsTB.length =' + headerOpsTB.length);


    var output = [];

    _.each(data,function(v,k){
      if(!_.isFunction(v)){

        var inner = [];
        output.push(inner);
        //console.log('1:' + v.prettyPrint(0,skipFn));
        _.each(headerOpsEdge,function(e){
          //console.log('2 :' + e.prettyPrint(0,skipFn));      
          var text =  d.translate(e,v);             
          //console.log('TEST->' + text);         
          inner.push(text);
        });
      }      
    });

    //console.log(_(output).prettyPrint());

    expect(output).equals([
      [
        1,
        't11',
        1,
        't21',
        1,
        't21',
      ],

      [
        2,
        't12',
        2,
        't22',
        2,
        't22',
      ],
    ]);

  });
});



/*
describe('DataTableCtrl', function() {

  beforeEach(function(){
    this.addMatchers({
      equals: function(expected) {
        return angular.equals(this.actual, expected);
      }
    });
  });

  beforeEach(module('myApp'));
  
  var scope, ctrl, httpBackend;
  
  beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
    httpBackend = _$httpBackend_;      
    httpBackend.expectGET('sample/dynamic_table_2.json').respond([
      {
          "id": 1,
          "name": "dname1",
          "static_table_1_refid": 2
      },
      {
          "id": 2,
          "name": "dname2",
          "static_table_1_refid": 1
      }
    ]);
    
    httpBackend.expectGET('sample/static_table_1.json').respond([
      {
          "id": 1,
          "name": "sname1",
      },
      {
          "id": 2,
          "name": "sname2",
      }
    ]);

    scope = $rootScope.$new();
    ctrl = $controller('DataTableCtrl', {$scope: scope});
    scope.$apply();
  }));

    
  it('clone/update/delete', function() {
    //expect(scope.displayData).equals([]);
    scope.currentTable =  'dynamic_table_2';
    httpBackend.flush();      
    
    /*
    expect(scope.displayData).equals([
      {
          "id": 1,
          "name": "dname1",
          "static_table_1_refid": 2
      },
      {
          "id": 2,
          "name": "dname2",
          "static_table_1_refid": 1
      }
    ]);

    /*
    scope.formObj = {
          "id": 1,
          "name": "dname3",
          "static_table_1_id": 2
      };

    
    scope.clone();
    expect(scope.displayData).equals([
      {
          "id": 1,
          "name": "dname1",
          "static_table_1_id": 2
      },
      {
          "id": 2,
          "name": "dname2",
          "static_table_1_id": 1
      },
      {
          "id": 3,
          "name": "dname3",
          "static_table_1_id": 2
      }
    ]);
    scope.formObj = {
          "id": 1,
          "name": "dname3",
          "static_table_1_id": 2
      };

    scope.update();
    expect(scope.displayData).equals([
      {
          "id": 1,
          "name": "dname3",
          "static_table_1_id": 2
      },
      {
          "id": 2,
          "name": "dname2",
          "static_table_1_id": 1
      },
      {
          "id": 3,
          "name": "dname3",
          "static_table_1_id": 2
      }
    ]);
  });
)};*/
