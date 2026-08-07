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

let rooms = {};

io.on('connection', (socket) => {
    console.log("사용자 접속:", socket.id);

    // 방 만들기: 고유 초대코드 발급
    socket.on('createRoom', () => {
        let roomCode;
        do {
            roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (rooms[roomCode]);

        rooms[roomCode] = {
            hostSocketId: socket.id,
            players: {},
            active: true
        };

        socket.roomCode = roomCode;
        socket.emit('roomCreated', roomCode);
        console.log(`[방 생성] 코드: ${roomCode} / 방장 소켓 ID: ${socket.id}`);
    });

    // 방 입장하기 (방이 활성화 상태일 때만 입장 가능)
    socket.on('joinRoom', (data) => {
        const { code, name, avatar, direction } = data;
        let roomCode = code ? code.trim().toUpperCase() : "";

        if (!rooms[roomCode] || !rooms[roomCode].active) {
            socket.emit('joinError', "유효하지 않거나 존재하지 않는 방 코드입니다. (방장이 나갔거나 방이 종료됨)");
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

        console.log(`[방 입장] ${roomCode}번 방에 ${socket.id} (${name}) 입장`);
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

    // 연결 해제: 방장이 나가면 방을 서버 메모리에서 완전히 폭파
    socket.on('disconnect', () => {
        console.log("사용자 퇴장:", socket.id);
        for (let roomCode in rooms) {
            let room = rooms[roomCode];
            if (room.players[socket.id] || room.hostSocketId === socket.id) {
                if (room.hostSocketId === socket.id) {
                    room.active = false;
                    console.log(`[방 폭파] 방장(${socket.id})이 퇴장하여 방(${roomCode})이 종료됨.`);
                    io.to(roomCode).emit('joinError', "방장이 브라우저를 종료하여 방이 폭파되었습니다.");
                    delete rooms[roomCode]; // 메모리에서 삭제하여 해당 코드로 재접속 원천 차단
                } else {
                    delete room.players[socket.id];
                    io.to(roomCode).emit('players', room.players);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});