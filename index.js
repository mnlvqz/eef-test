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
          sound.setRefDistance(0.1);
          sound.setLoop(true);
          sound.play();
        }
      );
      sculptures.push(
        new Sculpture(
          [3, 15, 3],
          new THREE.Vector3().setFromMatrixPosition(reticle.matrix),
          new THREE.Vector3(0.1, 0.1, 0.1),
          new THREE.Quaternion().setFromRotationMatrix(reticle.matrix),
          sound
        )
      );
      sculptures[sculptures.length - 1].addToScene(scene);
      console.log(sculptures);
    }
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
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
}
