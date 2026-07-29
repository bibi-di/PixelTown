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


// 이미지 선언
let images={

    front:new Image(),
    back:new Image(),
    left:new Image(),
    right:new Image()

};


let mapImage=new Image();


mapImage.src="./assets/map.png";


images.front.src="./assets/female.front.png";
images.back.src="./assets/female.back.png";
images.left.src="./assets/female.left.png";
images.right.src="./assets/female.right.png";


let myImage=images.front;
