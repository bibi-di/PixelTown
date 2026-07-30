const express = require("express");
const http = require("http");
const { Server } = require("socket.io");


const app = express();

const server = http.createServer(app);


const io = new Server(server,{

    cors:{
        origin:"*",
        methods:["GET","POST"]
    }

});


app.get("/",(req,res)=>{

    res.send("PixelTown Server Running");

});




// ======================
// 방 저장
// ======================

let rooms = {};




// ======================
// 코드 생성
// ======================

function createCode(){

    let code;


    do{

        code = Math.random()
        .toString(36)
        .substring(2,7)
        .toUpperCase();


    }while(rooms[code]);


    return code;

}





io.on("connection",(socket)=>{


console.log(
"접속:",
socket.id
);





// ======================
// 방 만들기
// ======================


socket.on(
"createRoom",
(data)=>{


    let code=createCode();



    rooms[code]={


        host:socket.id,


        usedInvite:false,


        players:{}



    };




    socket.join(code);


    socket.room=code;


    socket.isHost=true;




    rooms[code].players[socket.id]={


        x:350,

        y:250,

        name:data.name || "방장",

        id:socket.id,

        host:true


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


    let code=data.code;



    if(!rooms[code]){


        socket.emit(
            "joinError",
            "없는 방입니다."
        );


        return;

    }






    let room=rooms[code];





    // 이미 한번 사용된 초대코드 차단

    if(room.usedInvite){


        socket.emit(
            "joinError",
            "이미 사용된 초대 코드입니다."
        );


        return;


    }






    // 초대코드 사용 처리

    room.usedInvite=true;





    socket.join(code);


    socket.room=code;


    socket.isHost=false;





    room.players[socket.id]={


        x:350,

        y:250,

        name:data.name || "Player",

        id:socket.id,

        host:false


    };







    io.to(code).emit(
        "players",
        room.players
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


        player.x=pos.x;

        player.y=pos.y;


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
(text)=>{


    let room=socket.room;


    if(!room)
        return;




    let player =
    rooms[room]?.players[socket.id];




    if(player){



        io.to(room).emit(
            "chat",
            {

                name:player.name,

                text:text

            }
        );


    }



});









// ======================
// 종료
// ======================


socket.on(
"disconnect",
()=>{


    let roomCode=socket.room;



    if(!roomCode)
        return;



    let room=rooms[roomCode];



    if(!room)
        return;






    delete room.players[socket.id];







    // 방장이 나가면 방 삭제

    if(socket.id===room.host){


        delete rooms[roomCode];


        return;


    }






    // 친구가 나가면 초대코드 폐기

    room.usedInvite=true;





    io.to(roomCode).emit(
        "players",
        room.players
    );




});



});






const PORT=
process.env.PORT || 3000;



server.listen(PORT,()=>{


console.log(
"PixelTown Server Start : "+PORT
);


});