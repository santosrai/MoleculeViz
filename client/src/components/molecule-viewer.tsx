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

    // Create molecular structure
    const atomGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const bondGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 32);

    structure.atoms.forEach((atom: any) => {
      const material = new THREE.MeshPhongMaterial({ color: atom.color });
      const mesh = new THREE.Mesh(atomGeometry, material);
      mesh.position.set(atom.x, atom.y, atom.z);
      scene.add(mesh);
    });

    structure.bonds.forEach((bond: any) => {
      const material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
      const mesh = new THREE.Mesh(bondGeometry, material);
      mesh.position.set(bond.x, bond.y, bond.z);
      mesh.rotation.set(bond.rx, bond.ry, bond.rz);
      scene.add(mesh);
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