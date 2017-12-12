/* jshint globalstrict: true */
/* global Scope: false */

'use strict'

describe("Scope", function(){

    it("can be constructed and use as object",function(){
        var scope =  new Scope();
        scope.aProperty = 1;

        expect(scope.aProperty).toBe(1);
    });

    describe("digest",function(){
        var scope;

        beforeEach(function(){
            scope = new Scope();
        });

        it("call the listener function of a watch on first $digest",function(){
            var watchFn = function(){ return 'wat';}
            var listnerFn = jasmine.createSpy();

            scope.$watch(watchFn,listnerFn);

            scope.$digest();

            expect(listnerFn).toHaveBeenCalled();
        });
    });
});
