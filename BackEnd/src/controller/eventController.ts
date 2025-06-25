import { Request, Response } from "express";
import http from 'http';
import crypto from "crypto";
import { Server} from "socket.io";
import { Worker } from "mediasoup/node/lib/types";

import Events from "../models/eventsModel.js";
import { eventData, fetchedEvent, userData } from "../types/eventTypes.js";
import mediasoupStartCreation from "../public/mediasoupBroadcasting.js";

const fetchEvents = async (userId: string)=>{

    const allEvents = await Events.find({});
    const currentDateTime = new Date();

    const pastEvents : fetchedEvent[] = [];
    let myEvents: fetchedEvent[] = [];
    let upcomingEvents: fetchedEvent[] = [];

    for(let event of allEvents){

        if(event.eventDateTime < currentDateTime){

            pastEvents.push(event);
        }
        else if(event.eventHostId === userId){

            myEvents.push(event);
        }
        else{
            upcomingEvents.push(event);
        }
    }

    return { pastEvents: pastEvents, myEvents: myEvents, upcomingEvents: upcomingEvents};
}

const getEvents = async (req: Request, res: Response)=>{

    try{
        const user = req.user as userData;
        const allEvents = await fetchEvents(user.id);

        console.log(allEvents);

        res.status(200).json(allEvents);
        return;
    }
    catch(error){
        console.log("error while fetching events", error);
        res.status(500).json({err: 'Error while fetching events'});
    }
}

const postCreateEvent = async (req: Request, res: Response)=>{

    try{
        const body = req.body as eventData;
        const user = req.user as userData; 

        console.log('kolo',req.file);

        const eventHostId = user.id;
        const eventHost = user.name;
        const eventId = crypto.randomUUID();
        const title = body.title;
        const description = body.description;
        const thumbnail = `/thumbnails/${req.file!.filename}`;
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
    
        await event.save();

        const savedEvent = {
            eventId: eventId,
            eventHost: eventHost,
            title: title,
            description: description,
            thumbnail: thumbnail,
            eventDate: eventDate,
            eventTime: eventTime
        }
    
        res.status(200).json({event: savedEvent});
        return;
    }
    catch(error){
        console.log("Error creating event", error);
        res.status(500).json({'err': 'Error creating Event'});
    }
}

const startBroadcasting = (req: Request, res: Response, server: Server, worker: Worker)=>{
    console.log('Event id in startBroadcastisng ', req.body.eventId);
    mediasoupStartCreation(req, res, server, worker, req.body.eventId);
}

export default {
    getEvents,
    postCreateEvent,
    startBroadcasting,
}