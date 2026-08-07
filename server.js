const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 방 데이터: { roomCode: { hostSocketId, players: {}, active: true } }
let rooms = {};

io.on('connection', (socket) => {
    console.log("사용자 접속:", socket.id);

    // 방 만들기
    socket.on('createRoom', (data) => {
        let roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        rooms[roomCode] = {
            hostSocketId: socket.id,
            players: {},
            active: true
        };

        socket.emit('roomCreated', roomCode);
        console.log(`방 생성됨: ${roomCode} (방장: ${socket.id})`);
    });

    // 방 입장하기
    socket.on('joinRoom', (data) => {
        const { code, name, avatar, direction } = data;
        let roomCode = code ? code.trim().toUpperCase() : "";

        if (!rooms[roomCode] || !rooms[roomCode].active) {
            socket.emit('joinError', "존재하지 않거나 방장이 종료하여 닫힌 방 코드입니다.");
            return;
        }

        let room = rooms[roomCode];

        socket.join(roomCode);
        socket.roomCode = roomCode;

        room.players[socket.id] = {
            x: 380,
            y: 250,
            name: name || "Player",
            avatar: avatar || "beachboy",
            direction: direction || "front"
        };

        io.to(roomCode).emit('players', room.players);
    });

    // 플레이어 이동
    socket.on('move', (data) => {
        let roomCode = socket.roomCode;
        if (roomCode && rooms[roomCode] && rooms[roomCode].players[socket.id]) {
            rooms[roomCode].players[socket.id].x = data.x;
            rooms[roomCode].players[socket.id].y = data.y;
            rooms[roomCode].players[socket.id].avatar = data.avatar;
            rooms[roomCode].players[socket.id].direction = data.direction;

            io.to(roomCode).emit('players', rooms[roomCode].players);
        }
    });

    // 채팅 전송
    socket.on('chat', (data) => {
        let roomCode = socket.roomCode;
        if (roomCode) {
            io.to(roomCode).emit('chat', data);
        }
    });

    // 연결 해제
    socket.on('disconnect', () => {
        console.log("사용자 퇴장:", socket.id);
        for (let roomCode in rooms) {
            if (rooms[roomCode].players[socket.id]) {
                delete rooms[roomCode].players[socket.id];
                
                if (rooms[roomCode].hostSocketId === socket.id) {
                    console.log(`방장(${socket.id})이 브라우저를 종료하여 방(${roomCode})이 닫힙니다.`);
                    rooms[roomCode].active = false;
                    io.to(roomCode).emit('joinError', "방장이 방을 나가서 게임이 종료되었습니다.");
                } else {
                    io.to(roomCode).emit('players', rooms[roomCode].players);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});