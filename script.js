// =====================================
// Hair Gacha
// script.js
// =====================================


// ------------------------------
// 페이지 관리
// ------------------------------

const pages = document.querySelectorAll(".page");

const introFrameCount = 96;
const introAnimation = document.getElementById("introAnimation");
const introFrames = [];
let introFrameIndex = 0;
const cutAnimation = document.getElementById("cutAnimation");
const cutFrameStart = 0;
const cutFrameEnd = 13;
const cutAnimationDurationMs = 1000;
const cutBlurHoldDurationMs = 5000;
let cutAnimationTimer = null;
let cutHoldTimer = null;
const scissorsSound = new Audio("sound/scissors_sound.mp3");
scissorsSound.preload = "auto";
const tadaSound = new Audio("sound/tada.mp3");
tadaSound.preload = "auto";

const partSelector = document.getElementById("partSelector");
const selectedPartText = document.getElementById("selectedPartText");
const faceBackBtn = document.getElementById("faceBack");
const hairSelector = document.getElementById("hairSelector");
const selectedHairText = document.getElementById("selectedHairText");
const backToFaceBtn = document.getElementById("backToFace");
const hairStepBackBtn = document.getElementById("hairStepBack");

// position & scale controls
const posControl = document.getElementById("positionControls");
const posY = document.getElementById("posY");
const resetPos = document.getElementById("resetPos");
const posScale = document.getElementById("posScale");
const resetScale = document.getElementById("resetScale");
const faceOffsets = { face:0, eyes:0, eyebrow:0, mouth:0, glasses:0 };
const faceScales = { face:100, eyes:100, eyebrow:100, mouth:100, glasses:100 };
const baseYOffset = -3; // existing CSS base translateY

const hairPosControl = document.getElementById("hairPositionControls");
const hairPosY = document.getElementById("hairPosY");
const hairResetPos = document.getElementById("hairResetPos");
const hairPosScale = document.getElementById("hairPosScale");
const hairResetScale = document.getElementById("hairResetScale");
const hairOffsets = { front:0, side:0, back:0 };
const hairScales = { front:100, side:100, back:100 };

const faceCategories = ["face", "eyes", "eyebrow", "mouth", "glasses"];
const partOptionsCount = 6;
const faceChoices = { face:null, eyes:null, eyebrow:null, mouth:null, glasses:null };
let currentFaceCategoryIndex = 0;
let selectedFaceIndex = null;

const hairCategories = ["front", "side", "back"];
const hairCategoryLabels = { front:"前髪", side:"横髪", back:"後ろ髪" };
const hairFolderNames = { front:"hair_front", side:"hair_side", back:"hair_back" };
const hairPreviewIds = { front:"hairFront", side:"hairSide", back:"hairBack" };
const hairChoices = { front:null, side:null, back:null };
let currentHairCategoryIndex = 0;
let selectedHairIndex = null;

for (let i = 0; i < introFrameCount; i++) {
    const frameNumber = String(i).padStart(4, "0");
    const frame = new Image();
    frame.src = `img/introanimation_${frameNumber}.png`;
    introFrames.push(frame);
}

for (let i = cutFrameStart; i <= cutFrameEnd; i++) {
    const frameNumber = String(i).padStart(4, "0");
    const frame = new Image();
    frame.src = `img/cut/cut_animation_${frameNumber}.png`;
}

function playIntroAnimation() {
    if (!introAnimation || introFrames.length === 0) return;

    introFrameIndex = 0;
    introAnimation.src = introFrames[introFrameIndex].src;

    const fps = 24;
    const interval = 1000 / fps;

    const animationTimer = setInterval(() => {
        introFrameIndex += 1;

        if (introFrameIndex >= introFrameCount) {
            clearInterval(animationTimer);
            introFrameIndex = introFrameCount - 1;
            showPage("facePage");
            initFacePartSelector();
            return;
        }

        introAnimation.src = introFrames[introFrameIndex].src;
    }, interval);
}

function initFacePartSelector() {
    if (!partSelector || !selectedPartText || !nextBtn || !faceBackBtn) return;

    currentFaceCategoryIndex = 0;
    selectedFaceIndex = null;
    faceChoices.face = null;
    faceChoices.eyes = null;
    faceChoices.eyebrow = null;
    faceChoices.mouth = null;
    faceChoices.glasses = null;
    nextBtn.disabled = true;
    faceBackBtn.disabled = true;
    renderCurrentFaceCategoryOptions();
    updateFaceSelectionText();
}

function renderCurrentFaceCategoryOptions() {
    if (!partSelector) return;

    partSelector.innerHTML = "";
    const category = faceCategories[currentFaceCategoryIndex];
    selectedFaceIndex = faceChoices[category];

    for (let i = 1; i <= partOptionsCount; i++) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "selectItem";
        item.innerText = `${category} ${i}`;
        if (selectedFaceIndex === i) {
            item.classList.add("active");
        }
        item.addEventListener("click", () => {
            selectFaceOption(i);
        });
        partSelector.appendChild(item);
    }

    if (nextBtn) {
        nextBtn.disabled = !faceChoices[category];
    }

    if (faceBackBtn) {
        faceBackBtn.disabled = currentFaceCategoryIndex === 0;
    }

    // update position/scale control UI for current category
    updatePositionUI();
}

function selectFaceOption(index) {
    const category = faceCategories[currentFaceCategoryIndex];
    selectedFaceIndex = index;
    faceChoices[category] = index;
    character[category] = index;
    updatePreview(category, index);

    selectedPartText.innerText = `${category} ${index} を選択しました。`;
    nextBtn.disabled = false;
    faceBackBtn.disabled = currentFaceCategoryIndex === 0;

    // show position/scale controls for this category
    if (posControl) posControl.hidden = false;
    if (posY) posY.value = String(faceOffsets[category] || 0);
    if (posScale) posScale.value = String(faceScales[category] || 100);
    applyOffset(category);
}

function applyOffset(category) {
    const el = document.getElementById(category);
    if (!el) return;
    const offset = Number(faceOffsets[category]) || 0;
    const scale = Number(faceScales[category] || 100) / 100;
    const y = baseYOffset + offset;
    el.style.transform = `translateY(${y}%) scale(${scale})`;
}

function syncHairFacePreview() {
    const mapping = {
        face: "faceHair",
        eyes: "eyesHair",
        eyebrow: "eyebrowHair",
        nose: "noseHair",
        mouth: "mouthHair",
        beard: "beardHair",
        glasses: "glassesHair"
    };

    const bodyBase = document.getElementById("bodyBase");
    const bodyBaseHair = document.getElementById("bodyBaseHair");
    if (bodyBase && bodyBaseHair) {
        bodyBaseHair.src = bodyBase.src;
        bodyBaseHair.style.transform = bodyBase.style.transform || "";
    }

    Object.keys(mapping).forEach(category => {
        const el = document.getElementById(mapping[category]);
        const value = character[category] || 1;
        if (el) {
            el.src = `img/${category}/${value}.png`;
            const offset = Number(faceOffsets[category]) || 0;
            const scale = Number(faceScales[category] || 100) / 100;
            const y = baseYOffset + offset;
            el.style.transform = `translateY(${y}%) scale(${scale})`;
        }
    });
}

function updatePositionUI() {
    const category = faceCategories[currentFaceCategoryIndex];
    const hasSelected = Boolean(faceChoices[category]);
    if (posControl) posControl.hidden = !hasSelected;
    if (posY) posY.value = String(faceOffsets[category] || 0);
    if (posScale) posScale.value = String(faceScales[category] || 100);
    // apply current offset if any
    if (hasSelected) applyOffset(category);
}

// position control handlers
if (posY) {
    posY.addEventListener('input', () => {
        const category = faceCategories[currentFaceCategoryIndex];
        faceOffsets[category] = Number(posY.value);
        applyOffset(category);
    });
}

/* arrow buttons removed: adjustments done directly via slider */

if (resetPos) {
    resetPos.addEventListener('click', () => {
        const category = faceCategories[currentFaceCategoryIndex];
        posY.value = '0';
        faceOffsets[category] = 0;
        applyOffset(category);
    });
}

// scale handlers
if (posScale) {
    posScale.addEventListener('input', () => {
        const category = faceCategories[currentFaceCategoryIndex];
        faceScales[category] = Number(posScale.value);
        applyOffset(category);
    });
}

if (resetScale) {
    resetScale.addEventListener('click', () => {
        const category = faceCategories[currentFaceCategoryIndex];
        posScale.value = '100';
        faceScales[category] = 100;
        applyOffset(category);
    });
}

function applyHairOffset(category) {
    const el = document.getElementById(hairPreviewIds[category]);
    if (!el) return;
    const offset = Number(hairOffsets[category]) || 0;
    const scale = Number(hairScales[category] || 100) / 100;
    const y = baseYOffset + offset;
    el.style.transform = `translateY(${y}%) scale(${scale})`;
}

function updateHairPositionUI() {
    const category = hairCategories[currentHairCategoryIndex];
    const hasSelected = Boolean(hairChoices[category]);
    if (hairPosControl) hairPosControl.hidden = !hasSelected;
    if (hairPosY) hairPosY.value = String(hairOffsets[category] || 0);
    if (hairPosScale) hairPosScale.value = String(hairScales[category] || 100);
    if (hasSelected) applyHairOffset(category);
}

if (hairPosY) {
    hairPosY.addEventListener('input', () => {
        const category = hairCategories[currentHairCategoryIndex];
        hairOffsets[category] = Number(hairPosY.value);
        applyHairOffset(category);
    });
}

if (hairResetPos) {
    hairResetPos.addEventListener('click', () => {
        const category = hairCategories[currentHairCategoryIndex];
        hairPosY.value = '0';
        hairOffsets[category] = 0;
        applyHairOffset(category);
    });
}

if (hairPosScale) {
    hairPosScale.addEventListener('input', () => {
        const category = hairCategories[currentHairCategoryIndex];
        hairScales[category] = Number(hairPosScale.value);
        applyHairOffset(category);
    });
}

if (hairResetScale) {
    hairResetScale.addEventListener('click', () => {
        const category = hairCategories[currentHairCategoryIndex];
        hairPosScale.value = '100';
        hairScales[category] = 100;
        applyHairOffset(category);
    });
}
function updatePreview(category, index) {
    const preview = document.getElementById(category);
    if (preview) {
        preview.src = `img/${category}/${index}.png`;
    }
}

function updateFaceSelectionText() {
    if (!selectedPartText) return;
    const category = faceCategories[currentFaceCategoryIndex];
    selectedPartText.innerText = `${category} を選択してください`;
}

function faceGoBack() {
    if (currentFaceCategoryIndex === 0) return;

    currentFaceCategoryIndex -= 1;
    selectedFaceIndex = faceChoices[faceCategories[currentFaceCategoryIndex]];
    renderCurrentFaceCategoryOptions();
    updateFaceSelectionText();
    nextBtn.disabled = !faceChoices[faceCategories[currentFaceCategoryIndex]];
    faceBackBtn.disabled = currentFaceCategoryIndex === 0;
}

function initHairPartSelector() {
    if (!hairSelector || !selectedHairText || !cutBtn || !backToFaceBtn || !hairStepBackBtn || !hairNextBtn) return;

    currentHairCategoryIndex = 0;
    selectedHairIndex = null;
    hairChoices.front = null;
    hairChoices.side = null;
    hairChoices.back = null;
    hairOffsets.front = 0;
    hairOffsets.side = 0;
    hairOffsets.back = 0;
    hairScales.front = 100;
    hairScales.side = 100;
    hairScales.back = 100;
    cutBtn.disabled = true;
    hairStepBackBtn.disabled = true;
    hairNextBtn.disabled = true;
    cutBtn.hidden = true;
    hairNextBtn.hidden = false;
    renderCurrentHairCategoryOptions();
    updateHairSelectionText();
}

function updateHairActionButtons() {
    if (!hairNextBtn || !cutBtn) return;

    const currentCategory = hairCategories[currentHairCategoryIndex];
    const isLastStep = currentHairCategoryIndex === hairCategories.length - 1;

    hairNextBtn.hidden = isLastStep;
    cutBtn.hidden = !isLastStep;

    if (!isLastStep) {
        hairNextBtn.disabled = !hairChoices[currentCategory];
        cutBtn.disabled = true;
    } else {
        cutBtn.disabled = !hairChoices[currentCategory];
    }
}

function renderCurrentHairCategoryOptions() {
    if (!hairSelector) return;

    hairSelector.innerHTML = "";
    const category = hairCategories[currentHairCategoryIndex];
    selectedHairIndex = hairChoices[category];

    for (let i = 1; i <= partOptionsCount; i++) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "selectItem";
        item.innerText = `${hairCategoryLabels[category]} ${i}`;
        if (selectedHairIndex === i) {
            item.classList.add("active");
        }
        item.addEventListener("click", () => {
            selectHairOption(i);
        });
        hairSelector.appendChild(item);
    }

    if (hairStepBackBtn) {
        hairStepBackBtn.disabled = currentHairCategoryIndex === 0;
    }

    updateHairActionButtons();

    updateHairPositionUI();
}

function selectHairOption(index) {
    const lockedStep = currentHairCategoryIndex;
    const category = hairCategories[currentHairCategoryIndex];
    selectedHairIndex = index;
    hairChoices[category] = index;
    selectedHair[category] = index;
    updateHairPreview(category, index);
    if (hairPosControl) hairPosControl.hidden = false;
    if (hairPosY) hairPosY.value = String(hairOffsets[category] || 0);
    if (hairPosScale) hairPosScale.value = String(hairScales[category] || 100);
    applyHairOffset(category);

    selectedHairText.innerText = `${hairCategoryLabels[category]} ${index} を選択しました。次へを押してください。`;
    currentHairCategoryIndex = lockedStep;
    updateHairActionButtons();
}

function updateHairPreview(category, index) {
    const previewId = hairPreviewIds[category];
    const preview = document.getElementById(previewId);
    const folder = hairFolderNames[category];
    if (preview) {
        preview.src = `img/${folder}/${index}.png`;
    }
}

function updateHairSelectionText() {
    if (!selectedHairText) return;
    const category = hairCategories[currentHairCategoryIndex];
    selectedHairText.innerText = `${hairCategoryLabels[category]} を選択してください`;
}

function showPage(id){

    pages.forEach(page=>{
        page.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");

    if (id === "hairPage") {
        syncHairFacePreview();
    }
}



// ------------------------------
// 버튼
// ------------------------------

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextToHair");
const hairNextBtn = document.getElementById("hairNext");
const cutBtn = document.getElementById("cutBtn");
const retryBtn = document.getElementById("retry");



// ------------------------------
// 선택한 얼굴
// ------------------------------

const character = {

    face:1,
    eyes:1,
    nose:1,
    mouth:1,
    beard:1,
    glasses:1

};



// ------------------------------
// 선택한 머리
// ------------------------------

const selectedHair = {

    front:1,
    side:1,
    back:1

};



// ------------------------------
// 랜덤 결과
// ------------------------------

const resultHair = {

    front:1,
    side:1,
    back:1

};



// ------------------------------
// 파츠 개수
// ------------------------------

const hairParts={

    front:5,
    side:5,
    back:5

};



// ------------------------------
// 랜덤 함수
// ------------------------------

function random(max){

    return Math.floor(Math.random()*max)+1;

}



// ------------------------------
// 머리 생성
// ------------------------------

function createRandomHair(){

    resultHair.front=random(hairParts.front);
    resultHair.side=random(hairParts.side);
    resultHair.back=random(hairParts.back);

}



// ------------------------------
// 비교
// ------------------------------

function checkResult(){

    let score=0;

    if(selectedHair.front===resultHair.front){

        score++;

    }

    if(selectedHair.side===resultHair.side){

        score++;

    }

    if(selectedHair.back===resultHair.back){

        score++;

    }

    return score;

}



// ------------------------------
// 결과 출력
// ------------------------------

function showResult(){

    const score=checkResult();

    const grade=document.getElementById("grade");

    switch(score){

        case 3:

            grade.innerText="大成功！";
            break;

        case 2:

            grade.innerText="かなり近い！";
            break;

        case 1:

            grade.innerText="...";
            break;

        default:

            grade.innerText="...";
            break;

    }

    const setImage = (id, src) => {
        const el = document.getElementById(id);
        if (el) {
            el.src = src;
        }
    };

    // 理想(선택한 스타일): face + hair
    setImage("wantedFace", `img/face/${character.face}.png`);
    setImage("wantedEyes", `img/eyes/${character.eyes}.png`);
    setImage("wantedEyebrow", `img/eyebrow/${character.eyebrow || 1}.png`);
    setImage("wantedNose", `img/nose/${character.nose}.png`);
    setImage("wantedMouth", `img/mouth/${character.mouth}.png`);
    setImage("wantedBeard", `img/beard/${character.beard}.png`);
    setImage("wantedGlasses", `img/glasses/${character.glasses}.png`);
    setImage("wantedBack", `img/hair_back/${selectedHair.back}.png`);
    setImage("wantedSide", `img/hair_side/${selectedHair.side}.png`);
    setImage("wantedFront", `img/hair_front/${selectedHair.front}.png`);

    // 仕上がり(랜덤 결과): face + random hair
    setImage("resultFace", `img/face/${character.face}.png`);
    setImage("resultEyes", `img/eyes/${character.eyes}.png`);
    setImage("resultEyebrow", `img/eyebrow/${character.eyebrow || 1}.png`);
    setImage("resultNose", `img/nose/${character.nose}.png`);
    setImage("resultMouth", `img/mouth/${character.mouth}.png`);
    setImage("resultBeard", `img/beard/${character.beard}.png`);
    setImage("resultGlasses", `img/glasses/${character.glasses}.png`);
    setImage("resultBack", `img/hair_back/${resultHair.back}.png`);
    setImage("resultSide", `img/hair_side/${resultHair.side}.png`);
    setImage("resultFront", `img/hair_front/${resultHair.front}.png`);

    console.log("선택",selectedHair);
    console.log("결과",resultHair);

    return score;

}



// ------------------------------
// 컷트 시작
// ------------------------------

function startCut(){
    const blur=document.getElementById("blurScreen");

    scissorsSound.pause();
    scissorsSound.currentTime = 0;
    tadaSound.pause();
    tadaSound.currentTime = 0;

    if (blur) {
        blur.classList.remove("holdBlur");
    }

    if (cutHoldTimer) {
        clearTimeout(cutHoldTimer);
        cutHoldTimer = null;
    }

    if (!cutAnimation) {
        createRandomHair();
        showResult();
        showPage("resultPage");
        return;
    }

    if (cutAnimationTimer) {
        clearInterval(cutAnimationTimer);
        cutAnimationTimer = null;
    }

    const totalFrames = cutFrameEnd - cutFrameStart + 1;
    const frameInterval = totalFrames > 1
        ? cutAnimationDurationMs / (totalFrames - 1)
        : cutAnimationDurationMs;

    let frameNumber = cutFrameStart;
    cutAnimation.src = `img/cut/cut_animation_${String(frameNumber).padStart(4, "0")}.png`;

    // 효과음(나중에 추가)

    // const sound=new Audio("sound/cut.mp3");
    // sound.play();


    cutAnimationTimer = setInterval(()=>{
        frameNumber += 1;

        if (frameNumber > cutFrameEnd) {
            clearInterval(cutAnimationTimer);
            cutAnimationTimer = null;

            if (blur) {
                blur.classList.add("holdBlur");
            }

            scissorsSound.currentTime = 0;
            scissorsSound.play().catch(() => {
                // Playback can be blocked by browser policies; keep flow running.
            });

            cutHoldTimer = setTimeout(()=>{
                if (blur) {
                    blur.classList.remove("holdBlur");
                }
                scissorsSound.pause();
                scissorsSound.currentTime = 0;
                tadaSound.currentTime = 0;
                tadaSound.play().catch(() => {
                    // Playback can be blocked by browser policies; keep flow running.
                });
                createRandomHair();
                showResult();
                showPage("resultPage");
                cutHoldTimer = null;
            }, cutBlurHoldDurationMs);
            return;
        }

        cutAnimation.src = `img/cut/cut_animation_${String(frameNumber).padStart(4, "0")}.png`;
    }, frameInterval);

}



// ------------------------------
// 버튼 이벤트
// ------------------------------

if (startBtn) {
    startBtn.addEventListener("click",()=>{

        showPage("introPage");
        playIntroAnimation();

    });
}

if (faceBackBtn) {
    faceBackBtn.addEventListener("click", faceGoBack);
}

if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.addEventListener("click",()=>{
        const currentCategory = faceCategories[currentFaceCategoryIndex];
        if (!faceChoices[currentCategory]) return;

        if (currentFaceCategoryIndex < faceCategories.length - 1) {
            currentFaceCategoryIndex += 1;
            selectedFaceIndex = faceChoices[faceCategories[currentFaceCategoryIndex]];
            renderCurrentFaceCategoryOptions();
            updateFaceSelectionText();
            nextBtn.disabled = !faceChoices[faceCategories[currentFaceCategoryIndex]];
            faceBackBtn.disabled = currentFaceCategoryIndex === 0;
        } else {
            showPage("hairPage");
            initHairPartSelector();
        }
    });
}

if (hairStepBackBtn) {
    hairStepBackBtn.addEventListener("click",()=>{
        if (currentHairCategoryIndex === 0) return;
        currentHairCategoryIndex -= 1;
        selectedHairIndex = hairChoices[hairCategories[currentHairCategoryIndex]];
        renderCurrentHairCategoryOptions();
        updateHairSelectionText();
    });
}

if (hairNextBtn) {
    hairNextBtn.addEventListener("click",()=>{
        const currentCategory = hairCategories[currentHairCategoryIndex];
        if (!hairChoices[currentCategory]) return;

        if (currentHairCategoryIndex < hairCategories.length - 1) {
            currentHairCategoryIndex += 1;
            selectedHairIndex = hairChoices[hairCategories[currentHairCategoryIndex]];
            renderCurrentHairCategoryOptions();
            updateHairSelectionText();
        }
    });
}

if (backToFaceBtn) {
    backToFaceBtn.addEventListener("click",()=>{
        showPage("facePage");
    });
}

if (cutBtn) {
    cutBtn.disabled = true;
    cutBtn.addEventListener("click",()=>{

        showPage("cutPage");

        startCut();

    });
}



if (retryBtn) {
    retryBtn.addEventListener("click",()=>{

        showPage("startPage");

    });
}



// ------------------------------
// 테스트용
// ------------------------------

// 원하는 머리 선택
selectedHair.front=2;
selectedHair.side=4;
selectedHair.back=1;