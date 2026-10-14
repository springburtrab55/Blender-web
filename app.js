// 1. Configuración del Entorno 3D, Escena y Cámaras Múltiples
const container = document.getElementById('viewport-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Cámara Principal de Trabajo
const mainCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
mainCamera.position.set(6, 6, 8);

// Cámara Secundaria Estática (Ej. Vista Cinematográfica o Alternativa)
const altCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
altCamera.position.set(0, 10, 12);
altCamera.lookAt(0, 0, 0);

let activeCamera = mainCamera;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// 2. Controladores de Órbita y Gizmos de Transformación (Mover, Rotar, Escalar)
const orbitControls = new THREE.OrbitControls(activeCamera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

const transformControls = new THREE.TransformControls(activeCamera, renderer.domElement);
scene.add(transformControls);

// Desactivar órbita de la cámara mientras se usa el gizmo de transformación para evitar conflictos táctiles/mouse
transformControls.addEventListener('dragging-changed', (event) => {
  orbitControls.enabled = !event.value;
});

// 3. Sistema de Iluminación Escalable
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 15);
dirLight.castShadow = true;
scene.add(dirLight);

// Cuadrícula del Piso Profesional
const gridHelper = new THREE.GridHelper(25, 25, 0x555555, 0x333333);
gridHelper.position.y = -0.01;
scene.add(gridHelper);

// 4. Gestión de Memoria, Objetos y Estabilidad (Prevención de Crashes)
let objectsInScene = [];
let selectedObject = null;
let currentMaterialColor = 0xdb7100;

function registerAndSelectObject(mesh) {
  scene.add(mesh);
  objectsInScene.push(mesh);
  selectObject(mesh);
}

function selectObject(mesh) {
  selectedObject = mesh;
  if (mesh) {
    transformControls.attach(mesh);
  } else {
    transformControls.detach();
  }
}

// Función segura para eliminar objetos liberando memoria RAM de la GPU
function deleteSelectedObject() {
  if (!selectedObject) return;
  
  if (objectsInScene.length <= 1) {
    alert("¡Debes mantener al menos un objeto en la escena!");
    return;
  }

  transformControls.detach();
  scene.remove(selectedObject);
  
  // Limpieza de geometrías y materiales para evitar fugas de memoria (Memory Leaks / Crashes)
  selectedObject.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose());
      } else {
        child.material.dispose();
      }
    }
  });

  objectsInScene = objectsInScene.filter(obj => obj !== selectedObject);
  selectObject(objectsInScene[objectsInScene.length - 1]);
}

// Cubo Inicial de Prueba
const initialGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const initialMaterial = new THREE.MeshStandardMaterial({ color: currentMaterialColor, roughness: 0.3 });
const initialCube = new THREE.Mesh(initialGeometry, initialMaterial);
initialCube.position.y = 0.75;
registerAndSelectObject(initialCube);

// --- CONEXIÓN DE INTERFAZ Y HERRAMIENTAS ---

// Botones de Geometrías Base
document.getElementById('btn-cube').addEventListener('click', () => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({ color: currentMaterialColor, roughness: 0.3 })
  );
  mesh.position.set((Math.random() - 0.5) * 4, 1, (Math.random() - 0.5) * 4);
  registerAndSelectObject(mesh);
});

document.getElementById('btn-sphere').addEventListener('click', () => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({ color: currentMaterialColor, roughness: 0.3 })
  );
  mesh.position.set((Math.random() - 0.5) * 4, 1, (Math.random() - 0.5) * 4);
  registerAndSelectObject(mesh);
});

document.getElementById('btn-cylinder').addEventListener('click', () => {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 1.5, 32),
    new THREE.MeshStandardMaterial({ color: currentMaterialColor, roughness: 0.3 })
  );
  mesh.position.set((Math.random() - 0.5) * 4, 1, (Math.random() - 0.5) * 4);
  registerAndSelectObject(mesh);
});

// Selector de Modos de Transformación (Gizmos)
const modeTranslate = document.getElementById('mode-translate');
const modeRotate = document.getElementById('mode-rotate');
const modeScale = document.getElementById('mode-scale');

function updateModeButtons(activeBtn) {
  [modeTranslate, modeRotate, modeScale].forEach(b => b.classList.remove('active-mode'));
  activeBtn.classList.add('active-mode');
}

modeTranslate.addEventListener('click', () => {
  transformControls.setMode('translate');
  updateModeButtons(modeTranslate);
});

modeRotate.addEventListener('click', () => {
  transformControls.setMode('rotate');
  updateModeButtons(modeRotate);
});

modeScale.addEventListener('click', () => {
  transformControls.setMode('scale');
  updateModeButtons(modeScale);
});

// Selector de Color en Tiempo Real
const colorPicker = document.getElementById('color-picker');
colorPicker.addEventListener('input', (event) => {
  currentMaterialColor = event.target.value;
  if (selectedObject) {
    selectedObject.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.set(currentMaterialColor);
      }
    });
  }
});

// Botón de Eliminación Segura
document.getElementById('btn-delete').addEventListener('click', deleteSelectedObject);

// Sistema de Luces Adicionales
document.getElementById('btn-add-light').addEventListener('click', () => {
  const pointLight = new THREE.PointLight(0xffaa00, 1.5, 10);
  pointLight.position.set((Math.random() - 0.5) * 5, 3, (Math.random() - 0.5) * 5);
  scene.add(pointLight);
  
  // Esfera visual para representar la posición de la luz en la escena
  const lightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffaa00 })
  );
  lightSphere.position.copy(pointLight.position);
  registerAndSelectObject(lightSphere);
});

// Cambio Dinámico de Cámaras
document.getElementById('btn-switch-camera').addEventListener('click', () => {
  if (activeCamera === mainCamera) {
    activeCamera = altCamera;
    document.getElementById('info-overlay').innerText = "Blender Web v2.0 | Cámara Cinemática Activa";
  } else {
    activeCamera = mainCamera;
    document.getElementById('info-overlay').innerText = "Blender Web v2.0 | Cámara Principal Activa";
  }
  orbitControls.object = activeCamera;
  transformControls.camera = activeCamera;
});

// --- IMPORTADOR UNIVERSAL DE ARCHIVOS 3D (GLB / GLTF / OBJ) ---
const fileUploader = document.getElementById('file-uploader');
document.getElementById('btn-upload').addEventListener('click', () => fileUploader.click());

fileUploader.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
    reader.readAsArrayBuffer(file);
    reader.onload = function (event) {
      const contents = event.target.result;
      const loader = new THREE.GLTFLoader();
      loader.parse(contents, '', (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.5, 1.5, 1.5);
        registerAndSelectObject(model);
      }, (error) => {
        console.error(error);
        alert("Error al cargar el archivo GLTF/GLB.");
      });
    };
  } else if (fileName.endsWith('.obj')) {
    reader.readAsText(file);
    reader.onload = function (event) {
      const text = event.target.result;
      const loader = new THREE.OBJLoader();
      const obj = loader.parse(text);
      obj.scale.set(1, 1, 1);
      registerAndSelectObject(obj);
    };
  } else {
    alert("Formato no soportado directamente. Usa archivos .glb, .gltf u .obj");
  }
  fileUploader.value = ''; // Limpiar selector
});

// 5. Bucle Principal de Renderizado Fluido (60 FPS)
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, activeCamera);
}
animate();

// 6. Ajuste Automático al Redimensionar Pantalla o Girar Dispositivos
window.addEventListener('resize', () => {
  mainCamera.aspect = window.innerWidth / window.innerHeight;
  mainCamera.updateProjectionMatrix();
  altCamera.aspect = window.innerWidth / window.innerHeight;
  altCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
