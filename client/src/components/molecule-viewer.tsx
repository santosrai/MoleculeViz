import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface MoleculeViewerProps {
  structure: any;
}

export function MoleculeViewer({ structure }: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

    structure.atoms.forEach((atom: any) => {
      const material = new THREE.MeshPhongMaterial({ color: atom.color });
      const mesh = new THREE.Mesh(atomGeometry, material);
      mesh.position.set(atom.x, atom.y, atom.z);
      scene.add(mesh);
      atomMeshes.set(atom.id, mesh);
    });

    // Create bonds between atoms
    const bondGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 32);

    structure.bonds.forEach((bond: any) => {
      const [atom1Id, atom2Id] = bond.atomIds;
      const atom1 = structure.atoms.find((a: any) => a.id === atom1Id);
      const atom2 = structure.atoms.find((a: any) => a.id === atom2Id);

      if (atom1 && atom2) {
        const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
        const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);

        // Calculate the midpoint and length of the bond
        const midpoint = start.clone().lerp(end, 0.5);
        const bondLength = start.distanceTo(end);

        // Create the bond cylinder
        const bondMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
        const bondMesh = new THREE.Mesh(bondGeometry, bondMaterial);

        // Position the bond at the midpoint
        bondMesh.position.copy(midpoint);

        // Scale the bond to reach between atoms
        bondMesh.scale.y = bondLength;

        // Calculate rotation to align with atoms
        const direction = end.clone().sub(start);
        const arrow = new THREE.ArrowHelper(direction.normalize(), start);
        bondMesh.setRotationFromQuaternion(arrow.quaternion);

        scene.add(bondMesh);
      }
    });

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

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
  }, [structure]);

  return <div ref={containerRef} className="w-full h-[400px] rounded-lg" />;
}