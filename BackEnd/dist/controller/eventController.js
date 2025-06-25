var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import crypto from "crypto";
import Events from "../models/eventsModel.js";
import mediasoupStartCreation from "../public/mediasoupBroadcasting.js";
const fetchEvents = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const allEvents = yield Events.find({});
    const currentDateTime = new Date();
    const pastEvents = [];
    let myEvents = [];
    let upcomingEvents = [];
    for (let event of allEvents) {
        if (event.eventDateTime < currentDateTime) {
            pastEvents.push(event);
        }
        else if (event.eventHostId === userId) {
            myEvents.push(event);
        }
        else {
            upcomingEvents.push(event);
        }
    }
    return { pastEvents: pastEvents, myEvents: myEvents, upcomingEvents: upcomingEvents };
});
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const allEvents = yield fetchEvents(user.id);
        console.log(allEvents);
        res.status(200).json(allEvents);
        return;
    }
    catch (error) {
        console.log("error while fetching events", error);
        res.status(500).json({ err: 'Error while fetching events' });
    }
});
const postCreateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const user = req.user;
        console.log('kolo', req.file);
        const eventHostId = user.id;
        const eventHost = user.name;
        const eventId = crypto.randomUUID();
        const title = body.title;
        const description = body.description;
        const thumbnail = `/thumbnails/${req.file.filename}`;
        const eventDate = body.eventDate;
        const eventTime = body.eventTime;
        const evtDateTime = `${eventDate}T${eventTime}:00Z`;
        const eventDateTime = new Date(evtDateTime);
        const event = new Events({
            eventHostId: eventHostId,
            eventId: eventId,
            eventHost: eventHost,
            title: title,
            thumbnail: thumbnail,
            description: description,
            eventDateTime: eventDateTime,
        });
        yield event.save();
        const savedEvent = {
            eventId: eventId,
            eventHost: eventHost,
            title: title,
            description: description,
            thumbnail: thumbnail,
            eventDate: eventDate,
            eventTime: eventTime
        };
        res.status(200).json({ event: savedEvent });
        return;
    }
    catch (error) {
        console.log("Error creating event", error);
        res.status(500).json({ 'err': 'Error creating Event' });
    }
});
const startBroadcasting = (req, res, server, worker) => {
    console.log('Event id in startBroadcastisng ', req.body.eventId);
    mediasoupStartCreation(req, res, server, worker, req.body.eventId);
};
export default {
    getEvents,
    postCreateEvent,
    startBroadcasting,
};
