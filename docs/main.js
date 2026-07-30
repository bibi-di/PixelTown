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
    speed:5

};



let players = {};

let chatBubbles = {};
let walkOffset = 0;
let isMoving = false;


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


let selectedAvatar =
avatarList[0];



// ======================
// 이미지
// ======================


let mapImage = new Image();

mapImage.src =
"./assets/office.png";



let myImage = new Image();

myImage.src =
selectedAvatar;



let otherImage = new Image();

otherImage.src =
"./assets/tile000.png";





// ======================
// 서버 연결
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
)
.innerHTML =
"내 방 코드 : "+code;


}

);








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


alert(
"코드를 입력하세요"
);


return;


}



document.getElementById(
"characterSelect"
)
.style.display =
"block";

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
selectedAvatar =
avatarList[avatarIndex];


myImage.src =
selectedAvatar;


if(nickname===""){

nickname="Player";

}





document.getElementById(
"loginBox"
)
.style.display =
"none";



document.getElementById(
"characterSelect"
)
.style.display =
"none";



document.getElementById(
"gameScreen"
)
.style.display =
"block";





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
// ======================
// 채팅 설정
// ======================

function setupChat(){

    const input =
    document.getElementById(
        "chatInput"
    );


    if(!input){
        return;
    }



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

};






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
// 아바타 선택
// ======================

window.nextAvatar=function(){

    avatarIndex++;

    if(avatarIndex >= avatarList.length){

        avatarIndex = 0;

    }


    updateAvatar();

};



window.prevAvatar=function(){

    avatarIndex--;

    if(avatarIndex < 0){

        avatarIndex = avatarList.length - 1;

    }


    updateAvatar();

};





function updateAvatar(){


    let img =
    document.getElementById(
        "selectedAvatar"
    );


    img.src =
    avatarList[avatarIndex];



    document.getElementById(
        "avatarNumber"
    ).innerText =
    (avatarIndex + 1)
    + " / "
    + avatarList.length;


}
console.log("아바타 함수 등록 완료", typeof nextAvatar);
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


    // 배경

    if(mapImage.complete){

        ctx.drawImage(
            mapImage,
            0,
            0,
            800,
            600
        );

    }



    // 걷기 효과

    let offset = 0;


    if(isMoving){

        walkOffset += 0.3;

        offset =
        Math.sin(walkOffset) * 3;

    }



    // 내 캐릭터

    ctx.drawImage(

        myImage,

        player.x,

        player.y + offset,

        60,

        80

    );



    requestAnimationFrame(
        draw
    );

}






// ======================
// 이동
// ======================

document.addEventListener(
"keydown",
(e)=>{


    if(!started)
        return;



    isMoving=false;



    if(e.key==="w" || e.key==="ArrowUp"){

        player.y -= player.speed;

        isMoving=true;

    }



    if(e.key==="s" || e.key==="ArrowDown"){

        player.y += player.speed;

        isMoving=true;

    }



    if(e.key==="a" || e.key==="ArrowLeft"){

        player.x -= player.speed;

        isMoving=true;

    }



    if(e.key==="d" || e.key==="ArrowRight"){

        player.x += player.speed;

        isMoving=true;

    }



    socket.emit(

        "move",

        {

            x:player.x,

            y:player.y

        }

    );


});






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



}


});