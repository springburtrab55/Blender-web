const container = document.getElementById('viewport-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(6, 6, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

const transformControls = new THREE.TransformControls(camera, renderer.domElement);
scene.add(transformControls);

transformControls.addEventListener('dragging-changed', (event) => {
  orbitControls.enabled = !event.value;
});

// Luces y Cuadrícula
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 15);
scene.add(dirLight);

const gridHelper = new THREE.GridHelper(25, 25, 0x444444, 0x2c2c2c);
gridHelper.position.y = -0.01;
scene.add(gridHelper);

let objectsInScene = [];
let selectedObject = null;
let currentMaterialColor = 0xdb7100;
let skeletonHelpers = [];

function selectObject(obj) {
  selectedObject = obj;
  if (obj) {
    transformControls.attach(obj);
    document.getElementById('info-overlay').innerText = `Seleccionado: ${obj.name || 'Objeto 3D'}`;
  } else {
    transformControls.detach();
    document.getElementById('info-overlay').innerText = "Ningún objeto seleccionado";
  }
}

function registerObject(mesh) {
  scene.add(mesh);
  objectsInScene.push(mesh);
  selectObject(mesh);
}

// Raycaster para hacer clic directo en piezas o sub-mallas del modelo
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointerdown', (event) => {
  if (event.clientX < 260) return; // Ignorar clics en la barra lateral

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objectsInScene, true);

  if (intersects.length > 0) {
    selectObject(intersects[0].object);
  }
});

// Cubo Inicial por defecto
const initMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 1.5, 1.5),
  new THREE.MeshStandardMaterial({ color: currentMaterialColor, roughness: 0.3 })
);
initMesh.position.y = 0.75;
registerObject(initMesh);

// --- CONTROLES DE LA INTERFAZ ---

// Geometrías Base
document.getElementById('btn-cube').addEventListener('click', () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: currentMaterialColor }));
  mesh.position.set((Math.random() - 0.5) * 4, 1, (Math.random() - 0.5) * 4);
  registerObject(mesh);
});

document.getElementById('btn-sphere').addEventListener('click', () => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshStandardMaterial({ color: currentMaterialColor }));
  mesh.position.set((Math.random() - 0.5) * 4, 1, (Math.random() - 0.5) * 4);
  registerObject(mesh);
});

document.getElementById('btn-cylinder').addEventListener('click', () => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 32), new THREE.MeshStandardMaterial({ color: currentMaterialColor }));
  mesh.position.set((Math.random() - 0.5) * 4, 1, (Math.random() - 0.5) * 4);
  registerObject(mesh);
});

// Modos de Transformación
const modeTranslate = document.getElementById('mode-translate');
const modeRotate = document.getElementById('mode-rotate');
const modeScale = document.getElementById('mode-scale');

function updateModeBtn(btn) {
  [modeTranslate, modeRotate, modeScale].forEach(b => b.classList.remove('active-mode'));
  btn.classList.add('active-mode');
}

modeTranslate.addEventListener('click', () => { transformControls.setMode('translate'); updateModeBtn(modeTranslate); });
modeRotate.addEventListener('click', () => { transformControls.setMode('rotate'); updateModeBtn(modeRotate); });
modeScale.addEventListener('click', () => { transformControls.setMode('scale'); updateModeBtn(modeScale); });

// Selector de Color
document.getElementById('color-picker').addEventListener('input', (e) => {
  currentMaterialColor = e.target.value;
  if (selectedObject && selectedObject.material) {
    if (Array.isArray(selectedObject.material)) {
      selectedObject.material.forEach(m => m.color.set(currentMaterialColor));
    } else {
      selectedObject.material.color.set(currentMaterialColor);
    }
  }
});

// Inspeccionar Jerarquía / Contenido en Consola
document.getElementById('btn-inspect-hierarchy').addEventListener('click', () => {
  if (!selectedObject) {
    alert("Selecciona un modelo primero.");
    return;
  }
  console.log("=== Estructura del Modelo Seleccionado ===");
  console.log(selectedObject);
  let count = 0;
  selectedObject.traverse(child => count++);
  alert(`El objeto seleccionado contiene ${count} sub-piezas/nodos. Revisa la consola (F12) para ver los detalles.`);
});

// Cargar Textura de Imagen
const textureUploader = document.getElementById('texture-uploader');
document.getElementById('btn-load-texture').addEventListener('click', () => textureUploader.click());

textureUploader.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file || !selectedObject) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(event.target.result, (texture) => {
      if (selectedObject.material) {
        selectedObject.material.map = texture;
        selectedObject.material.needsUpdate = true;
        alert("¡Textura aplicada con éxito!");
      }
    });
  };
  reader.readAsDataURL(file);
});

// Agregar Hueso / Esqueleto Básico de Prueba
document.getElementById('btn-add-bone').addEventListener('click', () => {
  const bone1 = new THREE.Bone();
  const bone2 = new THREE.Bone();
  bone1.add(bone2);
  bone2.position.y = 2;

  const skeleton = new THREE.Skeleton([bone1, bone2]);
  const skeletonHelper = new THREE.SkeletonHelper(bone1);
  scene.add(bone1);
  scene.add(skeletonHelper);
  skeletonHelpers.push(skeletonHelper);

  selectObject(bone1);
  alert("Esqueleto base de 2 huesos creado en la escena.");
});

document.getElementById('btn-toggle-skeleton').addEventListener('click', () => {
  skeletonHelpers.forEach(sh => sh.visible = !sh.visible);
});

// Botón Borrar
document.getElementById('btn-delete').addEventListener('click', () => {
  if (!selectedObject) return;
  transformControls.detach();
  scene.remove(selectedObject);
  objectsInScene = objectsInScene.filter(o => o !== selectedObject);
  selectObject(null);
});

// --- IMPORTADOR UNIVERSAL (GLB, GLTF, OBJ, FBX, ZIP) ---
const fileUploader = document.getElementById('file-uploader');
document.getElementById('btn-upload').addEventListener('click', () => fileUploader.click());

fileUploader.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.zip')) {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      let modelData = null;
      let ext = '';

      for (const path in zipContent.files) {
        const lower = path.toLowerCase();
        if (lower.endsWith('.glb') || lower.endsWith('.gltf') || lower.endsWith('.obj') || lower.endsWith('.fbx')) {
          ext = lower.split('.').pop();
          modelData = await zipContent.files[path].async(ext === 'obj' ? 'string' : 'arraybuffer');
          break;
        }
      }
      if (!modelData) {
        alert("No se encontró ningún archivo 3D compatible dentro del ZIP.");
        return;
      }
      parseModelData(modelData, ext);
    } catch (err) {
      console.error(err);
      alert("Error al leer el archivo ZIP.");
    }
  } else {
    const reader = new FileReader();
    const ext = fileName.split('.').pop();
    if (ext === 'obj') {
      reader.readAsText(file);
      reader.onload = (evt) => parseModelData(evt.target.result, 'obj');
    } else {
      reader.readAsArrayBuffer(file);
      reader.onload = (evt) => parseModelData(evt.target.result, ext);
    }
  }
  fileUploader.value = '';
});

function parseModelData(data, extension) {
  if (extension === 'glb' || extension === 'gltf') {
    new THREE.GLTFLoader().parse(data, '', (gltf) => registerObject(gltf.scene), () => alert("Error cargando GLTF"));
  } else if (extension === 'obj') {
    const obj = new THREE.OBJLoader().parse(data);
    registerObject(obj);
  } else if (extension === 'fbx') {
    const obj = new THREE.FBXLoader().parse(data, '');
    registerObject(obj);
  }
}

// Bucle de renderizado
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
}
animate();

// Luces y Cuadrícula (Con mayor iluminación para que no se vea oscuro)
scene.add(new THREE.AmbientLight(0xffffff, 1.2)); // Luz ambiental más potente

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 20, 15);
scene.add(dirLight);

// Luz de relleno lateral para evitar sombras negras absolutas
const fillLight = new THREE.DirectionalLight(0x90b0ff, 0.8);
fillLight.position.set(-10, -10, -10);
scene.add(fillLight);window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
