import {Router, Request, Response } from "express";
import http from "http";
import {Server} from "socket.io";
import { Worker } from "mediasoup/node/lib/types";

import eventController from "../controller/eventController.js";
import isAuthenticated from "../public/authentication.js";

const router = Router();

export const mediasoupStartFunction = (io: Server, worker: Worker)=>{

    router.post('/startBroadcasting', isAuthenticated, (req: Request, res: Response)=>{
         eventController.startBroadcasting(req, res, io, worker);
    });

    return router;
}