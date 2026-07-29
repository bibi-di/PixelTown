console.log("main.js 실행");


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
    speed:5

};



let players = {};





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
// 연결 확인
// ======================


socket.on(
"connect",
()=>{

    console.log(
        "서버 연결 성공",
        socket.id
    );

});






// ======================
// 방 만들기
// ======================


window.createRoom=function(){


    console.log(
        "방 만들기"
    );


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


    console.log(
        "방 생성",
        code
    );


});







// ======================
// 방 입장
// ======================


window.joinRoom=function(){


    roomCode =
    document.getElementById(
        "inviteCode"
    ).value
    .trim();



    if(roomCode===""){

        alert(
            "초대 코드를 입력하세요"
        );

        return;

    }



    document.getElementById(
        "characterSelect"
    ).style.display="block";


};







// ======================
// 게임 시작
// ======================


window.startGame=function(){



    nickname =
    document.getElementById(
        "nickname"
    ).value
    .trim();



    if(nickname===""){

        nickname="Player";

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



    setupChat();


    draw();


};









// ======================
// 플레이어 수신
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
        canvas.width,
        canvas.height
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






        // 이름표


        ctx.fillStyle="white";


        ctx.fillRect(

            p.x,

            p.y-25,

            80,

            20

        );



        ctx.fillStyle="black";


        ctx.font="12px Arial";


        ctx.fillText(

            p.name,

            p.x+5,

            p.y-10

        );


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









// ======================
// 채팅
// ======================


function setupChat(){


    const input =
    document.getElementById(
        "chatInput"
    );



    if(!input){

        console.log(
            "채팅창 없음"
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









socket.on(
"chat",
(data)=>{


    console.log(
        "채팅 수신",
        data
    );



    const box =
    document.getElementById(
        "messages"
    );



    if(!box)
    return;



    const div =
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



});