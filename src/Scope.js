/* jshint globalstrict: true */
"use strict";
function Scope() {
   

    this.$$watchers = [];
}

Scope.prototype.$watch = function (watchFn, listenerFn) {
    var watcher = {
        watchFn:watchFn,
        listenerFn:listenerFn || function() { },
        last:initWatchVal // This is done for first unique value
    };

    this.$$watchers.push(watcher);
};

Scope.prototype.$digest = function(){

    var self =  this;
    var newValue, oldValue;
    _.forEach(this.$$watchers,function(watcher){
        console.log('newValue',newValue);
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;
        if(newValue !== oldValue){
            watcher.last = newValue;
            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
        }
        
    });
};


function initWatchVal(){}