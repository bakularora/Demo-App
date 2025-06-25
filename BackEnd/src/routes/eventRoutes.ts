import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import isAuthenticated from "../public/authentication.js";
import eventController from "../controller/eventController.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb)=>{
            const uploadPath = path.join(__dirname, '../', 'thumbnails');
            console.log(uploadPath);
            cb(null, 'thumbnails');
        },
        filename: (req, file, cb)=>{
            cb(null, Date.now() + file.originalname);
        }
});

const thumbnailUpload = multer({storage: thumbnailStorage}).single('image');

router.get('/getEvents', isAuthenticated, eventController.getEvents);

router.post('/createEvent', isAuthenticated, thumbnailUpload,  eventController.postCreateEvent);

export default router;