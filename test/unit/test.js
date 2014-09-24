'use strict';


describe('DTable',function(){

  beforeEach(function(){
    this.addMatchers({
      equals: function(expected) {
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
      }
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
    d.expandHeaders('table1');

    expect(d.hasTable('table1')).equals(true);
    
    expect(d.currHeaders()).equals(
      [
        { id : 'id', hide : false, named : 'id', }, 
        { id : 'name', hide : false, named : 'name', }, 
        { id : 'table2_refid', hide : false, type : 'refid', named : 'table2.name', ref : 'table2', rel_col : 'name' }, 
        { id : 'name1-table2_refid', hide : false, type : 'refid', named : 'name1.name', ref : 'table2', rel_col : 'name' }
      ]
    );

  });
});



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
    ]);*/
  });

});
