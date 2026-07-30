console.log("main.js 실행");


// ======================
// 서버 연결
// ======================

const socket = io(
    "https://pixeltown-server.onrender.com"
);


// ======================
// 변수
// ======================

let canvas;
let ctx;

let started = false;

let roomCode = "";
let nickname = "";


let player = {

    x:350,
    y:250,

    speed:3

};


let players = {};

let keys = {};

let sideMessages = [];

let playerRadius = 35;



// ======================
// 아바타
// ======================

let avatarList = [

"./assets/tile000.png",
"./assets/tile001.png",
"./assets/tile002.png",
"./assets/tile003.png",
"./assets/tile004.png",
"./assets/tile005.png",
"./assets/tile006.png",
"./assets/tile007.png",
"./assets/tile008.png",
"./assets/tile009.png",
"./assets/tile010.png",
"./assets/tile011.png",
"./assets/tile012.png",
"./assets/tile013.png",
"./assets/tile014.png",
"./assets/tile015.png"

];


let avatarIndex=0;



// ======================
// 애니메이션
// ======================

let lastDirection="front";

let walkFrame=0;

let lastWalkTime=0;

let isMoving=false;



let animationImages={

    front:[],
    back:[],
    left:[],
    right:[]

};



let animationFiles={


front:[

"tile000.png",
"tile001.png",
"tile002.png",
"tile003.png"

],


back:[

"tile004.png",
"tile005.png",
"tile006.png",
"tile007.png"

],


left:[

"tile008.png",
"tile009.png",
"tile010.png",
"tile011.png"

],


right:[

"tile012.png",
"tile013.png",
"tile014.png",
"tile015.png"

]


};



for(let dir in animationFiles){


    animationFiles[dir].forEach(file=>{


        let img=new Image();

        img.src="./assets/"+file;

        animationImages[dir].push(img);


    });


}



// ======================
// 맵
// ======================

let mapImage=new Image();

mapImage.src="./assets/office.png";




// ======================
// 연결
// ======================

socket.on(
"connect",
()=>{

    console.log(
        "서버 연결",
        socket.id
    );

});




// ======================
// 방 만들기
// ======================

window.createRoom=function(){


    socket.emit(
        "createRoom",
        {
            name:"Player"
        }
    );


};



socket.on(
"roomCreated",
(code)=>{


    roomCode=code;


    document.getElementById(
        "myRoomCode"
    ).innerHTML=
    "내 방 코드 : "+code;


});




// ======================
// 방 입장
// ======================

window.joinRoom=function(){


    roomCode=
    document.getElementById(
        "inviteCode"
    )
    .value
    .trim();



    if(roomCode===""){

        alert("코드를 입력하세요");

        return;

    }



    document.getElementById(
        "characterSelect"
    )
    .style.display="block";


};




// ======================
// 게임 시작
// ======================

window.startGame=function(){


    nickname=
    document.getElementById(
        "nickname"
    )
    .value
    .trim();



    if(nickname===""){

        nickname="Player";

    }



    player.x=350;
    player.y=250;

    lastDirection="front";



    document.getElementById(
        "loginBox"
    )
    .style.display="none";



    document.getElementById(
        "characterSelect"
    )
    .style.display="none";



    document.getElementById(
        "gameScreen"
    )
    .style.display="block";



    canvas=
    document.getElementById(
        "gameCanvas"
    );


    ctx=
    canvas.getContext("2d");



    started=true;



    socket.emit(
        "joinRoom",
        {
            code:roomCode,
            name:nickname
        }
    );



    setupChat();

    setupChatDrag();

    draw();


};
