"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var passport_1 = __importDefault(require("passport"));
var body_parser_1 = __importDefault(require("body-parser"));
var passport_local_1 = __importDefault(require("passport-local"));
var app = express_1.default();
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(passport_1.default.initialize());
var LocalStrategy = passport_local_1.default.Strategy;
passport_1.default.use(new LocalStrategy(function (username, password, done) {
}));
