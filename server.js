const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
});

app.get("/",(req,res)=>{
    res.send(
        "PixelTown Server Running"
    );
});

// ======================
// 방 데이터
// ======================

let rooms = {};

// ======================
// 코드 생성
// ======================

function createCode(){
    let code;
    do{
        code =
        Math.random()
        .toString(36)
        .substring(2,7)
        .toUpperCase();
    }
    while(rooms[code]);

    return code;
}

// ======================
// 접속
// ======================

io.on(
"connection",
(socket)=>{

console.log(
"접속:",
socket.id
);

// ======================
// 방 생성
// ======================

socket.on(
"createRoom",
(data)=>{
    let code=createCode();

    rooms[code]={
        owner:socket.id,
        players:{}
    };

    socket.join(code);
    socket.room=code;

    rooms[code].players[socket.id]={
        id:socket.id,
        name:data?.name || "Player",
        x:350,
        y:250,
        avatar:data?.avatar || "beachboy",
        owner:true
    };

    socket.emit(
        "roomCreated",
        code
    );

    io.to(code).emit(
        "players",
        rooms[code].players
    );
});

// ======================
// 방 참가
// ======================

socket.on(
"joinRoom",
(data)=>{
    let code =
    String(data.code)
    .trim()
    .toUpperCase();

    if(!rooms[code]){
        socket.emit(
            "joinError",
            "없는 방입니다."
        );
        return;
    }

    socket.join(code);
    socket.room=code;

    rooms[code].players[socket.id]={
        id:socket.id,
        name:data.name || "Player",
        x:350,
        y:250,
        avatar:data.avatar || "beachboy",
        owner:false
    };

    io.to(code).emit(
        "players",
        rooms[code].players
    );
});

// ======================
// 이동
// ======================

socket.on(
"move",
(pos)=>{
    let room=socket.room;

    if(!room)
        return;

    let player =
    rooms[room]?.players[socket.id];

    if(player){
        player.x = pos.x;
        player.y = pos.y;
        if(pos.avatar){
            player.avatar = pos.avatar;
        }
    }

    io.to(room).emit(
        "players",
        rooms[room].players
    );
});


// ======================
// 채팅
// ======================

socket.on(
"chat",
(data)=>{
    let room = socket.room;

    if(!room)
        return;

    let player =
    rooms[room]?.players[socket.id];

    if(!player)
        return;

    let message = "";

    // 문자열 채팅
    if(typeof data === "string"){
        message = data;
    }
    // 객체 채팅
    else if(typeof data === "object"){
        message = data.text || "";
    }

    io.to(room).emit(
        "chat",
        {
            name:player.name,
            text:String(message)
        }
    );
});


// ======================
// 종료
// ======================

socket.on(
"disconnect",
()=>{
    let room = socket.room;

    if(!room)
        return;

    if(!rooms[room])
        return;

    delete rooms[room].players[socket.id];

    // 방장이 나가면 방 삭제
    if(
        rooms[room].owner === socket.id
    ){
        io.to(room).emit(
            "joinError",
            "방장이 나가 방이 종료되었습니다."
        );

        delete rooms[room];
        return;
    }

    // 사람이 없으면 삭제
    if(
        Object.keys(
            rooms[room].players
        ).length === 0
    ){
        delete rooms[room];
        return;
    }

    io.to(room).emit(
        "players",
        rooms[room].players
    );
});

});

const PORT =
process.env.PORT || 3000;

server.listen(
PORT,
()=>{
    console.log(
        "PixelTown Server Start : "+PORT
    );
});