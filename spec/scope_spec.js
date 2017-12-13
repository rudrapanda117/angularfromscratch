/* jshint globalstrict: true */
/* global Scope: false */

'use strict'

describe("Scope", function () {

    it("can be constructed and use as object", function () {
        var scope = new Scope();
        scope.aProperty = 1;

        expect(scope.aProperty).toBe(1);
    });

    describe("digest", function () {
        var scope;

        beforeEach(function () {
            scope = new Scope();
        });

        it("call the listener function of a watch on first $digest", function () {
            var watchFn = function () {
                return 'wat';
            }
            var listenerFn = jasmine.createSpy();

            scope.$watch(watchFn, listenerFn);

            scope.$digest();

            expect(listenerFn).toHaveBeenCalled();
        });

        it("calls the watch function with scope as the argumnent", function () {
            var watchFn = jasmine.createSpy();
            var listenerFn = function () {};

            scope.$watch(watchFn, listenerFn);

            scope.$digest();

            expect(watchFn).toHaveBeenCalledWith(scope);

        });

        it("calls the listner function  when the watched value changes", function () {
            scope.someValue = 'a';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            expect(scope.counter).toBe(0);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.someValue = 'b';
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });


        it("calls listener when watch value is first undefined", function () {
            scope.someValue = 123;
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("may have watchers that omit the listner function", function () {
            var watchFn = jasmine.createSpy().and.returnValue('something');
            scope.$watch(watchFn);
            scope.$digest();

            expect(watchFn).toHaveBeenCalled();
        });

        it("triggers chained watchers in the same digest", function () {
            scope.name = 'Jane';


            /** watchers are registered in out of order .
             * This test fails with error Expected undefined to be 'J.'.
             * 
             * watcher2 watches scope.nameUpper.
             * scope.nampper is populated by watcher1 based on value of scope.name.
             * When watchers are run in out of order the proper value is not set.
             */

            
            /** watcher 2 
             * It depends on watcher1 for setting the value for watcher1
             */
            scope.$watch(
                function (scope) {
                    return scope.nameUpper;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.initial = newValue.substring(0, 1) + '.';
                    }
                }
            );

            /**watcher1 */
            scope.$watch(
                function (scope) {
                    return scope.name;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            );

          

            scope.$digest();
            expect(scope.initial).toBe('J.');

            scope.name = 'Bob';
            scope.$digest();
            expect(scope.initial).toBe('B.');
        });
    });
});