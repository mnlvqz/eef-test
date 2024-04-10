import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { PositionalAudio } from "three";

export class Sculpture {
  constructor(dimensions, position, scale, quaternion, sound) {
    this.dimensions = dimensions;
    this.sound = sound;
    this.components = new THREE.Group();

    for (let k = 0; k < dimensions[2]; k++) {
      for (let j = 0; j < dimensions[1]; j++) {
        for (let i = 0; i < dimensions[0]; i++) {
          // Calculate element's coordinate
          const coordinate = new THREE.Vector3(
            i - dimensions[0] * 0.5 + 0.5,
            dimensions[1] - j,
            k - dimensions[2] * 0.5 + 0.5
          );

          // Set random element's type
          let type = Math.floor(Math.random() * 6);

          // Create random phong material
          let material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(0.0, 0.0, Math.random()),
          });

          // Define geometry and mesh
          let geometry, mesh;

          // Set geometries and meshes
          switch (type) {
            case 0:
              // Add dot object to components' group
              geometry = new THREE.SphereGeometry(1.0, 16.0, 8.0);
              geometry.rotateY(Math.random() * Math.PI * 2);
              geometry.scale(0.0625, 0.0625, 0.0625);
              mesh = new THREE.Mesh(geometry, material);
              mesh.position.set(coordinate.x, coordinate.y, coordinate.z);
              this.components.add(mesh);
              break;
            case 1:
              // Add cross object to components' group
              geometry = BufferGeometryUtils.mergeGeometries([
                new THREE.CylinderGeometry(0.1, 0.1, 2.0).rotateZ(
                  Math.PI * 0.25
                ),
                new THREE.CylinderGeometry(0.1, 0.1, 2.0).rotateZ(
                  Math.PI * -0.25
                ),
              ]);
              geometry.rotateY(Math.random() * Math.PI * 2);
              geometry.scale(0.125, 0.125, 0.125);
              mesh = new THREE.Mesh(geometry, material);
              mesh.position.set(coordinate.x, coordinate.y, coordinate.z);
              this.components.add(mesh);
              break;
            case 2:
              // Add rings to group and add it to components' group
              const ringGroup = new THREE.Group();
              const baseScale = Math.random() * 2.0 + 0.1;
              const ringInstances = 5;
              for (let ring = 1; ring <= ringInstances; ring++) {
                geometry = new THREE.TorusGeometry(1, 0.015625, 16, 32);
                mesh = new THREE.Mesh(geometry, material);
                mesh.uScale = ring / ringInstances;
                mesh.scale.set(mesh.uScale, mesh.uScale, mesh.uScale);
                ringGroup.add(mesh);
              }
              ringGroup.position.set(coordinate.x, coordinate.y, coordinate.z);
              ringGroup.scale.set(baseScale, baseScale, baseScale);
              ringGroup.rotateX(Math.random() * Math.PI * 2);
              ringGroup.rotateY(Math.random() * Math.PI * 2);
              ringGroup.rotateZ(Math.random() * Math.PI * 2);
              this.components.add(ringGroup);
              break;
          }
        }
      }
    }

    //removeRandomElements(percentage);

    this.components.position.copy(position);
    this.components.scale.copy(scale);
    this.components.quaternion.copy(quaternion);

    //this.sound.play();

    console.log(this.components);
  }

  addToScene(scene) {
    scene.add(this.components);
  }
  update() {
    this.components.children.forEach((component) => {
      if (component.type === "Mesh") {
        component.rotation.y += 0.05;
      } else if (component.type === "Group") {
        const increment = 0.005;
        component.children.forEach((element) => {
          if (element.uScale > 1.0) {
            element.uScale = 0.01;
          }
          element.scale.set(element.uScale, element.uScale, element.uScale);
          element.uScale += increment;
        });
      }
    });
  }

  removeRandomElements(percentage) {
    const amountToRemove = Math.floor(this.components.length * percentage);
    for (let i = 0; i < amountToRemove; i++) {
      const index = Math.floor(Math.random() * this.components.length);
      this.components.splice(index, 1);
    }
  }
}
