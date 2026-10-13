// 1. Escena, Cámara y Renderizador
const container = document.getElementById('viewport-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x282828); // Color de fondo gris oscuro estilo Blender

const camera = new THREE.PerspectiveCamera(
  60, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);
camera.position.set(5, 5, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimizado para móviles y Chromebooks
container.appendChild(renderer.domElement);

// 2. Controles de Cámara (Funciona con touch en Android y ratón/trackpad en Chromebook)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 3. Luces Base
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// 4. Cuadrícula del Piso (Grid Floor)
const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
scene.add(gridHelper);

// 5. Cubo de Prueba inicial
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const material = new THREE.MeshStandardMaterial({ color: 0xdb7100, roughness: 0.4 });
const cube = new THREE.Mesh(geometry, material);
cube.position.y = 0.75;
scene.add(cube);

// 6. Bucle de Renderizado (60 FPS)
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// 7. Ajuste automático al cambiar tamaño de pantalla o rotar el dispositivo
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
