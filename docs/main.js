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

let started=false;

let roomCode="";
let nickname="";


let player={

    x:350,
    y:250,
    speed:5

};


let players={};

let chatBubbles={};



// ======================
// 선택 캐릭터
// ======================


let selectedAvatar =
"./assets/tile000.png";



// ======================
// 이미지
// ======================


let mapImage=new Image();

mapImage.src="./assets/map.png";



let images={

    front:new Image(),
    back:new Image(),
    left:new Image(),
    right:new Image()

};



images.front.src=selectedAvatar;
images.back.src=selectedAvatar;
images.left.src=selectedAvatar;
images.right.src=selectedAvatar;



let myImage=images.front;





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



nickname=
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





canvas=
document.getElementById(
"gameCanvas"
);



ctx=
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


let p=players[id];



let img=
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





ctx.font=
"bold 13px Arial";



let nameWidth=
ctx.measureText(
p.name
)
.width+35;



let nameX=
p.x+30-nameWidth/2;



let nameY=
p.y-50;



ctx.fillStyle="white";



ctx.beginPath();


ctx.roundRect(

nameX,

nameY,

nameWidth,

26,

15

);


ctx.fill();



ctx.fillStyle="black";

ctx.textAlign="center";



ctx.fillText(

p.name,

p.x+30,

nameY+18

);





let bubble=
chatBubbles[p.name];



if(
bubble &&
Date.now()-bubble.time<5000
){


ctx.font="13px Arial";


ctx.fillStyle="white";


ctx.beginPath();


ctx.roundRect(

p.x-10,

p.y-95,

100,

36,

18

);


ctx.fill();


ctx.fillStyle="black";


ctx.fillText(

bubble.text,

p.x+30,

p.y-72

);


}



ctx.textAlign="left";


}



requestAnimationFrame(
draw
);


}// ======================
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


myImage.src=
selectedAvatar;


}



if(e.key==="s"){


player.y+=player.speed;


myImage.src=
selectedAvatar;


}



if(e.key==="a"){


player.x-=player.speed;


myImage.src=
selectedAvatar;


}



if(e.key==="d"){


player.x+=player.speed;


myImage.src=
selectedAvatar;


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


const input=
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



let text=
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




const box=
document.getElementById(
"messages"
);



if(box){


let div=
document.createElement(
"div"
);



div.innerText=

data.name+
" : "+
data.text;



box.appendChild(
div
);



box.scrollTop=
box.scrollHeight;


}





chatBubbles[data.name]={


text:data.text,


time:Date.now()


};



});








// ======================
// 아바타 선택 시스템
// ======================


let avatarList=[


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





window.nextAvatar=function(){



avatarIndex++;



if(
avatarIndex>=avatarList.length
){


avatarIndex=0;


}



updateAvatar();


};







window.prevAvatar=function(){



avatarIndex--;



if(
avatarIndex<0
){


avatarIndex=
avatarList.length-1;


}



updateAvatar();


};







function updateAvatar(){



let img=
document.getElementById(
"selectedAvatar"
);



if(img){


img.src=
avatarList[avatarIndex];


}



let number=
document.getElementById(
"avatarNumber"
);



if(number){


number.innerText=

(avatarIndex+1)
+
" / "
+
avatarList.length;


}





// 선택한 캐릭터 저장


selectedAvatar=
avatarList[avatarIndex];



// 게임용 이미지 변경


images.front.src=
selectedAvatar;


images.back.src=
selectedAvatar;


images.left.src=
selectedAvatar;


images.right.src=
selectedAvatar;



}





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