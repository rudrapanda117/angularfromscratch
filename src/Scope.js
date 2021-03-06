/* jshint globalstrict: true */
"use strict";

function Scope() {
    this.$$watchers = [];
    /** track last dirty watch */
    this.$$lastDirtyWatch = null;
    this.$$asyncQueue = [];
    this.$$phase = null;
    this.$$applyAsyncQueue = [];
    this.$$applyAsyncId = null;
}



Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function () {},
        valueEq: !!valueEq,
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
        // if (newValue !== oldValue) {
        if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
            /** track last dirty watch */
            self.$$lastDirtyWatch = watcher;
            //watcher.last = newValue;
            watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
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

    this.$beginPhase("$digest");

    if (this.$$applyAsyncId) {
        clearTimeout(this.$$applyAsyncId);
        this.$$flushApplyAsync();
    }

    do {
        while (this.$$asyncQueue.length) {
            var asyncTask = this.$$asyncQueue.shift();
            asyncTask.scope.$eval(asyncTask.expression);
        }

        dirty = this.$$digestOnce();
        if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
            this.$clearPhase();
            throw new Error("10 digest iterations reached");
        }
    } while (dirty || this.$$asyncQueue.length);
    this.$clearPhase();
};

Scope.prototype.$$areEqual = function (newValue, oldValue, valueEq) {
    if (valueEq) {
        return _.isEqual(newValue, oldValue);
    } else {
        return newValue === oldValue || (typeof newValue === 'number' && typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue));
    }
};

Scope.prototype.$eval = function (expr, locals) {
    return expr(this, locals);
};

Scope.prototype.$apply = function (expr) {
    try {
        this.$beginPhase("$apply");
        return this.$eval(expr);
    } finally {
        this.$clearPhase();
        this.$digest();
    }
};

Scope.prototype.$evalAsync = function (expr) {
    var self = this;
    if (!self.$$phase && !self.$$asyncQueue.length) {
        setTimeout(function () {
            if (self.$$asyncQueue.length) {
                self.$digest();
            }
        }, 0);
    }

    this.$$asyncQueue.push({
        scope: this,
        expression: expr
    });
};

Scope.prototype.$beginPhase = function (phase) {
    if (this.$$phase) {
        throw this.$$phase + 'already in progress.';
    }

    this.$$phase = phase;
};

Scope.prototype.$clearPhase = function () {
    this.$$phase = null;
};

Scope.prototype.$applyAsync = function (expr) {
    var self = this;
    self.$$applyAsyncQueue.push(function () {
        self.$eval(expr);
    });
    if (self.$$applyAsyncId === null) {
        self.$$applyAsyncId = setTimeout(function () {
            self.$apply(_.bind(self.$$flushApplyAsync, self));
        }, 0);
    }

};

Scope.prototype.$$flushApplyAsync = function () {
    while (this.$$applyAsyncQueue.length) {
        this.$$applyAsyncQueue.shift()();
    }
    this.$$applyAsyncId = null;
};

function initWatchVal() {}