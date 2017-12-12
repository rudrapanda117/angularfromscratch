/* jshint globalstrict: true */
"use strict";
function Scope() {
   

    this.$$watchers = [];
}

Scope.prototype.$watch = function (watchFn, listnerFn) {
    var watcher = {
        watchFn:watchFn,
        listnerFn:listnerFn
    };

    this.$$watchers.push(watcher);
};

Scope.prototype.$digest = function(){
    _.forEach(this.$$watchers,function(watcher){
        watcher.listnerFn();
    })
};