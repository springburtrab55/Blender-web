const container = document.getElementById('viewport-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x282828);

const camera = new THREE.PerspectiveCamera(
  60, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);
camera.position.set(5, 5, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
scene.add(gridHelper);

let objectsInScene = [];
let selectedObject = null;
let currentMaterialColor = 0xdb7100;

function addObjectToScene(geometry, isInitial = false) {
  const material = new THREE.MeshStandardMaterial({ 
    color: currentMaterialColor, 
    roughness: 0.4 
  });
  const mesh = new THREE.Mesh(geometry, material);
  
  if (isInitial) {
    mesh.position.y = 0.75;
  } else {
    mesh.position.set(
      (Math.random() - 0.5) * 3,
      1,
      (Math.random() - 0.5) * 3
    );
  }

  scene.add(mesh);
  objectsInScene.push(mesh);
  selectedObject = mesh;
}

addObjectToScene(new THREE.BoxGeometry(1.5, 1.5, 1.5), true);

document.getElementById('btn-cube').addEventListener('click', () => {
  addObjectToScene(new THREE.BoxGeometry(1.5, 1.5, 1.5));
});

document.getElementById('btn-sphere').addEventListener('click', () => {
  addObjectToScene(new THREE.SphereGeometry(1, 32, 32));
});

document.getElementById('btn-cylinder').addEventListener('click', () => {
  addObjectToScene(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 32));
});

const colorPicker = document.getElementById('color-picker');
colorPicker.addEventListener('input', (event) => {
  currentMaterialColor = event.target.value;
  if (selectedObject && selectedObject.material) {
    selectedObject.material.color.set(currentMaterialColor);
  }
});

document.getElementById('btn-delete').addEventListener('click', () => {
  if (selectedObject && objectsInScene.length > 1) {
    scene.remove(selectedObject);
    objectsInScene = objectsInScene.filter(obj => obj !== selectedObject);
    selectedObject = objectsInScene[objectsInScene.length - 1];
  } else {
    alert("¡Debes dejar al menos un objeto en la escena!");
  }
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
