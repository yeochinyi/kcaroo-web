'use strict';

/* jasmine specs for controllers go here */
describe('Test', function() {

  beforeEach(function(){
    this.addMatchers({
      toEqualData: function(expected) {
        return angular.equals(this.actual, expected);
      }
    });
  });

  beforeEach(module('myApp'));

  describe('DataTableCtrl', function(){
    var scope, ctrl, $httpBackend;

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('app/sample/primary1.json').
          respond([{name: 'Nexus S'}, {name: 'Motorola DROID'}]);

      scope = $rootScope.$new();
      ctrl = $controller('DataTableCtrl', {$scope: scope});
    }));


    it('bababababababa', function() {
      expect(scope.data).toEqualData([]);
      $httpBackend.flush();

      expect(scope.data).toEqualData(
          [{name: 'Nexus S'}, {name: 'Motorola DROID'}]);
    });

  });
});