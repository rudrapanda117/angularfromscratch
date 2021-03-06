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


            /**  dependencies between watches do not rely on their registration order */


            /** watcher 2 
             * It depends on watcher1 for setting the value for watcher1.
             * we need to do is to modify the digest so that it keeps iterating over all watches until
             * the watched values stop changing. Doing multiple passes is the only way we can get changes
             * applied for watchers that rely on other watchers
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

        it("gives up on the watchers after 10 iterations", function () {
            scope.counterA = 0;
            scope.counterB = 0;

            /** Here watchers are changing the values of other watcher on which they are watching */

            scope.$watch(
                function (scope) {
                    return scope.counterA;
                },
                function (newValue, oldValue, scope) {
                    scope.counterB++;
                }
            );

            scope.$watch(
                function (scope) {
                    return scope.counterB;
                },
                function (newValue, oldValue, scope) {
                    scope.counterA++;
                }
            );

            expect((function () {
                scope.$digest();
            })).toThrow(new Error("10 digest iterations reached"));
        });

        it("ends the digest when the last watch is clean", function () {

            // Create a array with 100 elements .
            scope.array = _.range(100);

            var watchExecutions = 0;

            _.times(100, function (i) {
                scope.$watch(
                    function (scope) {
                        watchExecutions++;
                        return scope.array[i];
                    },
                    function (newValue, oldValue, scope) {

                    }
                );
            });

            scope.$digest();
            expect(watchExecutions).toBe(200);

            watchExecutions = 0;

            scope.$digest();
            expect(watchExecutions).toBe(100);

            watchExecutions = 0;

            scope.array[0] = 117;
            scope.$digest();
            expect(watchExecutions).toBe(101);

            watchExecutions = 0;

            scope.array[49] = 117;
            scope.$digest();
            expect(watchExecutions).toBe(150);

            watchExecutions = 0;

            scope.array[99] = 117;
            scope.$digest();
            expect(watchExecutions).toBe(200);


        });

        it("does not end digest so that new watches are not run", function () {

            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.$watch(
                        function (scope) {
                            return scope.aValue;
                        },
                        function (newValue, oldValue, scope) {
                            scope.counter++;
                        }
                    );
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("copmares based on value if enabled ", function () {
            scope.aValue = [1, 2, 3];
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.aValue.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it("correctly handles NANs", function () {
            scope.number = 0 / 0; // NaN
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.number;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("executes $eval'ed function and return result", function () {
            scope.aValue = 42;

            var result = scope.$eval(function (scope) {
                return scope.aValue;
            });

            expect(result).toBe(42);
        });

        it("passes the second $eval argument straight through", function () {
            scope.aValue = 42;

            var result = scope.$eval(function (scope, arg) {
                return scope.aValue + arg;
            }, 2);

            expect(result).toBe(44);
        });

        it("executes $apply'ed function and starts the digest", function () {
            scope.aValue = 'someValue';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$apply(function (scope) {
                scope.aValue = 'someOtherValue';
            });

            expect(scope.counter).toBe(2);
        });


        it("executes $evalAsync'ed function later in the same cycle", function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.asyncEvaluatedImmediately = false;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.$evalAsync(function (scope) {
                        scope.asyncEvaluated = true;
                    });
                    scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
                }
            );

            scope.$digest();

            expect(scope.asyncEvaluated).toBe(true);
            expect(scope.asyncEvaluatedImmediately).toBe(false);
        });

        it("executes $evalAsync'ed functions addded by watch functions", function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;

            scope.$watch(
                function (scope) {
                    if (!scope.asyncEvaluated) {
                        scope.$evalAsync(function (scope) {
                            scope.asyncEvaluated = true;
                        })
                    }

                    return scope.value;
                },
                function (newValue, oldValue, scope) {}
            );

            scope.$digest();

            expect(scope.asyncEvaluated).toBe(true);
        });

        it("executes $evalAsync'ed functions even when not dirty", function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluatedTimes = 0;

            scope.$watch(
                function (scope) {
                    if (scope.asyncEvaluatedTimes < 2) {
                        scope.$evalAsync(function (scope) {
                            scope.asyncEvaluatedTimes++
                        });
                    }

                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {}
            );

            scope.$digest();

            expect(scope.asyncEvaluatedTimes).toBe(2);
        });

        it("eventually halts $evalAsyncs added by watches", function () {
            scope.aValue = [1, 2, 3];

            scope.$watch(
                function (scope) {
                    scope.$evalAsync(function (scope) {});
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {}
            );

            expect(function () {
                scope.$digest();
            }).toThrow();
        });


        it("has a $$phase field whose value is the current digest phase", function () {
            scope.aValue = [1, 2, 3];
            scope.phaseInWatchFunction = undefined;
            scope.phaseInListnerFunction = undefined;
            scope.phaseInApplyFunction = undefined;

            scope.$watch(
                function (scope) {
                    scope.phaseInWatchFunction = scope.$$phase;
                },
                function (newValue, oldValue, scope) {
                    scope.phaseInListnerFunction = scope.$$phase;
                }
            );

            scope.$apply(function () {
                scope.phaseInApplyFunction = scope.$$phase;
            })

            expect(scope.phaseInWatchFunction).toBe('$digest');
            expect(scope.phaseInListnerFunction).toBe('$digest');
            expect(scope.phaseInApplyFunction).toBe('$apply');

        });

        it("schedules a digest in $evalAsync", function () {
            scope.aValue = "abc";
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$evalAsync(function (scope) {});

            expect(scope.counter).toBe(0);
            setTimeout(function () {
                expect(scope.counter).toBe(1);
            }, 50);
        });

        xit("allows async $apply with $applyAsync", function (done) {
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$applyAsync(function (scope) {
                scope.aValue = 'abc';
            });

            expect(scope.counter).toBe(1);

            setTimeout(function () {
                expect(scope.counter).toBe(2);
                done();
            }, 50);
        });

        xit("never executes $applyAsync'ed function in the same cycle", function (done) {
            scope.aValue = [1, 2, 3];
            scope.asyncApplied = false;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.$applyAsync(function (scope) {
                        scope.asyncApplied = true;
                    });
                }
            );

            scope.$digest();
            expect(scope.asyncApplied).toBe(true);
            setTimeout(function () {
                expect(scope.asyncApplied).toBe(true);
                done();
            }, 50);
        });

        xit('coalesces many calls to $applyAsync ', function (done) {
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    scope.counter++;
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {}
            );
            scope.$applyAsync(function (scope) {
                scope.aValue = 'abc';
            });
            scope.$applyAsync(function (scope) {
                scope.aValue = 'def';
            });
            setTimeout(function () {
                expect(scope.counter).toBe(2);
                done();
            }, 50);

        });

        xit('cancels and flushes $applyAsync if digested first', function (done) {
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    scope.counter++;
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {}
            );
            scope.$applyAsync(function (scope) {
                scope.aValue = 'abc';
            });
            scope.$applyAsync(function (scope) {
                scope.aValue = 'def';
            });
            scope.$digest();
            expect(scope.counter).toBe(2);
            expect(scope.aValue).toEqual('def');
            setTimeout(function () {
                expect(scope.counter).toBe(2);
                done();
            }, 50);
        });

    });
});