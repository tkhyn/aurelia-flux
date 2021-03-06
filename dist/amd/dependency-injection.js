define(['exports', 'aurelia-dependency-injection', './instance-dispatcher', './metadata', './symbols'], function (exports, _aureliaDependencyInjection, _instanceDispatcher, _metadata, _symbols) {
    'use strict';

    exports.__esModule = true;
    exports.handlerCreationCb = handlerCreationCb;

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

    var DispatcherResolver = (function () {
        function DispatcherResolver() {
            _classCallCheck(this, _DispatcherResolver);
        }

        DispatcherResolver.prototype.get = function get(container) {
            var newDispatcher = new _instanceDispatcher.Dispatcher();
            try {
                container._dispatchers.push(newDispatcher);
            } catch (e) {
                container._dispatchers = [newDispatcher];
            }
            return newDispatcher;
        };

        var _DispatcherResolver = DispatcherResolver;
        DispatcherResolver = _aureliaDependencyInjection.resolver(DispatcherResolver) || DispatcherResolver;
        return DispatcherResolver;
    })();

    exports.DispatcherResolver = DispatcherResolver;

    function handlerCreationCb(handler) {
        var index = handler.dependencies.indexOf(_instanceDispatcher.Dispatcher),
            invoke = handler.invoke;

        if (index === -1) {

            handler.invoke = function (container, dynamicDependencies) {
                var instance = invoke.call(this, container, dynamicDependencies);

                if (_metadata.Metadata.exists(Object.getPrototypeOf(instance))) {
                    new _instanceDispatcher.Dispatcher().connect(instance);
                }

                return instance;
            };
        } else {

            handler.dependencies[index] = new DispatcherResolver();

            handler.invoke = function (container, dynamicDependencies) {

                var instance = invoke.call(this, container, dynamicDependencies);

                var dispatcher = container._dispatchers.pop();
                if (_metadata.Metadata.exists(Object.getPrototypeOf(instance))) {
                    dispatcher.connect(instance);
                }

                return instance;
            };
        }

        return handler;
    }
});