import { Router } from "express";
import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

import authController from "../controller/authenticationController.js";
import dataValidator from "../public/validatingLoginSignupData.js";
//import isAuthenticated from "../public/authentication.js";
import passport from "../public/passport.js";
import { userType } from "../types/authTypes.js";

router.post('/login', dataValidator.validateLoginData, authController.postLogin);

router.post('/signup', dataValidator.validateSignupData, authController.postSignup);

//router.post('/isAuthenticated' ,isAuthenticated);

router.post('/refresh',authController.postRefreshTokens);

router.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile'], prompt: "select_account"}));

// router.get("/auth/google", (req, res, next) => {
//     const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth`;
  
//   const params = new URLSearchParams({
//     client_id: process.env.GOOGLE_CLIENT_ID!,
//     redirect_uri: `${process.env.Google_Auth_Callback_Url}`, // Your callback URL
//     response_type: 'code',
//     scope: 'profile email',
//     prompt: 'select_account',  // Force the account selection screen
//   });

//   const fullAuthURL = `${googleAuthURL}?${params.toString()}`;

//   res.redirect(fullAuthURL);
//   });

// router.get("/auth/google", (req: Request, res: Response, next) => {
//     const redirectUrl = req.query.redirect as string
//     passport.authenticate("google", {
//       scope: ["email", "profile"],
//       state: redirectUrl, // Pass the redirect URL as state
//     })(req, res, next)
//   })

router.post('/logout', authController.logout);

router.get('/auth/google/callback',
    passport.authenticate('google', {session: false}),
    (req: Request, res: Response)=>{
    
        const userWithToken = req.user as { user: userType, accessToken: string, refreshToken: string};

        if (!userWithToken || !userWithToken.accessToken || !userWithToken.refreshToken) {
            res.status(401).json({ message: "Authentication failed" });
            return;
        }
        res.cookie('accessToken', userWithToken.accessToken, {
            httpOnly: true,
            secure: true,             // set this true in production as it sends cookie over https only
            sameSite: 'none',         // can be set to lax also. The cookie is sent with same-site requests and with "safe" cross-site requests like GET requests originating from links. 
            maxAge: Number(process.env.Access_Token_Cookie_Expiry)         //15 min in millis
        });

        res.cookie('refreshToken', userWithToken.refreshToken, {
            httpOnly: true,
            secure: true,             // set this true in production as it sends cookie over https only
            sameSite: 'none',         // can be set to lax also. The cookie is sent with same-site requests and with "safe" cross-site requests like GET requests originating from links. 
            maxAge: Number(process.env.Refresh_Token_Cookie_Expiry)         //15 min in millis
        });

        //res.status(200).json({"msg": "successfully registered"});

        res.redirect(`${process.env.Frontend_Url}/event`);
        // res.redirect('http://localhost:3000/getEvents');
        return;
    });

export default router;
