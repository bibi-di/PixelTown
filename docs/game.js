const socket = io("https://pixeltown-server.onrender.com");


let canvas;
let ctx;

let started=false;

let roomCode="";

let nickname="";


let player={
    x:350,
    y:250,
    speed:5
};


let players={};



let mapImage=new Image();

mapImage.src="./assets/map.png";



let images={

front:new Image(),
back:new Image(),
left:new Image(),
right:new Image()

};



images.front.src="./assets/female.front.png";
images.back.src="./assets/female.back.png";
images.left.src="./assets/female.left.png";
images.right.src="./assets/female.right.png";


let myImage=images.front;



// =================
// 방 만들기
// =================

function createRoom(){

console.log("create room");

socket.emit("createRoom");

}



socket.on("roomCreated",(code)=>{


roomCode=code;


document.getElementById("myRoomCode").innerHTML=
"방 코드 : "+code;


});




// =================
// 입장
// =================

function joinRoom(){


roomCode=
document.getElementById("inviteCode").value;


if(roomCode===""){

alert("코드 입력");

return;

}


document.getElementById("characterSelect")
.style.display="block";


}




// =================
// 시작
// =================


function startGame(){


nickname=
document.getElementById("nickname").value;


if(nickname==="")
nickname="익명";



document.getElementById("loginBox")
.style.display="none";


document.getElementById("characterSelect")
.style.display="none";


document.getElementById("gameScreen")
.style.display="block";



canvas=
document.getElementById("gameCanvas");


ctx=
canvas.getContext("2d");


started=true;



socket.emit("joinRoom",{


code:roomCode,

name:nickname


});



draw();


}




// =================
// 플레이어 받기
// =================


socket.on("players",(data)=>{


players=data;


});






// =================
// 화면
// =================

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

if(
mapImage.complete &&
mapImage.naturalWidth>0
){


ctx.drawImage(

mapImage,

0,

0,

800,

600

);


}
else{


ctx.fillStyle="black";

ctx.fillRect(
0,
0,
800,
600
);


}





// 캐릭터


for(let id in players){


let p=players[id];


let img=
id===socket.id
?
myImage
:
images.front;



if(
img.complete &&
img.naturalWidth>0
){


ctx.drawImage(

img,

p.x,

p.y,

60,

80

);


}



ctx.fillStyle="white";

ctx.font="14px Arial";

ctx.textAlign="center";


ctx.fillText(

p.name,

p.x+30,

p.y-10

);



}



requestAnimationFrame(draw);


}




// =================
// 이동
// =================


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