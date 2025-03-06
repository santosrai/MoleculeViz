import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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

    // Track processed bond pairs to avoid duplicates
    const processedBondPairs = new Set();

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
        
        // Get the actual positions of the atoms from their meshes
        const atom1Mesh = atomMeshes.get(atom1Id);
        const atom2Mesh = atomMeshes.get(atom2Id);
        
        if (!atom1Mesh || !atom2Mesh) return;
        
        // Use the current positions of the atoms for bond calculation
        const startPos = atom1Mesh.position.clone();
        
        // For the end position, calculate it based on the direction and distance from the start atom
        // This ensures the bond always starts from the current position of atom1
        const endPos = startPos.clone().add(direction.clone().multiplyScalar(adjustedDistance));
        
        // Update the position of atom2 to the end of the bond
        if (atom2Id !== structure.atoms[0].id) {
          atom2Mesh.position.copy(endPos);
        }
        
        // Create bond cylinder
        const bondMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
        const bond = new THREE.Mesh(bondGeometry, bondMaterial);
        
        // Position bond at the midpoint between the atoms' current positions
        const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        bond.position.copy(midpoint);
        
        // Orient bond along current direction vector between atoms
        const currentDirection = endPos.clone().sub(startPos).normalize();
        bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentDirection);
        
        // Scale bond to match the current distance between atoms
        const currentDistance = startPos.distanceTo(endPos);
        bond.scale.set(1, currentDistance / 2, 1);

        scene.add(bond);
        sceneObjectsRef.current.push(bond);

        // Display bond angles if enabled
        if (showBondAngles) {
          // This section would implement bond angle visualization
          // For now, leaving as placeholder
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