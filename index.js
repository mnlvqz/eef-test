import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { PositionalAudio } from "three";
import { Sculpture } from "sculpture";

let container;
let camera, scene, renderer;
let controller;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

let sculptures = [];

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  //

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  //

  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
  );

  //

  const playlist = document.getElementById("playlist");
  const listener = new THREE.AudioListener();
  camera.add(listener);

  //

  function onSelect() {
    if (reticle.visible) {
      const sound = new THREE.PositionalAudio(listener);
      const soundIndex = Math.floor(Math.random() * 22 + 1);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(
        "./sounds/sound-" + soundIndex + ".ogg",
        function (buffer) {
          sound.setBuffer(buffer);
          sound.setRefDistance(0.01);
          sound.setLoop(true);
          sound.play();
        }
      );
      const soundMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3, 15, 3),
        new THREE.MeshBasicMaterial({ visible: false })
      );

      reticle.matrix.decompose(
        soundMesh.position,
        soundMesh.quaternion,
        soundMesh.scale
      );
      soundMesh.scale.set(1.0, 1.0, 1.0);
      soundMesh.position.y += 0.75;

      soundMesh.add(sound);

      const uScale = Math.random() * 0.1 + 0.05;

      sculptures.push(
        new Sculpture(
          [3, 15, 3],
          new THREE.Vector3().setFromMatrixPosition(reticle.matrix),
          new THREE.Vector3(uScale, uScale, uScale),
          new THREE.Quaternion().setFromRotationMatrix(reticle.matrix),
          soundMesh
        )
      );
      sculptures[sculptures.length - 1].addToScene(scene);
      console.log(sculptures);
    }
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);
  /*
  const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(
    -Math.PI / 2
  );
  */

  const reticleGeometry = new THREE.TorusGeometry(0.1, 0.075, 32, 32).rotateX(
    -Math.PI / 2
  );
  reticleGeometry.scale(1.0, 0.1, 1.0);

  const reticleMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
  });

  const alphaMap = new THREE.TextureLoader().load("./textures/alpha.png");
  reticleMaterial.alphaMap = alphaMap;
  reticleMaterial.alphaMap.magFilter = THREE.NearestFilter;
  reticleMaterial.alphaMap.wrapT = THREE.RepeatWrapping;
  reticleMaterial.alphaMap.repeat.y = 1;

  reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace("viewer").then(function (referenceSpace) {
        session
          .requestHitTestSource({ space: referenceSpace })
          .then(function (source) {
            hitTestSource = source;
          });
      });

      session.addEventListener("end", function () {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });

      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length) {
        const hit = hitTestResults[0];

        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);

  sculptures.forEach((s) => {
    s.update();
  });

  reticle.material.alphaMap.offset.y += 0.05;
}
