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
    x: 350,
    y: 250,
    speed: 3,
    vy: 0,
    isJumping: false
};

let players = {};
let keys = {};

// 채팅 데이터
let bubbles = {};
let sideBubbles = [];

// ======================
// 아바타 캐릭터 정의 및 선택 관리
// ======================
let selectedAvatarIndex = 0;
const avatarList = [
    { name: "비치 보이", prefix: "beachboy" },
    { name: "비치 걸", prefix: "beachgirl" },
    { name: "강아지", prefix: "dog" }
];

let animationImages = {
    front: [],
    back: [],
    left: [],
    right: []
};

// 캐릭터 이미지 로드 함수 (선택된 아바타 기준)
function loadAvatarImages(prefix) {
    animationImages = { front: [], back: [], left: [], right: [] };
    
    // 명시된 매핑: W=front, S=back, D=lside(왼쪽), A=rside(오른쪽)
    let animationFiles = {
        front: [`${prefix}.front.png`],
        back: [`${prefix}.back.png`],
        left: [`${prefix}.lside.png`],
        right: [`${prefix}.rside.png`]
    };

    for(let dir in animationFiles){
        animationFiles[dir].forEach(file=>{
            let img = new Image();
            img.src = "./assets/" + file;
            animationImages[dir].push(img);
        });
    }
}

// 초기 기본 아바타 로드
loadAvatarImages(avatarList[0].prefix);

let lastDirection = "front";

// ======================
// 아바타 선택 UI 컨트롤
// ======================
window.prevAvatar = function() {
    selectedAvatarIndex = (selectedAvatarIndex - 1 + avatarList.length) % avatarList.length;
    updateAvatarSelectUI();
};

window.nextAvatar = function() {
    selectedAvatarIndex = (selectedAvatarIndex + 1) % avatarList.length;
    updateAvatarSelectUI();
};

function updateAvatarSelectUI() {
    let avatar = avatarList[selectedAvatarIndex];
    let imgTag = document.getElementById("selectedAvatar");
    if(imgTag) {
        imgTag.src = `./assets/${avatar.prefix}.front.png`;
    }
    let nameTag = document.querySelector(".avatarName");
    if(nameTag) {
        nameTag.innerText = avatar.name;
    }
    loadAvatarImages(avatar.prefix);
}

// ======================
// 배경
// ======================
let mapImage = new Image();
mapImage.src = "./assets/beach.png";

// ======================
// 서버 연결 확인
// ======================
socket.on("connect",()=>{
    console.log("서버 연결", socket.id);
});

// ======================
// 방 만들기
// ======================
window.createRoom = function(){
    socket.emit("createRoom",{
        name: "Player"
    });
};

socket.off("roomCreated");
socket.on("roomCreated",(code)=>{
    roomCode = code;
    const roomText = document.getElementById("myRoomCode");
    if(roomText){
        roomText.innerHTML = "내 방 코드 : " + code;
    }
    const inviteInput = document.getElementById("inviteCode");
    if(inviteInput) {
        inviteInput.value = code;
    }
});

// ======================
// 방 입장
// ======================
window.joinRoom = function(){
    roomCode = document.getElementById("inviteCode").value.trim();
    if(roomCode === ""){
        alert("코드를 입력하세요");
        return;
    }
    const select = document.getElementById("characterSelect");
    if(select){
        select.style.display = "block";
    }
};

// ======================
// 플레이어 받기
// ======================
socket.on("players",(data)=>{
    players = data;
});

// ======================
// 게임 시작
// ======================
window.startGame = function(){
    const nick = document.getElementById("nickname");
    nickname = nick ? nick.value.trim() : "Player";
    if(nickname === ""){
        nickname = "Player";
    }

    const login = document.getElementById("loginBox");
    if(login){
        login.style.display = "none";
    }

    const select = document.getElementById("characterSelect");
    if(select){
        select.style.display = "none";
    }

    const screen = document.getElementById("gameScreen");
    if(screen){
        screen.style.display = "block";
    }

    canvas = document.getElementById("gameCanvas");
    if(!canvas){
        console.error("canvas 없음");
        return;
    }

    ctx = canvas.getContext("2d");
    player.x = 350;
    player.y = 250;
    player.vy = 0;
    player.isJumping = false;

    if (!started) {
        started = true;
        updatePlayer();
        draw();
    }

    socket.emit("joinRoom",{
        code: roomCode,
        name: nickname,
        avatar: avatarList[selectedAvatarIndex].prefix
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
        let p = players[id];
        if(!p) continue;
        if(id === socket.id) continue;

        let pAvatar = p.avatar || "beachboy";
        let pImg = new Image();
        pImg.src = `./assets/${pAvatar}.front.png`;

        if(pImg.complete){
            ctx.drawImage(pImg, p.x, p.y - (p.jumpOffset || 0), 60, 80);
        }

        drawName(p.x, p.y - (p.jumpOffset || 0), p.name);
        drawBubble(p.x, p.y - (p.jumpOffset || 0), p.name);
    }

    // 내 캐릭터
    let myImg = animationImages[lastDirection][0];
    let renderY = player.y;
    if(myImg && myImg.complete){
        ctx.drawImage(myImg, player.x, renderY, 60, 80);
    }

    drawName(player.x, renderY, nickname);
    drawBubble(player.x, renderY, nickname);
    drawSideBubble();

    requestAnimationFrame(draw);
}

// ======================
// 이름표 (닉네임 글자 수에 맞춘 동적 박스)
// ======================
function drawName(x, y, name){
    if(!name) return;

    ctx.font = "14px Arial";
    let textMetrics = ctx.measureText(name);
    let boxWidth = Math.max(textMetrics.width + 16, 45);
    let boxX = x + (60 - boxWidth) / 2;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.roundRect(boxX, y - 35, boxWidth, 22, 6);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(name, x + 30, y - 19);
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

    ctx.font = "13px Arial";
    let textMetrics = ctx.measureText(bubble.text);
    let boxWidth = Math.max(textMetrics.width + 24, 40);
    if(boxWidth > 250) boxWidth = 250;

    let boxX = x + (60 - boxWidth) / 2;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.roundRect(boxX, y - 75, boxWidth, 32, 8);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(bubble.text, x + 30, y - 54);
    ctx.textAlign = "left";
}

// ======================
// 오른쪽 채팅 표시 (6개 제한 및 안개 효과)
// ======================
function drawSideBubble(){
    let x = canvas.width - 220;
    let y = 30;

    ctx.font = "14px Arial";

    sideBubbles.forEach((b, i)=>{
        let boxY = y + i * 60;
        let elapsed = Date.now() - b.time;
        let alpha = 1.0;
        if(elapsed > 4000) {
            alpha = (5000 - elapsed) / 1000;
            if(alpha < 0) alpha = 0;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.roundRect(x, boxY, 190, 45, 10);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.fillText(b.name, x + 10, boxY + 18);
        ctx.fillText(b.text, x + 10, boxY + 35);
        
        ctx.restore();
    });
}

// ======================
// 키 입력 (채팅 중일 때 WASD 오작동 방지 처리 포함)
// ======================
document.addEventListener("keydown",(e)=>{
    const chatInput = document.getElementById("chatInput");
    if(document.activeElement === chatInput) {
        return;
    }

    let key = e.key.toLowerCase();
    if(key === "w" || key === "a" || key === "s" || key === "d" || key === " "){
        e.preventDefault();
    }
    keys[key] = true;

    if(key === " " && !player.isJumping) {
        player.isJumping = true;
        player.vy = -8;
    }
});

document.addEventListener("keyup",(e)=>{
    const chatInput = document.getElementById("chatInput");
    if(document.activeElement === chatInput) {
        return;
    }
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener("blur",()=>{
    keys = {};
});

// ======================
// 플레이어 이동 및 충돌/점프 처리
// ======================
function updatePlayer(){
    if(!started) return;

    let moveX = 0;
    let moveY = 0;

    if(keys["w"]){ moveY = 1; lastDirection = "front"; }
    if(keys["s"]){ moveY = -1; lastDirection = "back"; }
    if(keys["d"]){ moveX = -1; lastDirection = "left"; }
    if(keys["a"]){ moveX = 1; lastDirection = "right"; }

    if(moveX !== 0 || moveY !== 0){
        let len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;

        let nextX = player.x + moveX * player.speed;
        let nextY = player.y + moveY * player.speed;

        if(nextX < 0) nextX = 0;
        if(nextY < 0) nextY = 0;
        if(nextX > canvas.width - 60) nextX = canvas.width - 60;
        if(nextY > canvas.height - 80) nextY = canvas.height - 80;

        let collision = false;
        for(let id in players){
            if(id === socket.id) continue;
            let p = players[id];
            if(!p) continue;

            if(Math.abs(nextX - p.x) < 40 && Math.abs(nextY - p.y) < 50) {
                collision = true;
                break;
            }
        }

        if(!collision) {
            player.x = nextX;
            player.y = nextY;
        }
    }

    if(player.isJumping){
        player.y += player.vy;
        player.vy += 0.5;
        if(player.y >= 250) {
            player.y = 250;
            player.isJumping = false;
            player.vy = 0;
        }
    }

    socket.emit("move",{
        x: player.x,
        y: player.y,
        avatar: avatarList[selectedAvatarIndex].prefix
    });

    requestAnimationFrame(updatePlayer);
}

// ======================
// 채팅 입력
// ======================
function setupChat(){
    const input = document.getElementById("chatInput");
    if(!input) return;

    input.onkeydown = null;

    input.onkeydown = function(e){
        if(e.key === "Enter"){
            let text = input.value.trim();
            if(text === "") return;

            bubbles[nickname] = {
                text: text,
                time: Date.now()
            };

            socket.emit("chat",{
                name: nickname,
                text: text
            });

            input.value = "";
        }
    };
}

// ======================
// 서버 채팅 받기
// ======================
socket.off("chat");
socket.on("chat",(data)=>{
    let name = "Player";
    let text = "";

    if(typeof data === "object" && data !== null){
        name = data.name || "Player";
        text = data.text || "";
    }else{
        text = data;
    }

    if(typeof text === "object"){
        text = text.text || JSON.stringify(text);
    }

    bubbles[name] = {
        text: String(text),
        time: Date.now()
    };

    sideBubbles.push({
        name: String(name),
        text: String(text),
        time: Date.now()
    });

    if(sideBubbles.length > 6){
        sideBubbles.shift();
    }

    const box = document.getElementById("messages");
    if(box){
        let div = document.createElement("div");
        div.innerText = name + " : " + text;
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

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    chatBox.onmousedown = null;

    chatBox.addEventListener("mousedown",(e)=>{
        if(e.target.id === "chatInput") return;
        dragging = true;
        let rect = chatBox.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        chatBox.style.right = "auto";
        chatBox.style.bottom = "auto";
    });

    document.addEventListener("mousemove",(e)=>{
        if(!dragging) return;
        chatBox.style.left = (e.clientX - offsetX) + "px";
        chatBox.style.top = (e.clientY - offsetY) + "px";
    });

    document.addEventListener("mouseup",()=>{
        dragging = false;
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