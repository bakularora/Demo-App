var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jsonwebtoken from "jsonwebtoken";
import passport from "passport";
import nodemailer from "nodemailer";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/userModel.js";
const emailConfiguration = {
    host: process.env.Brevo_smtpServer,
    port: Number(process.env.Brevo_port), // TLS (use 465 for SSL)
    secure: false, // Set to true for port 465
    auth: {
        user: process.env.Brevo_login,
        pass: process.env.Brevo_pwd
    }
};
const sendMail = (email, name) => {
    const transporter = nodemailer.createTransport(emailConfiguration);
    const info = transporter.sendMail({
        to: email,
        from: 'alexandre.the.conquerer@gmail.com',
        subject: 'SignUp successful',
        html: `<h1>Welcome to Open Aura</h1><p> We welcome you ${name} to our platform </p>`
    }, (err) => {
        if (err) {
            console.log("Error in sending mail", err);
        }
    });
};
const generateTokens = (user) => {
    const accessToken = jsonwebtoken.sign({
        id: user._id,
        name: user.name,
        email: user.email
    }, process.env.JWT_Access_Secret, { expiresIn: Number(process.env.JWT_Access_Token_Expiry) });
    const refreshToken = jsonwebtoken.sign({
        id: user._id
    }, process.env.JWT_Refresh_Secret, { expiresIn: Number(process.env.JWT_Access_Token_Expiry) });
    return { accessToken, refreshToken };
};
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
}, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user = yield User.findOne({ googleId: profile.id });
        if (user) {
            const { accessToken, refreshToken } = generateTokens(user);
            return done(null, { accessToken, refreshToken, user });
        }
        const localAuthUser = yield User.findOne({ email: (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0].value });
        if (localAuthUser) {
            localAuthUser.googleId = profile.id;
            localAuthUser.auth = "google";
            yield localAuthUser.save();
            const { accessToken, refreshToken } = generateTokens(localAuthUser);
            return done(null, { accessToken, refreshToken, localAuthUser });
        }
        else {
            const newUser = new User({
                googleId: profile.id,
                email: (_b = profile.emails) === null || _b === void 0 ? void 0 : _b[0].value,
                name: profile.displayName,
                auth: 'google'
            });
            yield newUser.save();
            const { accessToken, refreshToken } = generateTokens(newUser);
            sendMail((_c = profile.emails) === null || _c === void 0 ? void 0 : _c[0].value, profile.displayName);
            return done(null, { newUser, accessToken: accessToken, refreshToken: refreshToken });
        }
    }
    catch (err) {
        return done(err);
    }
})));
export default passport;
