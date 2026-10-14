// 1. Configuración básica de Escena, Cámara y Renderizador optimizado
const container = document.getElementById('viewport-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a4a4a); // Fondo gris claro

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 4, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// 2. Controles de Cámara y Gizmos de Transformación
const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

const transformControls = new THREE.TransformControls(camera, renderer.domElement);
scene.add(transformControls);

// Desactivar la órbita de la cámara al usar las flechas del gizmo
transformControls.addEventListener('dragging-changed', (event) => {
  orbitControls.enabled = !event.value;
});

// 3. Iluminación y Cuadrícula Clara
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Cuadrícula visible y clara sobre el fondo gris
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x666666);
gridHelper.position.y = -0.01;
scene.add(gridHelper);

// 4. Gestión de Selección y Objetos
let objectsInScene = [];
let selectedObject = null;

function selectObject(obj) {
  selectedObject = obj;
  if (obj) {
    transformControls.attach(obj);
    document.getElementById('info-overlay').innerText = `Seleccionado: ${obj.name || 'Objeto/Pieza/Hueso'}`;
  } else {
    transformControls.detach();
    document.getElementById('info-overlay').innerText = "Ningún objeto seleccionado";
  }
}

function registerObject(obj) {
  scene.add(obj);
  objectsInScene.push(obj);
  selectObject(obj);
}

// Raycaster para hacer clic en cubos, piezas internas o huesos del modelo
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointerdown', (event) => {
  if (event.clientX < 220) return; // Ignorar clics en la barra lateral

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  // Filtrar elementos de entorno como la cuadrícula
  const validIntersects = intersects.filter(hit => hit.object !== gridHelper);

  if (validIntersects.length > 0) {
    let hitObject = validIntersects[0].object;
    selectObject(hitObject); // Te permite seleccionar huesos, mallas o piezas individuales
  }
});

// Cubo de prueba inicial
const initialCube = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 1.5, 1.5),
  new THREE.MeshStandardMaterial({ color: 0xdb7100, roughness: 0.4 })
);
initialCube.position.y = 0.75;
registerObject(initialCube);

// --- ACCIONES DE LA INTERFAZ ---

// Crear Cubo
document.getElementById('btn-cube').addEventListener('click', () => {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({ color: 0xdb7100, roughness: 0.4 })
  );
  cube.position.set((Math.random() - 0.5) * 3, 1, (Math.random() - 0.5) * 3);
  registerObject(cube);
});

// Botones de Transformación (Mover, Rotar, Escalar)
const btnTranslate = document.getElementById('mode-translate');
const btnRotate = document.getElementById('mode-rotate');
const btnScale = document.getElementById('mode-scale');

function updateMode(btn, mode) {
  [btnTranslate, btnRotate, btnScale].forEach(b => b.classList.remove('active-btn'));
  btn.classList.add('active-btn');
  transformControls.setMode(mode);
}

btnTranslate.addEventListener('click', () => updateMode(btnTranslate, 'translate'));
btnRotate.addEventListener('click', () => updateMode(btnRotate, 'rotate'));
btnScale.addEventListener('click', () => updateMode(btnScale, 'scale'));

// Selector de Color
document.getElementById('color-picker').addEventListener('input', (e) => {
  if (selectedObject && selectedObject.material) {
    selectedObject.material.color.set(e.target.value);
  }
});

// Borrar Objeto Seleccionado
document.getElementById('btn-delete').addEventListener('click', () => {
  if (!selectedObject) return;
  transformControls.detach();
  scene.remove(selectedObject);
  objectsInScene = objectsInScene.filter(o => o !== selectedObject);
  selectObject(null);
});

// --- IMPORTADOR DE MODELOS GLB / GLTF ---
const fileUploader = document.getElementById('file-uploader');
document.getElementById('btn-upload').addEventListener('click', () => fileUploader.click());

fileUploader.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function (event) {
    const contents = event.target.result;
    const loader = new THREE.GLTFLoader();
    
    loader.parse(contents, '', (gltf) => {
      const model = gltf.scene;
      model.scale.set(1, 1, 1);
      registerObject(model);
      
      // Si el modelo trae huesos o esqueleto integrado, Three.js lo incluye automáticamente 
      // y podrás hacer clic en los huesos para rotarlos con el gizmo.
      console.log("Modelo GLB cargado con éxito. Estructura:", gltf);
    }, (error) => {
      console.error(error);
      alert("Error al cargar el archivo GLB.");
    });
  };
  fileUploader.value = '';
});

// 5. Bucle de Renderizado Fluido (60 FPS)
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
}
animate();

// 6. Ajuste automático al cambiar tamaño de pantalla
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
