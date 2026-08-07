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

// 방 데이터 구조: { roomCode: { hostSocketId, players: {}, invitedCount: 0 } }
let rooms = {};

io.on('connection', (socket) => {
    console.log("사용자 접속:", socket.id);

    // 방 만들기
    socket.on('createRoom', (data) => {
        let roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        rooms[roomCode] = {
            hostSocketId: socket.id,
            players: {},
            invitedCount: 0 // 초대코드로 입장한 인원 카운트
        };

        socket.emit('roomCreated', roomCode);
        console.log(`방 생성됨: ${roomCode} (방장: ${socket.id})`);
    });

    // 방 입장하기
    socket.on('joinRoom', (data) => {
        const { code, name, avatar, direction } = data;
        let roomCode = code ? code.trim().toUpperCase() : "";

        if (!rooms[roomCode]) {
            socket.emit('joinError', "존재하지 않는 방 코드입니다.");
            return;
        }

        let room = rooms[roomCode];

        // 방장이 재접속하는 경우
        let isHost = (room.hostSocketId === socket.id || !room.hostSocketId);
        
        // 이미 방에 들어가 있는 플레이어가 다시 접속하는 경우 (새로고침 등)
        let isExistingPlayer = room.players[socket.id] !== undefined;

        // 신규 유저가 들어오는 경우 (방장도 아니고, 기존 멤버도 아님)
        if (!isHost && !isExistingPlayer) {
            // 초대코드는 딱 1번만 허용 (invitedCount가 1 이상이면 차단)
            if (room.invitedCount >= 1) {
                socket.emit('joinError', "이미 사용된 일회용 초대코드입니다. 더 이상 입장할 수 없습니다.");
                return;
            }
            // 신규 유저 입장 성공 시 카운트 증가
            room.invitedCount++;
        }

        // 방장이 나갔다가 재접속한 경우 방장 권한 복구
        if (!room.hostSocketId) {
            room.hostSocketId = socket.id;
        }

        socket.join(roomCode);
        socket.roomCode = roomCode;

        // 플레이어 정보 등록 (또는 유지)
        room.players[socket.id] = {
            x: room.players[socket.id]?.x || 380,
            y: room.players[socket.id]?.y || 250,
            name: name || "Player",
            avatar: avatar || "beachboy",
            direction: direction || "front"
        };

        // 해당 방의 모든 사용자에게 플레이어 목록 전송
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
                // 실시간 게임 화면에서는 목록에서 제외하지만, 재접속을 위해 데이터는 보존
                // (만약 완전히 방을 폭파하고 싶다면 여기서 처리를 달리할 수 있음)
                delete rooms[roomCode].players[socket.id];
                
                if (rooms[roomCode].hostSocketId === socket.id) {
                    console.log(`방장(${socket.id})이 나갔으나 방(${roomCode}) 데이터는 유지됩니다.`);
                    rooms[roomCode].hostSocketId = null;
                }

                io.to(roomCode).emit('players', rooms[roomCode].players);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});