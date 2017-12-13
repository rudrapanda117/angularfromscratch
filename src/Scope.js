/* jshint globalstrict: true */
"use strict";

function Scope() {
    this.$$watchers = [];
    /** track last dirty watch */
    this.$$lastDirtyWatch = null;
}



Scope.prototype.$watch = function (watchFn, listenerFn) {
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function () {},
        last: initWatchVal // This is done for first unique value
    };

    this.$$watchers.push(watcher);
    /** This is for corner case in which a watch fn is register inside another listnerFn.
     * We are resetting lastDirtyWatch check so that the digest runs for last registed watch also.
     */
    this.$$lastDirtyWatch = null;
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
            /** track last dirty watch */
            self.$$lastDirtyWatch = watcher;
            watcher.last = newValue;
            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
            dirty = true;
            /** track last dirty watch */
        } else if (self.$$lastDirtyWatch === watcher) {
            return false;
        }

    });
    return dirty;
};

// Now the digest function iterates till the digest cycle is dirty
Scope.prototype.$digest = function () {
    //Counter to track digest cycle
    var ttl = 10;
    var dirty;
    /** track last dirty watch */
    this.$$lastDirtyWatch = null;
    do {
        dirty = this.$$digestOnce();
        if (dirty && !(ttl--)) {
            throw new Error("10 digest iterations reached");
        }
    } while (dirty);
};


function initWatchVal() {}