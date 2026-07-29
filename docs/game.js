const socket = io("https://pixeltown-server.onrender.com");


// =====================
// 기본
// =====================

let canvas;
let ctx;

let started = false;

let roomCode = "";
let nickname = "";


let player = {

    x:350,
    y:250,
    speed:5

};


let players = {};

let chatBubbles = {};



// =====================
// 이미지
// =====================


let mapImage = new Image();

mapImage.src="/PixelTown/assets/map.png";


images.front.src="/PixelTown/assets/female.front.png";
images.back.src="/PixelTown/assets/female.back.png";
images.left.src="/PixelTown/assets/female.left.png";
images.right.src="/PixelTown/assets/female.right.png";



images.front.src="/PixelTown/assets/female.front.png";
images.back.src="/PixelTown/assets/female.back.png";
images.left.src="/PixelTown/assets/female.left.png";
images.right.src="/PixelTown/assets/female.right.png";



let myImage = images.front;





// =====================
// 방 만들기
// =====================


function createRoom(){

    socket.emit("createRoom");

}



socket.on(
"roomCreated",
(code)=>{


    roomCode=code;


    document.getElementById(
        "myRoomCode"
    ).innerHTML=

    "내 초대 코드 : "+code;


});









// =====================
// 방 입장
// =====================


function joinRoom(){


    roomCode =
    document.getElementById(
        "inviteCode"
    ).value;


    if(roomCode===""){

        alert("코드를 입력하세요");

        return;

    }



    document.getElementById(
        "characterSelect"
    ).style.display="block";


}









// =====================
// 게임 시작
// =====================


function startGame(){


    nickname =
    document.getElementById(
        "nickname"
    ).value;



    if(nickname===""){

        nickname="익명";

    }




    document.getElementById(
        "loginBox"
    ).style.display="none";



    document.getElementById(
        "characterSelect"
    ).style.display="none";



    document.getElementById(
        "gameScreen"
    ).style.display="flex";





    canvas =
    document.getElementById(
        "gameCanvas"
    );


    ctx =
    canvas.getContext(
        "2d"
    );



    started=true;



    socket.emit(

        "joinRoom",

        {

            code:roomCode,

            name:nickname

        }

    );



    draw();

}









// =====================
// 플레이어 데이터
// =====================


socket.on(

"players",

(data)=>{


    players=data;


});









// =====================
// 화면 그리기
// =====================


function draw(){


    if(!started || !ctx)
    return;




    ctx.clearRect(

        0,

        0,

        800,

        600

    );





    // 맵


    if(mapImage.complete){


        ctx.drawImage(

            mapImage,

            0,

            0,

            800,

            600

        );


    }






    // 캐릭터


    for(let id in players){



        let p =
        players[id];




        let img =
        id===socket.id
        ?
        myImage
        :
        images.front;




        ctx.drawImage(

            img,

            p.x,

            p.y,

            60,

            80

        );







        // =================
        // 닉네임
        // =================


        ctx.font="12px Arial";


        let nameWidth =
        ctx.measureText(
            p.name
        ).width + 24;



        ctx.fillStyle="white";


        ctx.beginPath();


        ctx.roundRect(

            p.x+30-nameWidth/2,

            p.y-35,

            nameWidth,

            20,

            10

        );


        ctx.fill();




        ctx.fillStyle="black";


        ctx.textAlign="center";


        ctx.fillText(

            p.name,

            p.x+30,

            p.y-21

        );






        // =================
        // 말풍선
        // =================


        let bubble =
        chatBubbles[p.name];



        if(
            bubble &&
            Date.now()-bubble.time < 5000
        ){



            ctx.font="13px Arial";


            let bubbleWidth =
            ctx.measureText(
                bubble.text
            ).width+35;




            if(bubbleWidth>200){

                bubbleWidth=200;

            }





            ctx.fillStyle="white";


            ctx.beginPath();


            ctx.roundRect(

                p.x+30-bubbleWidth/2,

                p.y-85,

                bubbleWidth,

                35,

                18

            );


            ctx.fill();





            ctx.fillStyle="black";


            ctx.textAlign="center";


            ctx.fillText(

                bubble.text,

                p.x+30,

                p.y-63

            );



        }



        ctx.textAlign="left";



    }



    requestAnimationFrame(draw);


}









// =====================
// 이동
// =====================


document.addEventListener(

"keydown",

(e)=>{


    if(!started)
    return;



    if(
    document.activeElement.id==="chatInput"
    )
    return;




    if(e.key==="w"){

        player.y-=player.speed;

        myImage=images.back;

    }



    if(e.key==="s"){

        player.y+=player.speed;

        myImage=images.front;

    }



    if(e.key==="a"){

        player.x-=player.speed;

        myImage=images.left;

    }



    if(e.key==="d"){

        player.x+=player.speed;

        myImage=images.right;

    }




    socket.emit(

        "move",

        {

            x:player.x,

            y:player.y

        }

    );


});









// =====================
// 채팅 입력
// =====================


document.addEventListener(

"keydown",

(e)=>{


    if(e.key==="Enter"){


        let input =
        document.getElementById(
            "chatInput"
        );



        if(document.activeElement===input){



            if(input.value.trim()!==""){


                socket.emit(

                    "chat",

                    input.value

                );


                input.value="";


            }


        }

        else{


            input.focus();


        }


    }

});









// =====================
// 채팅 수신
// =====================


socket.on(

"chat",

(data)=>{


    let box =
    document.getElementById(
        "messages"
    );



    let div =
    document.createElement(
        "div"
    );



    div.innerHTML=

    data.name+
    " : "+
    data.text;



    box.appendChild(div);




    while(box.children.length>5){


        box.removeChild(
            box.firstChild
        );


    }




    chatBubbles[data.name]={

        text:data.text,

        time:Date.now()

    };



});