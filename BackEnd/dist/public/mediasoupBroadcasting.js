var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mediasoup from "mediasoup";
// type Peer = {
//     transports: WebRtcTransport[];
//     producers: Producer[];
//     consumers: Consumer[];
// };
// type TransportParams = {
//     roomId: string,
//     transportId: string;
//     dtlsParameters: any;
// };
// type ProduceParams = {
//     roomId: string,
//     transportId: string;
//     kind: "audio" | "video";
//     rtpParameters: any;
// };
// type ConsumeParams = {
//     producerId: string;
//     rtpCapabilities: any;
//     transportId: string;
// };
const rooms = new Map();
const mediasoupFunctioning = (req, res, io, worker, roomId) => __awaiter(void 0, void 0, void 0, function* () {
    let router;
    (() => __awaiter(void 0, void 0, void 0, function* () {
        worker = yield mediasoup.createWorker();
        console.log('Mediasoup Worker created');
        router = yield worker.createRouter({
            mediaCodecs: [
                { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
                { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 }
            ]
        });
        console.log("Mediasoup router created.");
    }))();
    console.log("==========Inside mediasoup functioning==============");
    io.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('New client connected:', socket.id);
        console.log('before emitting startBroadcasting');
        socket.on('startBroadcastStreaming', () => {
            console.log('Inside startBroadcasting');
            socket.emit('startBroadcasting');
        });
        console.log('after emitting startBroadcasting');
        socket.on('joinBroadcastStreaming', (data) => {
            console.log('inside join broadcast streaming', data, data.eventId);
            socket.emit('joinBroadcasting', { roomId: data.eventId });
        });
        socket.on("startBroadcast", (callback) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (rooms.has(roomId)) {
                    console.error(`oom ${roomId} already exists`);
                    return callback({ error: "Room already exists" });
                }
                // const router = await worker.createRouter({
                //     mediaCodecs: [
                //         { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
                //         { kind: "video", mimeType: "video/vp8", clockRate: 90000 },
                //     ],
                // });
                // Create Room and Add Broadcaster
                rooms.set(roomId, {
                    router,
                    broadcasters: new Map(),
                    viewers: new Map(),
                    producers: new Map(),
                });
                // Ensure broadcaster joins the room
                socket.join(roomId);
                rooms.get(roomId).broadcasters.set(socket.id, socket);
                console.log(`Room ${roomId} created by ${socket.id}`);
                //  DEBUG: Verify broadcaster is inside the room
                const clients = yield io.in(roomId).fetchSockets();
                console.log(`👥 Users in room ${roomId} after creation:`, clients.map(c => c.id));
                callback({ roomId });
            }
            catch (error) {
                console.error("Error starting broadcasting:", error);
                callback({ error: "Failed to start broadcast" });
            }
        }));
        // socket.on('startEvent', (roomId)=>{
        //     rooms.set(roomId, new Map<string, Peer>());
        //     console.log("Event started");
        // })
        socket.on('joinRoom', (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomId }, callback) {
            try {
                console.log('Inside join room with roomId', roomId);
                console.log(rooms);
                const room = rooms.get(roomId);
                if (!room) {
                    console.error(`Room ${roomId} not found`);
                    return callback({ error: 'Room not found' });
                }
                room.viewers.set(socket.id, socket);
                socket.join(roomId);
                console.log(`${socket.id} joined room ${roomId}`);
                // Send the list of existing producers to the joinee
                const existingProducers = Array.from(room.producers.values()).map((producer) => ({
                    producerId: producer.id,
                    kind: producer.kind,
                }));
                console.log(`Sending existing producers to ${socket.id}:`, existingProducers);
                socket.emit('existingProducers', existingProducers);
                // DEBUG: Show all users in the room
                const clients = yield io.in(roomId).fetchSockets();
                console.log(`👥 Users in room ${roomId}:`, clients.map(c => c.id));
                callback({ success: true });
            }
            catch (error) {
                console.error("Error joining room:", error);
                callback({ error: "Failed to join room" });
            }
        }));
        // Get Router Capabilities
        socket.on('getRouterRtpCapabilities', ({ roomId }, callback) => {
            const room = rooms.get(roomId);
            if (!room) {
                console.error(`Room ${roomId} not found`);
                return callback({ error: 'Room not found' });
            }
            console.log(`Sending router RTP capabilities for room ${roomId}`);
            callback(room.router.rtpCapabilities);
        });
        //Create WebRTC Transport
        socket.on('createTransport', (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomId, isProducer }, callback) {
            try {
                const room = rooms.get(roomId);
                if (!room) {
                    console.error(`Room ${roomId} not found in create transport`);
                    return callback({ error: 'Room not found in create transport' });
                }
                console.log(`Creating ${isProducer ? 'send' : 'recv'} transport for room ${roomId}...`);
                const transport = yield room.router.createWebRtcTransport({
                    listenIps: [{ ip: '127.0.0.1', announcedIp: null }],
                    enableUdp: true,
                    enableTcp: true,
                    preferUdp: true,
                });
                console.log(`Transport created: ${transport.id} (${isProducer ? 'send' : 'recv'})`);
                transport.on('dtlsstatechange', (state) => {
                    console.log(`DTLS state changed for transport ${transport.id}:`, state);
                    if (state === 'closed')
                        transport.close();
                });
                // Store transport
                if (isProducer) {
                    room.broadcasters.set(socket.id, transport);
                }
                else {
                    room.viewers.set(socket.id, transport);
                }
                callback({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                });
            }
            catch (error) {
                console.error("Error creating transport:", error);
                callback({ error: "Failed to create transport" });
            }
        }));
        // Connect WebRTC Transport
        socket.on('connectTransport', (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomId, transportId, dtlsParameters }, callback) {
            try {
                console.log(`Connecting transport ${transportId} in room ${roomId}...`);
                const room = rooms.get(roomId);
                if (!room) {
                    console.error(`Room ${roomId} not found in connect Transport`);
                    return callback({ error: 'Room not found in connect transport' });
                }
                const transport = [...room.broadcasters.values(), ...room.viewers.values()].find(t => t.id === transportId);
                if (!transport) {
                    console.error(`Transport ${transportId} not found`);
                    return callback({ error: 'Transport not found' });
                }
                yield transport.connect({ dtlsParameters });
                console.log(`Transport ${transportId} connected`);
                callback({ success: true });
            }
            catch (error) {
                console.error("Error connecting transport:", error);
                callback({ error: "Failed to connect transport" });
            }
        }));
        // 🎙 Produce Media Stream
        socket.on('produce', (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomId, transportId, kind, rtpParameters }, callback) {
            try {
                const room = rooms.get(roomId);
                if (!room) {
                    console.error(`Room ${roomId} not found in produce transport`);
                    return callback({ error: 'Room not found in produce transport' });
                }
                const transport = [...room.broadcasters.values()].find(t => t.id === transportId);
                if (!transport) {
                    console.error(`Transport ${transportId} not found`);
                    return callback({ error: 'Transport not found' });
                }
                const producer = yield transport.produce({ kind, rtpParameters });
                room.producers.set(producer.id, producer);
                console.log(`Producer created: ${producer.id} (${kind}) in room ${roomId}`);
                // Notify all users in the room about the new producer
                io.to(roomId).emit('newProducer', { producerId: producer.id, kind });
                console.log(`Emitted newProducer event for producer: ${producer.id}, kind: ${kind}`);
                callback({ producerId: producer.id });
            }
            catch (error) {
                console.error("Error producing stream:", error);
                callback({ error: "Failed to produce stream" });
            }
        }));
        // Consume Stream
        socket.on('consume', (_a, callback_1) => __awaiter(void 0, [_a, callback_1], void 0, function* ({ roomId, producerId, rtpCapabilities, transportId }, callback) {
            try {
                const room = rooms.get(roomId);
                if (!room) {
                    console.error(`Room ${roomId} not found`);
                    return callback({ error: 'Room not found' });
                }
                const transport = [...room.viewers.values()].find(t => t.id === transportId);
                if (!transport) {
                    console.error(`Transport ${transportId} not found`);
                    return callback({ error: 'Transport not found' });
                }
                const producer = room.producers.get(producerId);
                if (!producer) {
                    console.error(`Producer ${producerId} not found`);
                    return callback({ error: 'Producer not found' });
                }
                if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities })) {
                    console.error(`Cannot consume producer ${producerId}`);
                    return callback({ error: 'Cannot consume' });
                }
                const consumer = yield transport.consume({
                    producerId: producer.id,
                    rtpCapabilities,
                    paused: true,
                });
                console.log(`Consumer created: ${consumer.id} for producer ${producerId}`);
                callback({
                    id: consumer.id,
                    producerId: consumer.producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                });
                yield consumer.resume();
                console.log(`Consumer ${consumer.id} resumed`);
            }
            catch (error) {
                console.error("Error consuming stream:", error);
                callback({ error: "Failed to consume stream" });
            }
        }));
        // Handle Disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            for (const [roomId, room] of rooms.entries()) {
                // Remove broadcaster transports
                if (room.broadcasters.has(socket.id)) {
                    room.broadcasters.get(socket.id).close();
                    room.broadcasters.delete(socket.id);
                }
                // Remove viewers
                if (room.viewers.has(socket.id)) {
                    room.viewers.get(socket.id).close();
                    room.viewers.delete(socket.id);
                }
                // Remove empty rooms
                if (room.broadcasters.size === 0 && room.viewers.size === 0) {
                    rooms.delete(roomId);
                    console.log(`🗑 Room ${roomId} deleted`);
                }
            }
        });
    }));
});
export default mediasoupFunctioning;
