import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();

import {accessTokenData} from "../types/authTypes";

const isAuthenticated = (req: Request, res: Response, next: NextFunction)=> { // (req: Request & {user: tokenData} because we would assign user object to req as req.user = user below;

    try{

        const token = req.cookies.accessToken;
        //const token = req.headers.authorization?.split(" ")[1];
        
        if(!token){
            res.status(401).json({'error': 'Access denied, Please Login Again'});
            return;
        }
    
        
        const tokenData = jsonwebtoken.verify(token, process.env.JWT_Access_Secret!) as accessTokenData; // typecast JwtPayload to tokenData to tell typescript that JwtPayload will contain our tokenData fields.
    
        console.log(tokenData);
        if(!tokenData){
            res.status(401).json({'error': 'Access Denied, Login again'});
            return;
        }
    
        if(!tokenData || !tokenData.id || !tokenData.name || !tokenData.email){  //checking
            res.status(401).json({'error': 'Access Denied, invalid token structure'});
            return;
        }

        req.user = tokenData;
        // res.status(200).json({"msg": "access granted"});
        next();
    }
    catch(err){
        console.log("Internal server error while verifying jwt token", err);
        
        res.status(500).json("");
        return;
    }
}

export default isAuthenticated;
