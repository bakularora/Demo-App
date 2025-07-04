var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mediasoup from 'mediasoup';
import dotenv from "dotenv";
dotenv.config();
import authenticationRoutes from './routes/authenticationRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import { mediasoupStartFunction } from './routes/mediasoupCreation.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const corsOptions = {
    origin: process.env.Frontend_Url,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.options('/{*splat}', cors(corsOptions));
app.use(cors(corsOptions));
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions
});
let worker;
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        worker = yield mediasoup.createWorker();
        console.log('Mediasoup Worker created');
    }
    catch (error) {
        console.log('Error creating worker');
    }
}))();
console.log(__dirname);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use('/thumbnails', express.static(path.join(__dirname, '../', 'thumbnails')));
app.use(authenticationRoutes);
app.use(eventRoutes);
app.use('/startEvent', mediasoupStartFunction(io, worker));
mongoose.connect(process.env.Db_Link)
    .then(() => {
    server.listen(process.env.Port || 8000, () => {
        console.log(`server listening at port ${process.env.Port}`);
    });
})
    .catch(err => {
    console.log("Error connecting database", err);
});
