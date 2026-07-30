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

    res.send(
        "PixelTown Server Running"
    );

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

        code =
        Math.random()
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


            let code =
            createCode();



            rooms[code]={

                owner:socket.id,

                players:{}

            };



            socket.join(code);

            socket.room=code;



            rooms[code].players[socket.id]={


                x:350,

                y:250,

                name:
                data?.name || "Player",

                id:socket.id,


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


        }
    );








    // ======================
    // 방 존재 확인
    // ======================


    socket.on(
        "checkRoom",
        (code)=>{


            if(rooms[code]){


                socket.emit(
                    "roomAvailable"
                );


            }
            else{


                socket.emit(
                    "joinError",
                    "없는 방입니다."
                );


            }


        }
    );










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




            let count =
            Object.keys(
                rooms[code].players
            ).length;



            if(count >= 10){


                socket.emit(
                    "joinError",
                    "방이 가득 찼습니다."
                );


                return;


            }






            socket.join(code);


            socket.room=code;





            rooms[code].players[socket.id]={



                x:350,

                y:250,


                name:
                data.name || "Player",


                id:socket.id,


                owner:false


            };





            io.to(code).emit(
                "players",
                rooms[code].players
            );



        }
    );









    // ======================
    // 이동
    // ======================


    socket.on(
        "move",
        (pos)=>{


            let room =
            socket.room;



            if(!room || !rooms[room])
                return;



            let player =
            rooms[room]
            .players[socket.id];



            if(player){


                player.x =
                pos.x;


                player.y =
                pos.y;


            }





            io.to(room).emit(
                "players",
                rooms[room].players
            );



        }
    );









    // ======================
    // 채팅
    // ======================


    socket.on(
        "chat",
        (text)=>{


            let room =
            socket.room;



            if(!room || !rooms[room])
                return;





            let player =
            rooms[room]
            .players[socket.id];




            if(player){



                io.to(room).emit(

                    "chat",

                    {

                        name:
                        player.name,


                        text:text

                    }

                );


            }



        }
    );









    // ======================
    // 접속 종료
    // ======================


    socket.on(
        "disconnect",
        ()=>{


            let room =
            socket.room;



            if(!room || !rooms[room])
                return;





            // 방장 종료
            if(
                rooms[room].owner === socket.id
            ){



                io.to(room).emit(
                    "roomClosed"
                );



                delete rooms[room];



                return;


            }





            // 친구만 제거


            delete rooms[room]
            .players[socket.id];





            io.to(room).emit(
                "players",
                rooms[room].players
            );



        }
    );



});







const PORT =
process.env.PORT || 3000;



server.listen(
    PORT,
    ()=>{


        console.log(
            "PixelTown Server Start : "
            + PORT
        );


    }
);