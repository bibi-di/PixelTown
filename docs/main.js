console.log("main.js 실행");


// ======================
// 서버 연결
// ======================

const socket = io("https://pixeltown-server.onrender.com");


// ======================
// 기본 변수
// ======================

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



// ======================
// 이미지
// ======================

let mapImage = new Image();

mapImage.src = "./assets/map.png";


let images = {

    front:new Image(),
    back:new Image(),
    left:new Image(),
    right:new Image()

};


images.front.src="./assets/female.front.png";
images.back.src="./assets/female.back.png";
images.left.src="./assets/female.left.png";
images.right.src="./assets/female.right.png";


let myImage = images.front;




// ======================
// 연결 확인
// ======================

socket.on("connect",()=>{

    console.log(
        "서버 연결 성공:",
        socket.id
    );

});





// ======================
// 방 만들기
// ======================


function createRoom(){

    console.log("방 만들기 클릭");


    socket.emit(
        "createRoom"
    );

}





socket.on(
    "roomCreated",
    (code)=>{


        console.log(
            "생성된 방:",
            code
        );


        roomCode = code;


        document.getElementById(
            "myRoomCode"
        ).innerHTML =
        "내 방 코드 : " + code;


    }
);







// ======================
// 방 입장
// ======================


function joinRoom(){


    roomCode =
    document.getElementById(
        "inviteCode"
    ).value.trim();



    if(roomCode===""){

        alert(
            "초대 코드를 입력하세요"
        );

        return;

    }



    document.getElementById(
        "characterSelect"
    ).style.display="block";


}







// ======================
// 게임 시작
// ======================


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
    ).style.display="block";




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







// ======================
// 플레이어 받기
// ======================


socket.on(
    "players",
    (data)=>{

        players=data;

    }
);







// ======================
// 그리기
// ======================


function draw(){


    if(!started)
    return;



    ctx.clearRect(
        0,
        0,
        800,
        600
    );



    if(mapImage.complete){

        ctx.drawImage(
            mapImage,
            0,
            0,
            800,
            600
        );

    }



    for(let id in players){


        let p = players[id];


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



        ctx.fillStyle="white";

        ctx.fillRect(
            p.x,
            p.y-20,
            80,
            20
        );



        ctx.fillStyle="black";

        ctx.font="12px Arial";


        ctx.fillText(
            p.name,
            p.x,
            p.y-5
        );


    }



    requestAnimationFrame(draw);


}







// ======================
// 이동
// ======================


document.addEventListener(
"keydown",
(e)=>{


    if(!started)
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
function createRoom(){

    console.log("방 만들기 클릭");

    socket.emit("createRoom");

}


socket.on("roomCreated",(code)=>{

    alert("방 코드 : " + code);

});
// ======================
// 방 만들기
// ======================

window.createRoom = function(){

    console.log("방 만들기 클릭");

    socket.emit("createRoom");

};



socket.on("roomCreated",(code)=>{

    console.log("방 생성:", code);

    const box = document.getElementById("myRoomCode");

    if(box){

        box.innerHTML = "내 방 코드 : " + code;

    }

});
// ======================
// 채팅 시스템
// ======================


// 채팅 보내기

const chatInput = document.getElementById("chatInput");


if(chatInput){


    chatInput.addEventListener(
        "keydown",
        function(e){


            if(e.key === "Enter"){


                let text =
                chatInput.value.trim();



                if(text === "")
                return;



                socket.emit(
                    "chat",
                    text
                );


                chatInput.value="";


            }


        }
    );


}




// 채팅 받기


socket.on(
    "chat",
    function(data){



        const messages =
        document.getElementById(
            "messages"
        );



        if(!messages)
        return;



        let div =
        document.createElement(
            "div"
        );



        div.innerHTML =
        data.name +
        " : " +
        data.text;



        messages.appendChild(
            div
        );



        // 최대 10개만 표시

        while(messages.children.length > 10){

            messages.removeChild(
                messages.firstChild
            );

        }



    }
);