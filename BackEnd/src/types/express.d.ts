import { Request } from "express";
import accessTokenData from "./authTypes";

declare global {
  namespace Express {
    interface Request {
      user?: accessTokenData; // Replace with the actual type of your user object
    }
  }
}