"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
// interface User extends Document{
//     email: string;
//     username: string;
//     displayName?: string;
//     password: string;
// }
var UserSchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    username: { type: String, required: true },
    displayName: { type: String, required: false },
    password: { type: String, required: true }
});
var User = mongoose_1.model('User', UserSchema);
module.exports = User;
