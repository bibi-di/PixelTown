console.log("PixelTown main.js 실행");


// ======================
// 서버 연결
// ======================

const socket = io(
    "https://pixeltown-server.onrender.com"
);


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

    speed:3

};


let players = {};

let keys = {};


// 채팅 말풍선
let bubbles = {};


// ======================
// 이미지
// ======================

let animationImages = {

    front:[],
    back:[],
    left:[],
    right:[]

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



let lastDirection="front";



// ======================
// 배경
// ======================

let mapImage = new Image();

mapImage.src="./assets/office.png";



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


    const roomText =
    document.getElementById(
        "myRoomCode"
    );


    if(roomText){

        roomText.innerHTML =
        "내 방 코드 : "+code;

    }


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


        alert(
            "코드를 입력하세요"
        );


        return;

    }



    const select =
    document.getElementById(
        "characterSelect"
    );


    if(select){

        select.style.display="block";

    }


};





// ======================
// 서버 플레이어 받기
// ======================

socket.on(
"players",
(data)=>{


    players = data;


});




// ======================
// 게임 시작
// ======================

window.startGame=function(){


    const nick =
    document.getElementById(
        "nickname"
    );


    nickname =
    nick ?
    nick.value.trim()
    :
    "Player";



    if(nickname===""){

        nickname="Player";

    }



    const login =
    document.getElementById(
        "loginBox"
    );


    if(login){

        login.style.display="none";

    }



    const select =
    document.getElementById(
        "characterSelect"
    );


    if(select){

        select.style.display="none";

    }



    const screen =
    document.getElementById(
        "gameScreen"
    );


    if(screen){

        screen.style.display="block";

    }




    canvas =
    document.getElementById(
        "gameCanvas"
    );



    if(!canvas){

        console.error(
            "gameCanvas 없음"
        );

        return;

    }



    ctx =
    canvas.getContext(
        "2d"
    );



    player.x=350;

    player.y=250;



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
// ======================
// 화면 그리기
// ======================

function draw(){


    if(!started)
        return;



    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );



    // ======================
    // 배경
    // ======================

    if(mapImage.complete){


        ctx.drawImage(

            mapImage,

            0,

            0,

            canvas.width,

            canvas.height

        );


    }




    // ======================
    // 다른 플레이어
    // ======================

    for(let id in players){


        let p = players[id];



        // 내 캐릭터 중복 제거

        if(
            p.name === nickname
        ){

            continue;

        }



        let img =
        animationImages.front[0];



        if(
            img &&
            img.complete
        ){


            ctx.drawImage(

                img,

                p.x,

                p.y,

                60,

                80

            );


        }



        drawName(

            p.x,

            p.y,

            p.name

        );



        drawBubble(

            p.x,

            p.y,

            p.name

        );


    }





    // ======================
    // 내 캐릭터
    // ======================


    let myImg =
    animationImages[lastDirection][0];



    if(
        myImg &&
        myImg.complete
    ){


        ctx.drawImage(

            myImg,

            player.x,

            player.y,

            60,

            80

        );


    }



    drawName(

        player.x,

        player.y,

        nickname

    );



    drawBubble(

        player.x,

        player.y,

        nickname

    );



    requestAnimationFrame(
        draw
    );


}





// ======================
// 이름표
// ======================

function drawName(x,y,name){


    ctx.fillStyle="white";


    ctx.beginPath();


    ctx.roundRect(

        x,

        y-35,

        90,

        25,

        10

    );


    ctx.fill();



    ctx.fillStyle="black";

    ctx.font="14px Arial";


    ctx.fillText(

        name,

        x+10,

        y-18

    );


}





// ======================
// 말풍선
// ======================

function drawBubble(x,y,name){


    let bubble =
    bubbles[name];



    if(!bubble)
        return;



    if(
        Date.now()-bubble.time > 5000
    ){

        delete bubbles[name];

        return;

    }



    ctx.fillStyle="white";


    ctx.beginPath();


    ctx.roundRect(

        x-20,

        y-80,

        140,

        35,

        10

    );


    ctx.fill();



    ctx.fillStyle="black";

    ctx.font="13px Arial";


    ctx.fillText(

        bubble.text,

        x-10,

        y-58

    );


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


    keys[
        e.key.toLowerCase()
    ]=false;


});



window.addEventListener(
"blur",
()=>{

    keys={};

});





// ======================
// 이동
// ======================

function updatePlayer(){


    if(!started){

        requestAnimationFrame(
            updatePlayer
        );

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




    if(
        moveX!==0 ||
        moveY!==0
    ){


        let len =
        Math.sqrt(
            moveX*moveX+
            moveY*moveY
        );



        moveX/=len;

        moveY/=len;



        player.x +=
        moveX * player.speed;



        player.y +=
        moveY * player.speed;



        // 맵 제한

        if(player.x<0)
            player.x=0;


        if(player.y<0)
            player.y=0;


        if(player.x>canvas.width-60)
            player.x=canvas.width-60;


        if(player.y>canvas.height-80)
            player.y=canvas.height-80;




        socket.emit(
            "move",
            {

                x:player.x,

                y:player.y

            }
        );


    }



    requestAnimationFrame(
        updatePlayer
    );


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
                {

                    text:text,

                    name:nickname

                }
            );



            // 내 말풍선

            bubbles[nickname]={

                text:text,

                time:Date.now()

            };



            input.value="";


        }


    };


}




socket.on(
"chat",
(data)=>{


    if(
        data.name
    ){


        bubbles[data.name]={


            text:data.text,

            time:Date.now()


        };


    }


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


});






// ======================
// 채팅창 드래그
// ======================

function setupChatDrag(){


    const chatBox =
    document.getElementById(
        "chatBox"
    );



    if(!chatBox)
        return;



    let drag=false;

    let offsetX=0;

    let offsetY=0;



    chatBox.addEventListener(
        "mousedown",
        (e)=>{


            if(
                e.target.id==="chatInput"
            )
                return;



            drag=true;


            let rect =
            chatBox.getBoundingClientRect();


            offsetX =
            e.clientX-rect.left;


            offsetY =
            e.clientY-rect.top;


            chatBox.style.right="auto";

            chatBox.style.bottom="auto";


        }
    );



    document.addEventListener(
        "mousemove",
        (e)=>{


            if(!drag)
                return;



            chatBox.style.left =
            (
                e.clientX-offsetX
            )+"px";



            chatBox.style.top =
            (
                e.clientY-offsetY
            )+"px";


        }
    );



    document.addEventListener(
        "mouseup",
        ()=>{


            drag=false;


        }
    );


}





socket.on(
"joinError",
(msg)=>{

    alert(msg);

});



console.log(
    "PixelTown main.js 완료"
);