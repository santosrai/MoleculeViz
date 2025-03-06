import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

interface MoleculeViewerProps {
  structure: any;
}

export function MoleculeViewer({ structure }: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLonePairs, setShowLonePairs] = useState(false);
  const [showBondAngles, setShowBondAngles] = useState(false);
  const [bondLengthFactor, setBondLengthFactor] = useState(1);
  const sceneObjectsRef = useRef<THREE.Object3D[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Create atoms
    const atomGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const atomMeshes = new Map();

    // Clear previous objects
    sceneObjectsRef.current.forEach(obj => scene.remove(obj));
    sceneObjectsRef.current = [];

    structure.atoms.forEach((atom: any) => {
      const material = new THREE.MeshPhongMaterial({ 
        color: atom.color,
        shininess: 100,
        specular: 0x444444
      });
      const mesh = new THREE.Mesh(atomGeometry, material);
      mesh.position.set(atom.x, atom.y, atom.z);
      scene.add(mesh);
      atomMeshes.set(atom.id, mesh);
      sceneObjectsRef.current.push(mesh);
    });

    // Create bonds between atoms - thicker and more visible
    const bondGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 16);

    structure.bonds.forEach((bond: any) => {
      const [atom1Id, atom2Id] = bond.atomIds;
      const atom1 = structure.atoms.find((a: any) => a.id === atom1Id);
      const atom2 = structure.atoms.find((a: any) => a.id === atom2Id);

      if (atom1 && atom2) {
        const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
        const originalEnd = new THREE.Vector3(atom2.x, atom2.y, atom2.z);

        // Apply bond length factor
        const direction = originalEnd.clone().sub(start).normalize();
        const distance = start.distanceTo(originalEnd);
        const adjustedDistance = distance * bondLengthFactor;
        const end = start.clone().add(direction.multiplyScalar(adjustedDistance));

        // Calculate the midpoint and length of the bond
        const midpoint = start.clone().lerp(end, 0.5);
        const bondLength = start.distanceTo(end);

        // Create the bond cylinder with better material
        const bondMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xffffff,
          shininess: 100,
          specular: 0x444444 
        });
        const bondMesh = new THREE.Mesh(bondGeometry, bondMaterial);

        // Position and scale the bond
        bondMesh.position.copy(midpoint);
        bondMesh.scale.y = bondLength;

        // Calculate rotation to align with atoms
        
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        bondMesh.setRotationFromQuaternion(quaternion);

        scene.add(bondMesh);
        sceneObjectsRef.current.push(bondMesh);

        // Add bond angles if enabled
        if (showBondAngles) {
          // Find all other bonds connected to atom1
          const connectedBonds = structure.bonds.filter(
            (b: any) => b !== bond && (b.atomIds.includes(atom1Id) || b.atomIds.includes(atom2Id))
          );

          connectedBonds.forEach((otherBond: any) => {
            const otherAtomId = otherBond.atomIds.find((id: number) => id !== atom1Id && id !== atom2Id);
            if (otherAtomId) {
              const otherAtom = structure.atoms.find((a: any) => a.id === otherAtomId);
              if (otherAtom) {
                const otherPoint = new THREE.Vector3(otherAtom.x, otherAtom.y, otherAtom.z);
                const angle = direction.angleTo(otherPoint.sub(start)) * (180 / Math.PI);

                // Create angle text
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  canvas.width = 128;
                  canvas.height = 64;
                  ctx.fillStyle = 'white';
                  ctx.font = '24px Arial';
                  ctx.fillText(`${angle.toFixed(1)}°`, 10, 32);

                  const texture = new THREE.CanvasTexture(canvas);
                  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                  const sprite = new THREE.Sprite(spriteMaterial);
                  sprite.position.copy(midpoint);
                  sprite.scale.set(2, 1, 1);
                  scene.add(sprite);
                  sceneObjectsRef.current.push(sprite);
                }
              }
            }
          });
        }
      }
    });

    // Add lone pairs if enabled
    if (showLonePairs && structure.lonePairs) {
      const lonePairGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const lonePairMaterial = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        opacity: 0.5,
        transparent: true
      });

      structure.lonePairs.forEach((lp: any) => {
        const mesh = new THREE.Mesh(lonePairGeometry, lonePairMaterial);
        mesh.position.set(lp.x, lp.y, lp.z);
        scene.add(mesh);
        sceneObjectsRef.current.push(mesh);
      });
    }

    // Enhanced lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(10, 10, 10);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-10, -10, -10);
    scene.add(light2);

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [structure, showLonePairs, showBondAngles, bondLengthFactor]);

  return (
    <div>
      <Card className="p-4 mb-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="lone-pairs" 
                checked={showLonePairs}
                onCheckedChange={(checked) => setShowLonePairs(checked as boolean)}
              />
              <label htmlFor="lone-pairs">Show Lone Pairs</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bond-angles" 
                checked={showBondAngles}
                onCheckedChange={(checked) => setShowBondAngles(checked as boolean)}
              />
              <label htmlFor="bond-angles">Show Bond Angles</label>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="bond-length">Bond Length: {bondLengthFactor.toFixed(1)}x</label>
            <input
              id="bond-length"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={bondLengthFactor}
              onChange={(e) => setBondLengthFactor(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </Card>
      <div ref={containerRef} className="w-full h-[400px] rounded-lg" />
    </div>
  );
}