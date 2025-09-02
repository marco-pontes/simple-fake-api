"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var bundler_1 = require("@marco-pontes/simple-fake-api/bundler");
// Example Vite config for a consumer app using simple-fake-api HTTP client
// It injects __SIMPLE_FAKE_API_HTTP__ from a config object you build here (optionally using env vars).
// Example env used here:
// - SIMPLE_FAKE_API_API_SERVER_BASE_URL=https://api.example.com
var environment = process.env.NODE_ENV || 'development';
// Use the setupSimpleFakeApiHttpRoutes directly and synchronously so env vars are set before Vite proceeds
var apiConfig = (0, bundler_1.setupSimpleFakeApiHttpRoutes)(environment);
exports.default = (0, vite_1.defineConfig)({
    define: __assign({}, apiConfig),
});
