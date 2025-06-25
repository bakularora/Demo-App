var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";
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
const postSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const name = body.name;
        const email = body.email;
        const pwd = body.password;
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            res.status(400).json({ 'error': validationErrors.array()[0].msg });
            return;
        }
        const encrptdPwd = yield bcrypt.hash(pwd, 12);
        const user = new User({
            name: name,
            email: email,
            auth: "local",
            password: encrptdPwd
        });
        yield user.save();
        const transporter = nodemailer.createTransport(emailConfiguration);
        res.status(200).json({ "msg": "User registered successfully" });
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
        return;
    }
    catch (err) {
        console.log("Internal server error in registering user");
        // implement centrelazed error handling below and in all catch blocks
        res.status(500).json({ 'err': 'Error registrting user' });
    }
});
const postLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const uEmail = body.email;
        const pwd = body.password;
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            res.status(400).json({ 'error': validationErrors.array()[0].msg });
            return;
        }
        const user = yield User.findOne({ email: uEmail });
        if (!user) {
            res.status(401).json({ 'error': "Invalid email or password" });
            return;
        }
        const isMatch = yield bcrypt.compare(pwd, user.password);
        if (!isMatch) {
            res.status(401).json({ 'error': "Invalid email or password" });
            return;
        }
        // user authenticated successfully
        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        yield user.save();
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true, // set this true in production as it sends cookie over https only
            sameSite: "none", // can be set to lax also. The cookie is sent with same-site requests and with "safe" cross-site requests like GET requests originating from links. 
            maxAge: Number(process.env.Access_Token_Cookie_Expiry) //15 min in millis
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // set this true in production as it sends cookie over https only
            sameSite: "none", // can be set to lax also. The cookie is sent with same-site requests and with "safe" cross-site requests like GET requests originating from links.
            maxAge: Number(process.env.Refresh_Token_Cookie_Expiry) //1 day in millis
        });
        res.status(200).json({ "msg": "logged in successfully" });
        return;
    }
    catch (err) {
        //handle error;
        console.log("Internal server in verifying login", err);
        res.status(500).json("");
    }
});
const postRefreshTokens = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(400).json({ "error": "Please login again" });
            return;
        }
        const verified = jsonwebtoken.verify(refreshToken, process.env.JWT_Refresh_Secret);
        if (!verified) {
            res.status(401).json({ "error": "Invalid token. Please Login again" });
            return;
        }
        const user = yield User.findOne({ _id: verified.id });
        if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
            res.status(401).json({ "error": "Invalid Token" });
            return;
        }
        const newTokens = generateTokens(user);
        res.cookie('accessToken', newTokens.accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            //maxAge: Number(process.env.Access_Token_Cookie_Expiry)
        });
        res.cookie('refreshToken', newTokens.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            //maxAge: Number(process.env.Refresh_Token_Cookie_Expiry)
        });
        user.refreshToken = newTokens.refreshToken;
        yield user.save();
        res.status(200).json({ "msg": "tokens refreshed successfully" });
        return;
    }
    catch (err) {
        console.log("error while refreshing tokens", err);
        res.status(500).json({ "error": "internal server error" });
    }
});
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refreshToken;
        console.log(req.cookies);
        if (!refreshToken) {
            res.status(400).json({ "error": "Access Denied, Login Again" });
            return;
        }
        const user = yield User.findOne({ refreshToken: refreshToken });
        if (!user) {
            res.status(400).json({ "error": "Invalid again" });
            return;
        }
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: true, // set this true in production as it sends cookie over https only
            sameSite: "none",
        });
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true, // set this true in production as it sends cookie over https only
            sameSite: "none",
        });
        user.refreshToken = "";
        yield user.save();
        res.status(200).json({ 'msg': 'logout successful' });
        return;
    }
    catch (err) {
        res.status(500).json({ 'error': "Internal server error" });
        console.log('Internal server error while logging out: ', err);
    }
});
export default {
    postSignup,
    postLogin,
    postRefreshTokens,
    logout
};
