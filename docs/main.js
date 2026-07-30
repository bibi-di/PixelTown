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




// ======================
// 이미지
// ======================

let mapImage = new Image();

mapImage.src="./assets/map.png";



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

        alert(
            "코드를 입력하세요"
        );

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
// 플레이어 받기
// ======================

socket.on(
"players",
(data)=>{

    players=data;

});
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



    // ======================
    // 맵
    // ======================

    if(mapImage.complete){

        ctx.drawImage(
            mapImage,
            0,
            0,
            800,
            600
        );

    }





    // ======================
    // 플레이어
    // ======================

    for(let id in players){


        let p = players[id];



        let img =
        id === socket.id
        ?
        myImage
        :
        images.front;




        // 캐릭터

        ctx.drawImage(

            img,

            p.x,

            p.y,

            60,

            80

        );





        // ======================
        // 닉네임 카드
        // ======================


        ctx.font =
        "bold 13px Arial";



        let nameWidth =
        ctx.measureText(
            p.name
        ).width + 35;



        let nameX =
        p.x + 30 - nameWidth / 2;



        let nameY =
        p.y - 50;





        ctx.fillStyle =
        "white";



        ctx.beginPath();


        ctx.roundRect(

            nameX,

            nameY,

            nameWidth,

            26,

            15

        );


        ctx.fill();




        ctx.fillStyle =
        "black";


        ctx.textAlign =
        "center";



        ctx.fillText(

            p.name,

            p.x + 30,

            nameY + 18

        );







        // ======================
        // 말풍선
        // ======================


        let bubble =
        chatBubbles[p.name];



        if(
            bubble &&
            Date.now() - bubble.time < 5000
        ){



            ctx.font =
            "13px Arial";



            let bubbleWidth =
            ctx.measureText(
                bubble.text
            ).width + 45;



            if(bubbleWidth < 80){

                bubbleWidth = 80;

            }





            let bubbleX =
            p.x + 30 - bubbleWidth / 2;



            let bubbleY =
            p.y - 95;





            ctx.fillStyle =
            "white";



            ctx.beginPath();


            ctx.roundRect(

                bubbleX,

                bubbleY,

                bubbleWidth,

                36,

                18

            );


            ctx.fill();





            // 말풍선 꼬리

            ctx.beginPath();


            ctx.moveTo(

                p.x + 30,

                bubbleY + 36

            );


            ctx.lineTo(

                p.x + 20,

                bubbleY + 48

            );


            ctx.lineTo(

                p.x + 40,

                bubbleY + 36

            );


            ctx.fill();






            ctx.fillStyle =
            "black";


            ctx.textAlign =
            "center";



            ctx.fillText(

                bubble.text,

                p.x + 30,

                bubbleY + 23

            );


        }



        ctx.textAlign =
        "left";


    }



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



    if(
        document.activeElement &&
        document.activeElement.id === "chatInput"
    )
        return;





    if(e.key==="w"){

        player.y -= player.speed;

        myImage = images.back;

    }



    if(e.key==="s"){

        player.y += player.speed;

        myImage = images.front;

    }



    if(e.key==="a"){

        player.x -= player.speed;

        myImage = images.left;

    }



    if(e.key==="d"){

        player.x += player.speed;

        myImage = images.right;

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
// 채팅 설정
// ======================

function setupChat(){


    const input =
    document.getElementById(
        "chatInput"
    );



    if(!input){

        console.log(
            "chatInput 없음"
        );

        return;

    }




    input.onkeydown=function(e){


        if(e.key==="Enter"){


            e.preventDefault();



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








// ======================
// 채팅 받기
// ======================

socket.on(
"chat",
(data)=>{



    console.log(
        "채팅 수신",
        data
    );



    // 채팅창 출력

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



        box.appendChild(
            div
        );



        box.scrollTop =
        box.scrollHeight;


    }






    // ======================
    // 머리 위 말풍선 저장
    // ======================


    chatBubbles[data.name]={


        text:data.text,


        time:Date.now()


    };



});








// ======================
// 이미지 확인
// ======================

mapImage.onload=function(){

    console.log(
        "맵 로딩 완료"
    );

};



images.front.onload=function(){

    console.log(
        "캐릭터 로딩 완료"
    );

};





console.log(
    "main.js 로딩 완료"
);
// ======================
// 아바타 선택
// ======================


let avatarList = [

    "./assets/tile000.png"

];


let avatarIndex = 0;



window.nextAvatar=function(){


    avatarIndex++;


    if(
        avatarIndex >= avatarList.length
    ){

        avatarIndex = 0;

    }


    updateAvatar();


};





window.prevAvatar=function(){


    avatarIndex--;


    if(
        avatarIndex < 0
    ){

        avatarIndex =
        avatarList.length - 1;

    }


    updateAvatar();


};






function updateAvatar(){


    document.getElementById(
        "selectedAvatar"
    )
    .src =
    avatarList[avatarIndex];



    document.getElementById(
        "avatarNumber"
    )
    .innerText =
    (avatarIndex+1)
    +" / "
    +avatarList.length;


}