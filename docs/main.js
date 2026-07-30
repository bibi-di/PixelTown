console.log("PixelTown main.js 실행");

// ======================
// 서버 연결
// ======================
const socket = io("https://pixeltown-server.onrender.com");

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

// 채팅 데이터
let bubbles = {};
let sideBubbles = [];

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
    front:["tile000.png","tile001.png","tile002.png","tile003.png"],
    back:["tile004.png","tile005.png","tile006.png","tile007.png"],
    left:["tile008.png","tile009.png","tile010.png","tile011.png"],
    right:["tile012.png","tile013.png","tile014.png","tile015.png"]
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
// 서버 연결 확인
// ======================
socket.on("connect",()=>{
    console.log("서버 연결", socket.id);
});

// ======================
// 방 만들기
// ======================
window.createRoom=function(){
    socket.emit("createRoom",{
        name:"Player"
    });
};

socket.on("roomCreated",(code)=>{
    roomCode=code;
    const roomText=document.getElementById("myRoomCode");
    if(roomText){
        roomText.innerHTML="내 방 코드 : "+code;
    }
});

// ======================
// 방 입장
// ======================
window.joinRoom=function(){
    roomCode=document.getElementById("inviteCode").value.trim();
    if(roomCode===""){
        alert("코드를 입력하세요");
        return;
    }
    const select=document.getElementById("characterSelect");
    if(select){
        select.style.display="block";
    }
};

// ======================
// 플레이어 받기
// ======================
socket.on("players",(data)=>{
    players=data;
});

// ======================
// 게임 시작
// ======================
window.startGame=function(){
    const nick=document.getElementById("nickname");
    nickname = nick ? nick.value.trim() : "Player";
    if(nickname===""){
        nickname="Player";
    }

    const login=document.getElementById("loginBox");
    if(login){
        login.style.display="none";
    }

    const select=document.getElementById("characterSelect");
    if(select){
        select.style.display="none";
    }

    const screen=document.getElementById("gameScreen");
    if(screen){
        screen.style.display="block";
    }

    canvas=document.getElementById("gameCanvas");
    if(!canvas){
        console.error("canvas 없음");
        return;
    }

    ctx=canvas.getContext("2d");
    player.x=350;
    player.y=250;

    if (!started) {
        started=true;
        updatePlayer();
        draw();
    }

    socket.emit("joinRoom",{
        code:roomCode,
        name:nickname
    });

    setupChat();
    setupChatDrag();
};

// ======================
// 화면 그리기
// ======================
function draw(){
    if(!started) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경
    if(mapImage.complete){
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    }

    // 다른 플레이어
    for(let id in players){
        let p=players[id];
        if(!p) continue;

        if(id === socket.id) continue;

        let img=animationImages.front[0];
        if(img && img.complete){
            ctx.drawImage(img, p.x, p.y, 60, 80);
        }

        drawName(p.x, p.y, p.name);
        drawBubble(p.x, p.y, p.name);
    }

    // 내 캐릭터
    let myImg=animationImages[lastDirection][0];
    if(myImg && myImg.complete){
        ctx.drawImage(myImg, player.x, player.y, 60, 80);
    }

    drawName(player.x, player.y, nickname);
    drawBubble(player.x, player.y, nickname);
    drawSideBubble();

    requestAnimationFrame(draw);
}

// ======================
// 이름표 (닉네임 글자 수에 맞춘 동적 박스)
// ======================
function drawName(x, y, name){
    if(!name) return;

    ctx.font="14px Arial";
    
    let textMetrics = ctx.measureText(name);
    let boxWidth = Math.max(textMetrics.width + 16, 45);
    let boxX = x + (60 - boxWidth) / 2;

    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.roundRect(boxX, y-35, boxWidth, 22, 6);
    ctx.fill();

    ctx.fillStyle="black";
    ctx.textAlign = "center";
    ctx.fillText(name, x + 30, y-19);
    ctx.textAlign = "left"; 
}

// ======================
// 캐릭터 위 말풍선 (채팅 글자 수에 맞게 동적 조절)
// ======================
function drawBubble(x, y, name){
    let bubble = bubbles[name];
    if(!bubble) return;

    if(Date.now() - bubble.time > 5000){
        delete bubbles[name];
        return;
    }

    ctx.font="13px Arial";
    
    // 채팅 텍스트 길이에 맞춰 말풍선 너비 자동 조절 (최소 40px, 최대 250px)
    let textMetrics = ctx.measureText(bubble.text);
    let boxWidth = Math.max(textMetrics.width + 24, 40);
    if(boxWidth > 250) boxWidth = 250;

    // 캐릭터(너비 60) 중앙에 맞추어 말풍선 X 좌표 계산
    let boxX = x + (60 - boxWidth) / 2;

    // 하얀색 말풍선 배경
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.roundRect(boxX, y-75, boxWidth, 32, 8);
    ctx.fill();

    // 말풍선 텍스트 (가운데 정렬)
    ctx.fillStyle="black";
    ctx.textAlign = "center";
    ctx.fillText(bubble.text, x + 30, y-54);
    ctx.textAlign = "left";
}

// ======================
// 오른쪽 채팅 표시 (6개 제한 및 안개 효과)
// ======================
function drawSideBubble(){
    let x = canvas.width-220;
    let y = 30;

    ctx.font="14px Arial";

    sideBubbles.forEach((b,i)=>{
        let boxY = y + i * 60;
        
        let elapsed = Date.now() - b.time;
        let alpha = 1.0;
        if(elapsed > 4000) {
            alpha = (5000 - elapsed) / 1000;
            if(alpha < 0) alpha = 0;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.fillStyle="white";
        ctx.beginPath();
        ctx.roundRect(x, boxY, 190, 45, 10);
        ctx.fill();

        ctx.fillStyle="black";
        ctx.fillText(b.name, x+10, boxY+18);
        ctx.fillText(b.text, x+10, boxY+35);
        
        ctx.restore();
    });
}

// ======================
// 키 입력
// ======================
document.addEventListener("keydown",(e)=>{
    let key = e.key.toLowerCase();
    if(key==="w" || key==="a" || key==="s" || key==="d"){
        e.preventDefault();
    }
    keys[key]=true;
});

document.addEventListener("keyup",(e)=>{
    keys[e.key.toLowerCase()]=false;
});

window.addEventListener("blur",()=>{
    keys={};
});

// ======================
// 플레이어 이동
// ======================
function updatePlayer(){
    if(!started) return;

    let moveX=0;
    let moveY=0;

    if(keys["w"]){ moveY=-1; lastDirection="back"; }
    if(keys["s"]){ moveY=1; lastDirection="front"; }
    if(keys["a"]){ moveX=-1; lastDirection="left"; }
    if(keys["d"]){ moveX=1; lastDirection="right"; }

    if(moveX!==0 || moveY!==0){
        let len = Math.sqrt(moveX*moveX+moveY*moveY);
        moveX/=len;
        moveY/=len;

        player.x += moveX*player.speed;
        player.y += moveY*player.speed;

        if(player.x<0) player.x=0;
        if(player.y<0) player.y=0;
        if(player.x > canvas.width-60) player.x = canvas.width-60;
        if(player.y > canvas.height-80) player.y = canvas.height-80;

        socket.emit("move",{
            x:player.x,
            y:player.y
        });
    }

    requestAnimationFrame(updatePlayer);
}

// ======================
// 채팅 입력
// ======================
function setupChat(){
    const input = document.getElementById("chatInput");
    if(!input) return;

    input.onkeydown = null;

    input.onkeydown=function(e){
        if(e.key==="Enter"){
            let text = input.value.trim();
            if(text==="") return;

            // 내 화면에 즉시 말풍선 띄우기 추가
            bubbles[nickname] = {
                text: text,
                time: Date.now()
            };

            socket.emit("chat",{
                name:nickname,
                text:text
            });

            input.value="";
        }
    };
}

// ======================
// 서버 채팅 받기
// ======================
socket.off("chat");
socket.on("chat",(data)=>{
    let name="Player";
    let text="";

    if(typeof data === "object" && data !== null){
        name = data.name || "Player";
        text = data.text || "";
    }else{
        text=data;
    }

    if(typeof text === "object"){
        text = text.text || JSON.stringify(text);
    }

    bubbles[name]={
        text:String(text),
        time:Date.now()
    };

    sideBubbles.push({
        name:String(name),
        text:String(text),
        time:Date.now()
    });

    if(sideBubbles.length > 6){
        sideBubbles.shift();
    }

    const box = document.getElementById("messages");
    if(box){
        let div = document.createElement("div");
        div.innerText = name+" : "+text;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }
});

// ======================
// 채팅창 드래그
// ======================
function setupChatDrag(){
    const chatBox = document.getElementById("chatBox");
    if(!chatBox) return;

    let dragging=false;
    let offsetX=0;
    let offsetY=0;

    chatBox.onmousedown = null;

    chatBox.addEventListener("mousedown",(e)=>{
        if(e.target.id==="chatInput") return;
        dragging=true;
        let rect = chatBox.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        chatBox.style.right="auto";
        chatBox.style.bottom="auto";
    });

    document.addEventListener("mousemove",(e)=>{
        if(!dragging) return;
        chatBox.style.left = (e.clientX-offsetX)+"px";
        chatBox.style.top = (e.clientY-offsetY)+"px";
    });

    document.addEventListener("mouseup",()=>{
        dragging=false;
    });
}

// ======================
// 입장 오류
// ======================
socket.off("joinError");
socket.on("joinError",(msg)=>{
    alert(msg);
    window.location.reload();
});

console.log("PixelTown main.js 완료");