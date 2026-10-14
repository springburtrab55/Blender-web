const container = document.getElementById('viewport-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const mainCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
mainCamera.position.set(6, 6, 8);

const altCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
altCamera.position.set(0, 10, 12);
altCamera.lookAt(0, 0, 0);

let activeCamera = mainCamera;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const orbitControls = new THREE.OrbitControls(activeCamera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

const transformControls = new THREE.TransformControls(activeCamera, renderer.domElement);
scene.add(transformControls);

transformControls.addEventListener('dragging-changed', (event) => {
  orbitControls.enabled = !event.value;
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 15);
scene.add(dirLight);

const gridHelper = new THREE.GridHelper(25, 25, 0x555555, 0x333333);
gridHelper.position.y = -0.01;
scene.add(gridHelper);

let objectsInScene = [];
let selectedObject = null;
let currentMaterialColor = 0xdb7100;

// Sistema de selección con indicador visual en consola/interfaz
function selectObject(mesh) {
  selectedObject = mesh;
  if (mesh) {
    transformControls.attach(mesh);
    document.getElementById('info-overlay').innerText = "Objeto seleccionado y listo para transformar";
  } else {
    transformControls.detach();
  }
}

function registerAndSelectObject(mesh) {
  scene.add(mesh);
  objectsInScene.push(mesh);
  selectObject(mesh);
}

// Permitir hacer clic directo en los objetos del visor para seleccionarlos
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointerdown', (event) => {
  // Evitar que seleccione si hace clic en la barra lateral
  if (event.clientX < 270) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, activeCamera);
  const intersects = raycaster.intersectObjects(objectsInScene, true);

  if (intersects.length > 0) {
    let target = intersects[0].object;
    // Subir hasta la raíz del objeto si es un modelo compuesto
    while (target.parent && target.parent !== scene && !objectsInScene.includes(target)) {
      if (objectsInScene.includes(target.parent)) {
        target = target.parent;
        break;
      }
      target = target.parent;
    }
    selectObject(target);
  }
});

// Borrado seguro optimizado (elimina cubos y modelos importados)
document.getElementById('btn-delete').addEventListener('click', () => {
  if (!selectedObject) {
    alert("Selecciona un objeto primero.");
    return;
  }

  transformControls.detach();
  scene.remove(selectedObject);
  
  selectedObject.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
  });

  objectsInScene = objectsInScene.filter(obj => obj !== selectedObject);
  selectedObject = null;
  
  if (objectsInScene.length > 0) {
    selectObject(objectsInScene[objectsInScene.length - 1]);
  } else {
    document.getElementById('info-overlay').innerText = "Escena vacía";
  }
});

// Cubo Inicial
const initialMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 1.5, 1.5),
  new THREE.MeshStandardMaterial({ color: currentMaterialColor, roughness: 0.3 })
);
initialMesh.position.y = 0.75;
registerAndSelectObject(initialMesh);

// Botones de Geometrías
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

// Gizmos de Transformación
const modeTranslate = document.getElementById('mode-translate');
const modeRotate = document.getElementById('mode-rotate');
const modeScale = document.getElementById('mode-scale');

function updateModeButtons(activeBtn) {
  [modeTranslate, modeRotate, modeScale].forEach(b => b.classList.remove('active-mode'));
  activeBtn.classList.add('active-mode');
}

modeTranslate.addEventListener('click', () => { transformControls.setMode('translate'); updateModeButtons(modeTranslate); });
modeRotate.addEventListener('click', () => { transformControls.setMode('rotate'); updateModeButtons(modeRotate); });
modeScale.addEventListener('click', () => { transformControls.setMode('scale'); updateModeButtons(modeScale); });

// Color
document.getElementById('color-picker').addEventListener('input', (event) => {
  currentMaterialColor = event.target.value;
  if (selectedObject) {
    selectedObject.traverse((child) => {
      if (child.isMesh && child.material) child.material.color.set(currentMaterialColor);
    });
  }
});

// Luces y Cámaras
document.getElementById('btn-add-light').addEventListener('click', () => {
  const pointLight = new THREE.PointLight(0xffaa00, 1.5, 10);
  pointLight.position.set((Math.random() - 0.5) * 5, 3, (Math.random() - 0.5) * 5);
  scene.add(pointLight);
  const lightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffaa00 })
  );
  lightSphere.position.copy(pointLight.position);
  registerAndSelectObject(lightSphere);
});

document.getElementById('btn-switch-camera').addEventListener('click', () => {
  activeCamera = (activeCamera === mainCamera) ? altCamera : mainCamera;
  orbitControls.object = activeCamera;
  transformControls.camera = activeCamera;
});

// --- IMPORTADOR UNIVERSAL + SOPORTE DE ARCHIVOS ZIP (STEAM WORKSHOP) ---
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
      let modelFileKey = null;
      let modelData = null;

      // Buscar archivos compatibles dentro del ZIP del Workshop
      for (const relativePath in zipContent.files) {
        const lowerPath = relativePath.toLowerCase();
        if (lowerPath.endsWith('.glb') || lowerPath.endsWith('.gltf') || lowerPath.endsWith('.obj') || lowerPath.endsWith('.fbx')) {
          modelFileKey = relativePath;
          modelData = await zipContent.files[relativePath].async('arraybuffer');
          break;
        }
      }

      if (!modelFileKey) {
        alert("No se encontró ningún archivo 3D compatible (.glb, .obj, .fbx) dentro del archivo ZIP.");
        return;
      }

      const fileExtension = modelFileKey.split('.').pop().toLowerCase();
      processLoadedModelData(modelData, fileExtension, modelFileKey);
    } catch (err) {
      console.error(err);
      alert("Error al descomprimir el archivo ZIP de Steam Workshop.");
    }
  } else {
    const reader = new FileReader();
    const ext = fileName.split('.').pop();
    if (ext === 'obj') {
      reader.readAsText(file);
      reader.onload = (event) => processLoadedModelData(event.target.result, 'obj', file.name);
    } else {
      reader.readAsArrayBuffer(file);
      reader.onload = (event) => processLoadedModelData(event.target.result, ext, file.name);
    }
  }
  fileUploader.value = '';
});

function processLoadedModelData(data, extension, name) {
  if (extension === 'glb' || extension === 'gltf') {
    const loader = new THREE.GLTFLoader();
    loader.parse(data, '', (gltf) => {
      const model = gltf.scene;
      model.scale.set(1, 1, 1);
      registerAndSelectObject(model);
    }, (err) => alert("Error procesando GLTF/GLB"));
  } else if (extension === 'obj') {
    const loader = new THREE.OBJLoader();
    const obj = loader.parse(data);
    registerAndSelectObject(obj);
  } else if (extension === 'fbx') {
    const loader = new THREE.FBXLoader();
    const obj = loader.parse(data, '');
    registerAndSelectObject(obj);
  }
}

function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, activeCamera);
}
animate();

window.addEventListener('resize', () => {
  mainCamera.aspect = window.innerWidth / window.innerHeight;
  mainCamera.updateProjectionMatrix();
  altCamera.aspect = window.innerWidth / window.innerHeight;
  altCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
