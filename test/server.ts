import express from 'express';
import passport from 'passport';
import bodyParser from 'body-parser';
import passportLocal from 'passport-local';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

const LocalStrategy = passportLocal.Strategy;

passport.use(new LocalStrategy((username, password, done) => {
  
}));