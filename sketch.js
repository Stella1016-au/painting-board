function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  fill(255,0,0);
  rect(0,0,50,50);
}

function mouseClicked(){
  save(get(0,0,20,20),"stella.jpg");
}
