'use strict';

/* jasmine specs for controllers go here */
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
    //httpBackend.expectGET(/.*/).
    httpBackend.expectGET('sample/dynamic_table_2.json').respond([
      {
          "id": 1,
          "name": "dname1",
          "static_table_1_id": 2
      },
      {
          "id": 2,
          "name": "dname2",
          "static_table_1_id": 1
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
    httpBackend.flush();      
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
      }
    ]);

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
});
