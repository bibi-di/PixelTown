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
// 애니메이션
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
// 서버 연결 확인
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
// 플레이어 데이터
// ======================

socket.on(
"players",
(data)=>{


    players=data;


});
// ======================
// 아바타 선택
// ======================

window.nextAvatar=function(){


    avatarIndex++;


    if(avatarIndex >= avatarList.length){

        avatarIndex=0;

    }


    updateAvatar();


};



window.prevAvatar=function(){


    avatarIndex--;


    if(avatarIndex < 0){

        avatarIndex =
        avatarList.length-1;

    }


    updateAvatar();


};





function updateAvatar(){


    document.getElementById(
        "selectedAvatar"
    ).src =
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
    // 닉네임
    // ======================


    ctx.font="14px Arial";


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


    ctx.textAlign="center";


    ctx.fillText(

        nickname,

        player.x + 30,

        player.y - 18

    );





    // ======================
    // 채팅 표시
    // ======================


    let chatX=650;

    let chatY=40;



    ctx.textAlign="left";



    sideMessages.forEach((msg,index)=>{


        ctx.fillStyle=
        "rgba(255,255,255,0.9)";



        ctx.beginPath();



        ctx.roundRect(

            chatX,

            chatY+index*55,

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


    let key =
    e.key.toLowerCase();



    if(
        key==="w" ||
        key==="a" ||
        key==="s" ||
        key==="d"
    ){

        e.preventDefault();

    }



    keys[key]=true;



});




document.addEventListener(
"keyup",
(e)=>{


    keys[e.key.toLowerCase()]=false;


});





window.addEventListener(
"blur",
()=>{


    keys={};


});






// ======================
// 플레이어 이동
// ======================

function updatePlayer(){


    if(!started){


        requestAnimationFrame(updatePlayer);

        return;


    }





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






    isMoving=false;





    if(moveX!==0 || moveY!==0){



        let length =
        Math.sqrt(
            moveX*moveX+
            moveY*moveY
        );



        moveX/=length;

        moveY/=length;





        player.x +=
        moveX * player.speed;



        player.y +=
        moveY * player.speed;





        isMoving=true;


    }







    // ======================
    // 맵 밖 제한
    // ======================


    const mapWidth=800;

    const mapHeight=600;

    const characterWidth=60;

    const characterHeight=80;



    if(player.x < 0)

        player.x=0;



    if(player.x > mapWidth-characterWidth)

        player.x =
        mapWidth-characterWidth;




    if(player.y < 0)

        player.y=0;



    if(player.y > mapHeight-characterHeight)

        player.y =
        mapHeight-characterHeight;





    // 서버 이동 전송


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
// 다른 플레이어 충돌
// ======================

function checkPlayerCollision(){


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
            dx*dx +
            dy*dy
        );



        if(
            distance < playerRadius &&
            distance > 0
        ){


            let overlap =
            playerRadius-distance;



            player.x +=
            (dx/distance) *
            overlap *
            0.5;



            player.y +=
            (dy/distance) *
            overlap *
            0.5;


        }


    }


}





// ======================
// 기존 이동 함수에 충돌 적용
// ======================

// 60fps마다 충돌 체크
setInterval(()=>{

    if(started){

        checkPlayerCollision();

    }

},16);







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





// ======================
// GitHub 반영용
// ======================

/*

터미널에서 실행


git add .


git commit -m "fix movement collision chat"


git push


*/


console.log(
"main.js 로드 완료"
);
socket.on(
"joinError",
(msg)=>{
    alert(msg);
});
// ======================
// 채팅창 드래그 이동
// ======================

const chatBox = document.getElementById("chatBox");


let isDragging = false;

let offsetX = 0;
let offsetY = 0;



if(chatBox){


    chatBox.addEventListener(
        "mousedown",
        function(e){


            // 입력창 클릭은 제외
            if(e.target.id==="chatInput")
                return;



            isDragging=true;


            let rect =
            chatBox.getBoundingClientRect();



            offsetX =
            e.clientX - rect.left;


            offsetY =
            e.clientY - rect.top;



            chatBox.style.right="auto";
            chatBox.style.bottom="auto";


        }
    );




    document.addEventListener(
        "mousemove",
        function(e){


            if(!isDragging)
                return;



            chatBox.style.left =
            (e.clientX-offsetX)+"px";



            chatBox.style.top =
            (e.clientY-offsetY)+"px";


        }
    );





    document.addEventListener(
        "mouseup",
        function(){


            isDragging=false;


        }
    );


}