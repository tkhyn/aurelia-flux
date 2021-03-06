define(['exports', './metadata', './utils', './flux-dispatcher', 'bluebird', './symbols', './lifecycle-manager'], function (exports, _metadata, _utils, _fluxDispatcher, _bluebird, _symbols, _lifecycleManager) {
    'use strict';

    exports.__esModule = true;

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

    var _Promise = _interopRequireDefault(_bluebird);

    var Handler = function Handler(regexp, handler) {
        _classCallCheck(this, Handler);

        this.regexp = regexp;
        this['function'] = handler;
    };

    var Dispatcher = (function () {
        function Dispatcher() {
            _classCallCheck(this, Dispatcher);

            this.handlers = new Set();
        }

        Dispatcher.prototype.connect = function connect(instance) {
            this.instance = instance;

            this.registerMetadata();
            _fluxDispatcher.FluxDispatcher.instance.registerInstanceDispatcher(this);

            instance[_symbols.Symbols.instanceDispatcher] = this;
            _lifecycleManager.LifecycleManager.interceptInstanceDeactivators(instance);
        };

        Dispatcher.prototype.handle = function handle(patterns, callback) {
            var _this = this;

            var handler = new Handler(_utils.Utils.patternsToRegex(patterns), callback);
            this.handlers.add(handler);

            return function () {
                _this.handlers['delete'](handler);
            };
        };

        Dispatcher.prototype.waitFor = function waitFor(types, handler) {
            _fluxDispatcher.FluxDispatcher.instance.waitFor(types, handler);
        };

        Dispatcher.prototype.dispatch = function dispatch(action) {
            for (var _len = arguments.length, payload = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                payload[_key - 1] = arguments[_key];
            }

            _fluxDispatcher.FluxDispatcher.instance.dispatch(action, payload);
        };

        Dispatcher.prototype.dispatchOwn = function dispatchOwn(action, payload) {
            var _this2 = this;

            var promises = [];

            this.handlers.forEach(function (handler) {
                if (handler.regexp.test(action)) {
                    promises.push(_Promise['default'].resolve(handler['function'].apply(_this2.instance, [action].concat(payload))));
                }
            });

            return _Promise['default'].settle(promises);
        };

        Dispatcher.prototype.registerMetadata = function registerMetadata() {
            var _this3 = this;

            var metadata = _metadata.Metadata.getOrCreateMetadata(Object.getPrototypeOf(this.instance));

            metadata.awaiters.forEach(function (types, methodName) {
                if (_this3.instance[methodName] !== undefined && typeof _this3.instance[methodName] === 'function') {
                    var methodImpl = _this3.instance[methodName];
                    _this3.instance[methodName] = function () {
                        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                            args[_key2] = arguments[_key2];
                        }

                        return _fluxDispatcher.FluxDispatcher.instance.waitFor(types, function () {
                            methodImpl.apply(_this3.instance, args);
                        });
                    };
                }
            });

            metadata.handlers.forEach(function (patterns, methodName) {
                if (_this3.instance[methodName] !== undefined && typeof _this3.instance[methodName] === 'function') {
                    _this3.handlers.add(new Handler(_utils.Utils.patternsToRegex(patterns), _this3.instance[methodName]));
                }
            });
        };

        return Dispatcher;
    })();

    exports.Dispatcher = Dispatcher;
});