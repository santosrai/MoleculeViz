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
        // Get the original positions
        const originalStart = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
        const originalEnd = new THREE.Vector3(atom2.x, atom2.y, atom2.z);

        // Calculate the direction vector between atoms
        const direction = originalEnd.clone().sub(originalStart).normalize();
        const originalDistance = originalStart.distanceTo(originalEnd);

        // Calculate adjusted distance based on bond length factor
        const adjustedDistance = originalDistance * bondLengthFactor;

        // Find out which atom is central (has more connections)
        const atom1Connections = structure.bonds.filter((b: any) => b.atomIds.includes(atom1Id)).length;
        const atom2Connections = structure.bonds.filter((b: any) => b.atomIds.includes(atom2Id)).length;

        // Determine which atom to keep fixed
        let fixedAtom, movingAtom, fixedAtomId, movingAtomId;
        if (atom1Connections > atom2Connections) {
          // Atom1 is more central, keep it fixed
          fixedAtom = originalStart;
          movingAtom = originalEnd;
          fixedAtomId = atom1Id;
          movingAtomId = atom2Id;
        } else if (atom2Connections > atom1Connections) {
          // Atom2 is more central, keep it fixed
          fixedAtom = originalEnd;
          movingAtom = originalStart;
          fixedAtomId = atom2Id;
          movingAtomId = atom1Id;
        } else {
          // If equal connections, maybe atom1 is already central in the original data
          // Check if atom1 has position closer to origin
          const atom1DistToOrigin = originalStart.length();
          const atom2DistToOrigin = originalEnd.length();

          if (atom1DistToOrigin <= atom2DistToOrigin) {
            fixedAtom = originalStart;
            movingAtom = originalEnd;
            fixedAtomId = atom1Id;
            movingAtomId = atom2Id;
          } else {
            fixedAtom = originalEnd;
            movingAtom = originalStart;
            fixedAtomId = atom2Id;
            movingAtomId = atom1Id;
          }
        }

        // Calculate new position for the moving atom only
        const moveDirection = fixedAtom === originalStart ? direction : direction.negate();
        const newMovingAtomPos = fixedAtom.clone().add(moveDirection.clone().multiplyScalar(adjustedDistance));

        // Keep track of fixed and moving atom positions for rendering the bond
        const start = fixedAtom === originalStart ? fixedAtom.clone() : newMovingAtomPos.clone();
        const end = fixedAtom === originalEnd ? fixedAtom.clone() : newMovingAtomPos.clone();

        // Update only the position of the moving atom
        const movingAtomMesh = atomMeshes.get(movingAtomId);
        if (movingAtomMesh) movingAtomMesh.position.copy(newMovingAtomPos);

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
                const commonAtomId = otherBond.atomIds.find((id: number) => id === atom1Id || id === atom2Id);
                const commonAtom = structure.atoms.find((a: any) => a.id === commonAtomId);

                if (commonAtom) {
                  // Get vectors for both bonds from the common atom
                  const commonPoint = new THREE.Vector3(commonAtom.x, commonAtom.y, commonAtom.z);
                  const otherPoint = new THREE.Vector3(otherAtom.x, otherAtom.y, otherAtom.z);

                  // For the first bond vector
                  const firstBondAtomId = bond.atomIds.find((id: number) => id !== commonAtomId);
                  const firstBondAtom = structure.atoms.find((a: any) => a.id === firstBondAtomId);

                  if (firstBondAtom) {
                    const firstBondPoint = new THREE.Vector3(firstBondAtom.x, firstBondAtom.y, firstBondAtom.z);

                    // Calculate vectors from common atom to each connected atom
                    const vec1 = new THREE.Vector3().subVectors(firstBondPoint, commonPoint).normalize();
                    const vec2 = new THREE.Vector3().subVectors(otherPoint, commonPoint).normalize();

                    // Calculate the angle in degrees
                    const angle = vec1.angleTo(vec2) * (180 / Math.PI);

                    // Create a semi-transparent disc to visualize the angle
                    const radius = 1.5;
                    const segments = 32;
                    
                    // Calculate the angle between the two vectors
                    const angle = vec1.angleTo(vec2) * (180 / Math.PI);
                    
                    // Calculate the bisector vector between vec1 and vec2
                    const bisector = vec1.clone().add(vec2).normalize();
                    
                    // Start angle at -angle/2 to center the disc between the two bonds
                    const halfAngle = angle / 2;
                    const thetaStart = -halfAngle * Math.PI / 180;
                    const thetaLength = angle * Math.PI / 180;

                    const discGeometry = new THREE.CircleGeometry(radius, segments, thetaStart, thetaLength);
                    const discMaterial = new THREE.MeshBasicMaterial({ 
                      color: 0x444444, 
                      side: THREE.DoubleSide,
                      transparent: true,
                      opacity: 0.5
                    });

                    const disc = new THREE.Mesh(discGeometry, discMaterial);
                    disc.position.copy(commonPoint);

                    // Calculate rotation to align with the plane defined by the two bonds
                    const normal = new THREE.Vector3().crossVectors(vec1, vec2).normalize();

                    // If vectors are colinear, use a perpendicular vector
                    if (normal.length() < 0.1) {
                      if (Math.abs(vec1.y) < 0.9) {
                        normal.set(0, 1, 0);
                      } else {
                        normal.set(1, 0, 0);
                      }
                    }

                    // Create a rotation from the disc's default orientation to the target orientation
                    const discUpVector = new THREE.Vector3(0, 0, 1);
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(discUpVector, normal);
                    disc.setRotationFromQuaternion(quaternion);
                    
                    // Calculate the midpoint angle between vec1 and vec2
                    const midAngle = Math.atan2(bisector.y, bisector.x);
                    
                    // Rotate to align the disc's center with the bisector vector
                    const discXAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
                    const rotationAngle = discXAxis.angleTo(bisector);
                    
                    // Determine rotation direction
                    const cross = new THREE.Vector3().crossVectors(discXAxis, bisector);
                    const directionSign = cross.dot(normal) > 0 ? 1 : -1;
                    
                    // Apply rotation to position the disc between the two bonds
                    disc.rotateOnAxis(normal, directionSign * rotationAngle);

                    scene.add(disc);
                    sceneObjectsRef.current.push(disc);

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
                      
                      // Position the text in the middle of the disc
                      // Use the bisector vector we calculated earlier for text positioning
                      const textDistance = radius * 0.6; // Position at 60% of radius for better visibility
                      const textDirection = bisector.clone().multiplyScalar(textDistance);
                      const textX = commonPoint.x + textDirection.x;
                      const textY = commonPoint.y + textDirection.y;
                      const textZ = commonPoint.z + textDirection.z;
                      
                      // Apply the same rotation as the disc to maintain alignment
                      sprite.position.set(textX, textY, textZ);
                      sprite.scale.set(0.5, 0.25, 1);;

                      // Position the text slightly above the common atom
                      const textOffset = normal.clone().multiplyScalar(0.7);
                      sprite.position.copy(commonPoint.clone().add(textOffset));
                      sprite.scale.set(2, 1, 1);
                      scene.add(sprite);
                      sceneObjectsRef.current.push(sprite);
                    }
                  }
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