// 전역 변수 선언
let mode = 'pen'; // 'pen', 'eraser', 'picker'
let currentColor = '#000000';
let currentWeight = 5;
let canvasWidth = 800;
let canvasHeight = 500;
let webCam; // 6. 사진 찍기용 웹캠 객체
let a = 0;

// UI 요소들을 위한 변수
let btnReset, btnSave, inputFileName;
let btnPen, btnEraser, btnPicker, btnPhoto;
let sliderWeight;
let lblWeightValue;
let lblStatusMode, valStatusMode;
let lblStatusColor, valStatusColorSwatch;
let lblStatusWeight, valStatusWeight;
let colorPalette = [];

// 8. 20개 이상의 색상 배열 (총 24개 색상 구성)
const colorsPreset = [
  '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3',
  '#002244', '#116633', '#990000', '#ffc90e', '#ea80fc', '#b3e5fc', '#e6ee9c', '#ff8a65', '#455a64', '#bcaaa4', '#eeeeee', '#263238'
];

function setup() {
  // 1. 전체 캔버스 생성 및 기본 흰색 초기화
  createCanvas(canvasWidth, canvasHeight + 100); // UI 영역 공간(+100px) 확보
  background(255);
  
  // 6. 사진 찍기를 위한 웹캠 초기화 및 숨기기
  webCam = createCapture(VIDEO);
  webCam.size(canvasWidth, canvasHeight);
  webCam.hide();

  // ----------------------------------------------------
  // 🎨 p5.js Dom 함수를 활용한 자바스크립트 UI 생성 영역
  // ----------------------------------------------------
  
  // 상단 여백 설정 (UI가 배치될 시작 Y 좌표)
  let uiY = canvasHeight + 15;

  // [1. 새로 만들기 버튼]
  btnReset = createButton('📄 새로 만들기');
  btnReset.position(10, uiY);
  btnReset.mousePressed(resetCanvas);

  // [9. 저장파일 이름 입력창]
  inputFileName = createInput('my_artwork');
  inputFileName.position(125, uiY);
  inputFileName.size(100);

  // [2. 파일로 저장하기 버튼]
  btnSave = createButton('💾 저장');
  btnSave.position(240, uiY);
  btnSave.mousePressed(saveArtwork);

  // [3. 그리기(펜) 버튼]
  btnPen = createButton('✏️ 펜');
  btnPen.position(310, uiY);
  btnPen.mousePressed(() => setMode('pen'));
  btnPen.style('background-color', '#ddd'); // 기본 활성화 표시

  // [4. 지우기 버튼]
  btnEraser = createButton('🧼 지우개');
  btnEraser.position(365, uiY);
  btnEraser.mousePressed(() => setMode('eraser'));

  // [5. 색상 추출 버튼]
  btnPicker = createButton('🧪 색상 추출');
  btnPicker.position(480, uiY);
  btnPicker.mousePressed(() => setMode('picker'));

  // [6. 사진 찍기 버튼]
  btnPhoto = createButton('📷 사진 찍기');
  btnPhoto.position(575, uiY);
  btnPhoto.mousePressed(takePhoto);

  // [7. 펜 굵기 조절 (슬라이더 1~50px)
  let lblWeight = createSpan('굵기: ');
  lblWeight.position(680, uiY + 2);

  sliderWeight = createSlider(1, 50, currentWeight, 1);
  sliderWeight.position(715, uiY + 4);
  sliderWeight.size(90);
  sliderWeight.input(updatePenWeight);

  lblWeightValue = createSpan(currentWeight + 'px');
  lblWeightValue.position(810, uiY + 2);

  // [8. 색상 선택 팔레트 생성 (20개 이상)]
  let paletteY = uiY + 40;
  let startX = 10;
  
  for (let i = 0; i < colorsPreset.length; i++) {
    let col = colorsPreset[i];
    let btnColor = createButton('');
    
    // 버튼을 동그란 색상 패드로 스타일링
    btnColor.position(startX + (i * 24), paletteY);
    btnColor.size(20, 20);
    btnColor.style('background-color', col);
    btnColor.style('border', '1px solid #777');
    btnColor.style('border-radius', '50%');
    btnColor.style('cursor', 'pointer');
    
    // 색상 버튼 클릭 시 현재 색상 변경
    btnColor.mousePressed(() => {
      currentColor = col;
      if (mode === 'eraser' || mode === 'picker') setMode('pen');
      updateStatusPanel();
    });
  }

  // 현재 도구·색상·굵기 표시 (색상 팔레트 오른쪽, span + style 사용)
  let statusX = 600;
  let statusY = paletteY + 2;

  lblStatusMode = createSpan('모드 ');
  lblStatusMode.position(statusX, statusY);
  lblStatusMode.style('font-weight', 'bold');
  lblStatusMode.style('color', '#555');

  valStatusMode = createSpan('펜');
  valStatusMode.position(statusX + 32, statusY);

  lblStatusColor = createSpan('색상 ');
  lblStatusColor.position(statusX + 75, statusY);
  lblStatusColor.style('font-weight', 'bold');
  lblStatusColor.style('color', '#555');

  valStatusColorSwatch = createSpan('');
  valStatusColorSwatch.position(statusX + 115, statusY);
  valStatusColorSwatch.style('display', 'inline-block');
  valStatusColorSwatch.style('width', '18px');
  valStatusColorSwatch.style('height', '18px');
  valStatusColorSwatch.style('border', '1px solid #888');
  valStatusColorSwatch.style('border-radius', '50%');
  valStatusColorSwatch.style('background-color', currentColor);

  lblStatusWeight = createSpan('굵기 ');
  lblStatusWeight.position(statusX + 145, statusY);
  lblStatusWeight.style('font-weight', 'bold');
  lblStatusWeight.style('color', '#555');

  valStatusWeight = createSpan(currentWeight + 'px');
  valStatusWeight.position(statusX + 180, statusY);

  updateStatusPanel();
}

function draw() {
  // 하단 UI 영역 분리선 및 텍스트 안내 그리기
  push();
  fill(240);
  noStroke();
  rect(0, canvasHeight, canvasWidth, 100); // UI 배경 영역
  stroke(200);
  line(0, canvasHeight, canvasWidth, canvasHeight); // 경계선
  pop();

  // 3. 마우스 드래그를 이용한 그리기/지우기/색상추출 기능 작동
  if (mouseIsPressed) {
    // 중요: 마우스 좌표가 상단 '도화지 영역(canvasHeight 이하)' 내부에 있을 때만 작동해야 UI를 침범하지 않음
    if (mouseX >= 0 && mouseX <= canvasWidth && mouseY >= 0 && mouseY <= canvasHeight) {
      
      // [3. 그리기]
      if (mode === 'pen') {
        stroke(currentColor);
        strokeWeight(currentWeight);
        line(pmouseX, pmouseY, mouseX, mouseY);
      } 
      // [4. 지우기]
      else if (mode === 'eraser') {
        stroke(255);
        strokeWeight(currentWeight);
        line(pmouseX, pmouseY, mouseX, mouseY);
      } 
      // [5. 색상추출 (무제한)]
      else if (mode === 'picker') {
        let c = get(mouseX, mouseY); // 클릭한 좌표의 색상 추출
        let r = int(c[0]);
        let g = int(c[1]);
        let b = int(c[2]);
        // 추출한 RGB 값을 Hex 코드로 변환하여 적용
        let picked = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        if (picked !== currentColor) {
          currentColor = picked;
          updateStatusPanel();
        }
      }
    }
  }
}

// [1. 새로 만들기 (초기화)]
function resetCanvas() {
  if (confirm("도화지를 전부 비우시겠습니까?")) {
    push();
    fill(255);
    noStroke();
    rect(0, 0, canvasWidth, canvasHeight); // 도화지 영역만 흰색으로 덮음
    pop();
  }
}

// [2, 9. 정확히 도화지만 이름 지정하여 저장하기]
function saveArtwork() {
  let fileName = inputFileName.value().trim();
  
  // 빈칸일 때만 기본 이름 + 숫자를 부여하고 숫자를 올립니다.
  if (fileName === "") {
    fileName = "my_artwork" + a;
    a++; // 빈칸일 때만 숫자가 증가함
  }
  
  let img = get(0, 0, canvasWidth, canvasHeight); 
  img.save(fileName, 'png');
}

// [6. 사진 찍기]
function takePhoto() {
  // 웹캠 화면의 한 프레임을 도화지 영역에 꽉 차게 띄웁니다.
  push();
  image(webCam, 0, 0, canvasWidth, canvasHeight);
  pop();
}

function updatePenWeight() {
  currentWeight = sliderWeight.value();
  lblWeightValue.html(currentWeight + 'px');
  updateStatusPanel();
}

const MODE_LABELS = { pen: '펜', eraser: '지우개', picker: '색상 추출' };

function updateStatusPanel() {
  if (!valStatusMode) return;

  valStatusMode.html(MODE_LABELS[mode] || mode);

  let swatchColor = mode === 'eraser' ? '#ffffff' : currentColor;
  valStatusColorSwatch.style('background-color', swatchColor);

  valStatusWeight.html(currentWeight + 'px');
}

// UI 버튼 활성화 시각 효과 및 모드 변경 제어 함수
function setMode(newMode) {
  mode = newMode;
  // 모든 버튼의 배경색 초기화
  btnPen.style('background-color', '');
  btnEraser.style('background-color', '');
  btnPicker.style('background-color', '');

  // 선택된 모드 버튼만 어둡게 하이라이트
  if (mode === 'pen') btnPen.style('background-color', '#ddd');
  if (mode === 'eraser') btnEraser.style('background-color', '#ddd');
  if (mode === 'picker') btnPicker.style('background-color', '#ddd');
  updateStatusPanel();
}