import { Document } from 'mongoose';

export type eventData = {
    eventHostId: string,
    eventHost: string,
    title: string,
    description: string,
    eventDate: string,
    eventTime: string
}

export interface fetchedEvent extends Document{

    eventHostId: string,
    eventId: string,
    eventHost: string,
    title: string,
    description: string,
    eventDateTime: Date
}

export type userData = {
    id: string,
    name: string
}