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
    speed:3,
    vx:0,
    vy:0

};


let players = {};
let chatBubbles = {};
let sideMessages = [];
let playerRadius = 35;

// ======================
// 키
// ======================

let keys = {};


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


let avatarIndex = 0;


// ======================
// 방향 애니메이션
// ======================

let lastDirection = "front";

let walkFrame = 0;

let lastWalkTime = 0;

let isMoving = false;


let animationImages = {

front:[],
back:[],
right:[],
left:[]

};



let animationFiles = {


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


right:[
"tile012.png",
"tile013.png",
"tile014.png",
"tile015.png"
],


left:[
"tile008.png",
"tile009.png",
"tile010.png",
"tile011.png"
]

};



for(let dir in animationFiles){

    animationFiles[dir].forEach(file=>{

        let img = new Image();

        img.src="./assets/"+file;

        animationImages[dir].push(img);

    });

}



// ======================
// 배경
// ======================

let mapImage = new Image();

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

    roomCode = code;

    document.getElementById(
        "myRoomCode"
    ).innerHTML =
    "내 방 코드 : "+code;

});




// ======================
// 방 입장
// ======================

window.joinRoom=function(){

    roomCode =
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


    nickname =
    document.getElementById(
        "nickname"
    )
    .value
    .trim();



    if(nickname===""){

        nickname="Player";

    }



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



    setupChat();

    draw();


};




// ======================
// 플레이어
// ======================

socket.on(

"players",

(data)=>{

    players=data;

}

);




// ======================
// 아바타 선택
// ======================

window.nextAvatar=function(){

    avatarIndex++;


    if(
        avatarIndex >= avatarList.length
    ){

        avatarIndex=0;

    }


    updateAvatar();

};



window.prevAvatar=function(){

    avatarIndex--;


    if(
        avatarIndex < 0
    ){

        avatarIndex =
        avatarList.length-1;

    }


    updateAvatar();

};



function updateAvatar(){

    document.getElementById(
        "selectedAvatar"
    )
    .src =
    avatarList[avatarIndex];

}




// ======================
// 화면 그리기
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




    let img;



    if(isMoving){


        if(
        Date.now()-lastWalkTime > 120
        ){

            walkFrame++;


            if(walkFrame>=4){

                walkFrame=0;

            }


            lastWalkTime =
            Date.now();

        }


        img =
        animationImages[lastDirection][walkFrame];


    }
    else{


        walkFrame=0;


        img =
        animationImages[lastDirection][0];

    }



   ctx.drawImage(

    img,

    player.x,

    player.y,

    60,

    80

);


// ======================
// 닉네임 표시
// ======================

let nameWidth =
ctx.measureText(nickname).width + 30;


ctx.fillStyle="white";

ctx.beginPath();

ctx.roundRect(
    player.x + 30 - nameWidth/2,
    player.y - 35,
    nameWidth,
    24,
    12
);

ctx.fill();



ctx.fillStyle="black";

ctx.font="14px Arial";

ctx.textAlign="center";


ctx.fillText(

    nickname,

    player.x + 30,

    player.y - 18

);

// ======================
// 오른쪽 채팅 표시
// ======================


let chatX = 650;
let chatY = 40;


ctx.textAlign="left";


sideMessages.forEach((msg,index)=>{


ctx.fillStyle="rgba(255,255,255,0.9)";


ctx.beginPath();

ctx.roundRect(

chatX,

chatY + index*55,

130,

45,

15

);

ctx.fill();



ctx.fillStyle="black";

ctx.font="13px Arial";


ctx.fillText(

msg.name,

chatX+10,

chatY+18+index*55

);



ctx.fillText(

msg.text,

chatX+10,

chatY+35+index*55

);



});


    requestAnimationFrame(draw);

}
// ======================
// 키 입력
// ======================

document.addEventListener(
"keydown",
(e)=>{

    keys[e.key.toLowerCase()] = true;

});


document.addEventListener(
"keyup",
(e)=>{

    keys[e.key.toLowerCase()] = false;

});




// ======================
// 플레이어 이동
// ======================

function updatePlayer(){


    if(!started){

        requestAnimationFrame(updatePlayer);

        return;

    }



    let moveX = 0;
    let moveY = 0;



    if(keys["w"]){

        moveY = -1;
        lastDirection="back";

    }


    if(keys["s"]){

        moveY = 1;
        lastDirection="front";

    }


    if(keys["a"]){

        moveX = -1;
        lastDirection="left";

    }


    if(keys["d"]){

        moveX = 1;
        lastDirection="right";

    }



    // 이동 입력 있을 때만 이동
    if(moveX !== 0 || moveY !==0){


        let length =
        Math.sqrt(
            moveX*moveX +
            moveY*moveY
        );


        moveX /= length;
        moveY /= length;



        player.vx = moveX * player.speed;
        player.vy = moveY * player.speed;


        isMoving=true;


    }
    else{


        // 키 떼면 즉시 정지
        player.vx = 0;
        player.vy = 0;


        isMoving=false;

        walkFrame=0;


    }



    player.x += player.vx;
    player.y += player.vy;



    // 다른 캐릭터 충돌
    for(let id in players){

        if(id===socket.id)
        continue;


        let other = players[id];


        let dx =
        player.x - other.x;


        let dy =
        player.y - other.y;



        let distance =
        Math.sqrt(
            dx*dx+
            dy*dy
        );



        if(distance < playerRadius){


            if(distance !==0){


                let push =
                playerRadius-distance;


                player.x +=
                (dx/distance)*push;


                player.y +=
                (dy/distance)*push;


            }

        }

    }



    if(isMoving){


        socket.emit(

            "move",

            {

                x:player.x,

                y:player.y

            }

        );


    }



    requestAnimationFrame(updatePlayer);


}



updatePlayer();


    isMoving=false;





let moveX=0;
let moveY=0;



if(keys["w"]){

    moveY=-1;
    lastDirection="back";

}


if(keys["s"]){

    moveY=1;
    lastDirection="front";

}


if(keys["a"]){

    moveX=-1;
    lastDirection="left";

}


if(keys["d"]){

    moveX=1;
    lastDirection="right";

}




if(moveX !== 0 || moveY !== 0){


    let length =
    Math.sqrt(
        moveX*moveX +
        moveY*moveY
    );


    moveX /= length;
    moveY /= length;



    player.x = Math.round(player.x + moveX * player.speed);

player.y = Math.round(player.y + moveY * player.speed);


    isMoving=true;



    if(lastDirection){

        if(walkFrame >= 4){

            walkFrame=0;

        }

    }


}
else{


    isMoving=false;
walkFrame=0;

}

// ======================
// 캐릭터 충돌
// ======================


for(let id in players){
if(id === socket.id)
continue;

let other = players[id];


let dx =
player.x - other.x;


let dy =
player.y - other.y;


let distance =
Math.sqrt(
dx*dx + dy*dy
);



if(distance < playerRadius){


    let overlap =
    playerRadius - distance;


    if(distance !== 0){

        player.x +=
        (dx / distance) * overlap * 0.5;


        player.y +=
        (dy / distance) * overlap * 0.5;

    }


}


    if(isMoving){


        socket.emit(

            "move",

            {

                x:player.x,

                y:player.y

            }

        );


    }



    requestAnimationFrame(updatePlayer);


}



updatePlayer();





// ======================
// 채팅
// ======================

function setupChat(){


    const input =
    document.getElementById(
        "chatInput"
    );


    if(!input)
    return;



    input.onkeydown=function(e){



        if(e.key==="Enter"){



            let text =
            input.value.trim();



            if(text==="")
            return;



            socket.emit(
                "chat",
                text
            );


            input.value="";


        }


    };


}




socket.on(

"chat",

(data)=>{


    const box =
    document.getElementById(
        "messages"
    );



    if(box){


        let div =
        document.createElement(
            "div"
        );


        div.innerText =
        data.name+
        " : "+
        data.text;



        box.appendChild(div);



        box.scrollTop =
        box.scrollHeight;


    }




    sideMessages.push({

name:data.name,

text:data.text,

time:Date.now()

});


if(sideMessages.length > 8){

sideMessages.shift();

}


});