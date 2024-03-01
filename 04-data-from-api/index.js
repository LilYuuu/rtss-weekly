import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { getArtworkData } from "./getArtworkData.js";

let scene, camera, renderer;

// pointerLock controls
let controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// movement calculations
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

// image
let imageDisplays = [];

function init() {
  // create a scene in which all other objects will exist
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 1, 15);

  // create a camera and position it in space
  let aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.z = 5; // place the camera in space
  camera.position.y = 5;
  camera.lookAt(0, 0, 0);

  // the renderer will actually show the camera view within our <canvas>
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // let gridHelper = new THREE.GridHelper(25, 25);
  // scene.add(gridHelper);

  // ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 8); // soft white light
  scene.add(ambientLight);

  // add pointer lock controls
  controls = new PointerLockControls(camera, document.body);

  // show and hide instructions using lock
  let blocker = document.getElementById("blocker");
  let instructions = document.getElementById("instructions");

  instructions.addEventListener("click", function () {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  // wasd controls
  let onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;
    }
  };

  let onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  window.addEventListener("resize", onWindowResize);

  // call our function to get and display images from an API
  getDataAndDisplay();

  loop();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function loop() {
  window.requestAnimationFrame(loop); // pass the name of your loop function into this function

  // movement calculation
  const time = performance.now();

  if (controls.isLocked === true) {
    // console.log("controls locked");
    const delta = (time - prevTime) / 100;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    // velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();
    // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 10.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 10.0 * delta;

    // console.log(controls);
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += velocity.y * delta;
  }

  prevTime = time;

  // do something to each image display
  for (let i = 0; i < imageDisplays.length; i++) {
    imageDisplays[i].doAction(0.01);
  }

  // finally, take a picture of the scene and show it in the <canvas>
  renderer.render(scene, camera);
}

init();

// this function gets data from the API and then adds new "MyImageDisplay" objects to the scene
// it is a special "asynchronous" function, which means it will wait for the data to be ready before continuing
async function getDataAndDisplay() {
  let artworkData = await getArtworkData("Brooklyn");

  console.log(artworkData);

  for (let i = 0; i < artworkData.length; i++) {
    // first we get the URL of the artwork
    let image_id = artworkData[i].data.image_id;
    let imageUrl =
      "https://www.artic.edu/iiif/2/" + image_id + "/full/843,/0/default.jpg";

    // then we create a new MyImageDisplay object and pass in the scene and the URL
    let imageDisplay = new MyImageDisplay(scene, imageUrl);

    // then we set the location of the display
    let posX = Math.random() * 20 - 10;
    let posY = 5;
    let posZ = Math.random() * 20 - 10;
    imageDisplay.setPosition(posX, posY, posZ); // arrange them in a line

    // finally, we add the imageDisplay to an array so we can acces it in our draw loop
    imageDisplays.push(imageDisplay);
  }
}

// here we're using a class to encapsulate all of the code related to displaying an image
class MyImageDisplay {
  constructor(scene, imageUrl) {
    // load the image texture from the provided URL
    let imageTexture = new THREE.TextureLoader().load(imageUrl);

    // create geometry and material with texture
    // let geo = new THREE.BoxGeometry(1, 1, 1);
    let geo = new THREE.SphereGeometry(1, 32, 16);
    let mat = new THREE.MeshPhongMaterial({ map: imageTexture });
    let mesh = new THREE.Mesh(geo, mat);

    // save the mesh to 'this' object so we can access it elsewhere in the class
    this.mesh = mesh;

    // add it to the scene add add a position
    scene.add(mesh);
  }

  // a method which sets the position of the mesh
  setPosition(x, y, z) {
    this.mesh.position.x = x;
    this.mesh.position.y = y;
    this.mesh.position.z = z;
  }

  // a method which does something to the mesh
  doAction(amount) {
    this.mesh.rotateX(amount);
    this.mesh.rotateY(amount);
    this.mesh.rotateZ(amount);
  }
}
