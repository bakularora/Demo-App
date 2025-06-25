import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/userModel.js";
import { userType, loginData, signupData } from "../types/authTypes.js";

interface refreshTokenType extends JwtPayload {
    id: string
}

const emailConfiguration = {
    host: process.env.Brevo_smtpServer,
    port: Number(process.env.Brevo_port),  // TLS (use 465 for SSL)
    secure: false,                 // Set to true for port 465
    auth: {
        user: process.env.Brevo_login,
        pass: process.env.Brevo_pwd
    }
}

const generateTokens = (user: userType) => {
    const accessToken = jsonwebtoken.sign(
        {
            id: user._id,
            name: user.name,
            email: user.email
        },
        process.env.JWT_Access_Secret!,
        { expiresIn: Number(process.env.JWT_Access_Token_Expiry) }

    );

    const refreshToken = jsonwebtoken.sign(
        {
            id: user._id
        },
        process.env.JWT_Refresh_Secret!,
        { expiresIn: Number(process.env.JWT_Access_Token_Expiry) }
    )
    return { accessToken, refreshToken };
}

const postSignup = async (req: Request, res: Response) => {

    try {
        const body = req.body as signupData;

        const name = body.name;
        const email = body.email;
        const pwd = body.password;

        const validationErrors = validationResult(req);

        if (!validationErrors.isEmpty()) {
            res.status(400).json({ 'error': validationErrors.array()[0].msg });
            return;
        }

        const encrptdPwd = await bcrypt.hash(pwd, 12);

        const user = new User({
            name: name,
            email: email,
            auth: "local",
            password: encrptdPwd
        });

        await user.save();

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
        res.status(500).json({'err': 'Error registrting user'});
    }
}

const postLogin = async (req: Request, res: Response) => {

    try {
        const body = req.body as loginData;

        const uEmail = body.email;
        const pwd = body.password;

        const validationErrors = validationResult(req);


        if (!validationErrors.isEmpty()) {
            res.status(400).json({ 'error': validationErrors.array()[0].msg });
            return;
        }

        const user = await User.findOne({ email: uEmail }) as userType;

        if (!user) {
            res.status(401).json({ 'error': "Invalid email or password" });
            return;
        }

        const isMatch = await bcrypt.compare(pwd, user.password);

        if (!isMatch) {
            res.status(401).json({ 'error': "Invalid email or password" });
            return;
        }
        // user authenticated successfully

        const { accessToken, refreshToken } = generateTokens(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,             // set this true in production as it sends cookie over https only
            sameSite: "none",         // can be set to lax also. The cookie is sent with same-site requests and with "safe" cross-site requests like GET requests originating from links. 
            maxAge: Number(process.env.Access_Token_Cookie_Expiry)         //15 min in millis
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,            // set this true in production as it sends cookie over https only
            sameSite: "none",        // can be set to lax also. The cookie is sent with same-site requests and with "safe" cross-site requests like GET requests originating from links.
            maxAge: Number(process.env.Refresh_Token_Cookie_Expiry)              //1 day in millis
        })

        res.status(200).json({ "msg": "logged in successfully" });
        return;
    }
    catch (err) {
        //handle error;
        console.log("Internal server in verifying login", err);
        res.status(500).json("");
    }
}

const postRefreshTokens = async (req: Request, res: Response) => {

    try {

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            res.status(400).json({ "error": "Please login again" });
            return;
        }

        const verified = jsonwebtoken.verify(refreshToken, process.env.JWT_Refresh_Secret!) as refreshTokenType;

        if (!verified) {
            res.status(401).json({ "error": "Invalid token. Please Login again" })
            return;
        }

        const user = await User.findOne({ _id: verified.id }) as userType;

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
        })

        user.refreshToken = newTokens.refreshToken;
        await user.save();

        res.status(200).json({ "msg": "tokens refreshed successfully" });
        return;
    }
    catch (err) {
        console.log("error while refreshing tokens", err);
        res.status(500).json({ "error": "internal server error" });
    }

}

const logout = async (req: Request, res: Response) => {

    try {

        const refreshToken = req.cookies.refreshToken;

        console.log(req.cookies);

        if (!refreshToken) {
            res.status(400).json({ "error": "Access Denied, Login Again" });
            return;
        }

        const user = await User.findOne({ refreshToken: refreshToken });

        if (!user) {
            res.status(400).json({ "error": "Invalid again" })
            return;
        }

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: true,            // set this true in production as it sends cookie over https only
            sameSite: "none",
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,            // set this true in production as it sends cookie over https only
            sameSite: "none",
        });

        user.refreshToken = "";
        await user.save();

        res.status(200).json({ 'msg': 'logout successful' });
        return;
    }
    catch (err) {
        res.status(500).json({ 'error': "Internal server error" });
        console.log('Internal server error while logging out: ', err);
    }
}
export default {
    postSignup,
    postLogin,
    postRefreshTokens,
    logout
}