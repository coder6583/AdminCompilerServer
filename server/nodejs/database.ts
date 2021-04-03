import { Document, Model, model, Types, Schema, Query } from "mongoose"
// interface User extends Document{
//     email: string;
//     username: string;
//     displayName?: string;
//     password: string;
// }

const UserSchema:Schema = new Schema({
    email: {type: String, required: true},
    username: {type: String, required: true},
    displayName: {type: String, required: false},
    password: {type: String, required: true}
});

const User = model('User', UserSchema);

module.exports = User;