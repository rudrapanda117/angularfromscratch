/* jshint globalstrict: true */
"use strict";

function Scope() {


    this.$$watchers = [];
}



Scope.prototype.$watch = function (watchFn, listenerFn) {
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function () {},
        last: initWatchVal // This is done for first unique value
    };

    this.$$watchers.push(watcher);
};


/** runs all the watchers once, and returns a boolean value that determines whether there
 * were any changes or not
 */
Scope.prototype.$$digestOnce = function () {

    var self = this;
    // tracking dirty status
    var newValue, oldValue, dirty;
    _.forEach(this.$$watchers, function (watcher) {

        newValue = watcher.watchFn(self);
        oldValue = watcher.last;
        if (newValue !== oldValue) {
            watcher.last = newValue;
            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
            dirty = true;
        }

    });
    return dirty;
};

// Now the digest function iterates till the digest cycle is dirty
Scope.prototype.$digest = function () {
    //Counter to track digest cycle
    var ttl = 10;
    var dirty;
    do {
        dirty = this.$$digestOnce();
        if (dirty && !(ttl--)) {
            throw new Error("10 digest iterations reached");
        }
    } while (dirty);
};


function initWatchVal() {}