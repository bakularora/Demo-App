import { Router } from "express";
import eventController from "../controller/eventController.js";
import isAuthenticated from "../public/authentication.js";
const router = Router();
export const mediasoupStartFunction = (io, worker) => {
    router.post('/startBroadcasting', isAuthenticated, (req, res) => {
        eventController.startBroadcasting(req, res, io, worker);
    });
    return router;
};
