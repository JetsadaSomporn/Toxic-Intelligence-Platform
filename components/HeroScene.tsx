"use client";

import { useRef, useCallback } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    lines: THREE.LineSegments;
    animationId: number;
  } | null>(null);

  // Initialize scene when ref is set
  const initScene = useCallback((container: HTMLDivElement | null) => {
    if (!container || sceneRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particles
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0xa855f7), // purple
      new THREE.Color(0x22d3ee), // cyan
      new THREE.Color(0xec4899), // pink
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Lines connecting nearby particles
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    const posArray = positions;
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = posArray[i * 3] - posArray[j * 3];
        const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
        const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 15) {
          linePositions.push(
            posArray[i * 3],
            posArray[i * 3 + 1],
            posArray[i * 3 + 2],
            posArray[j * 3],
            posArray[j * 3 + 1],
            posArray[j * 3 + 2]
          );

          const alpha = 1 - dist / 15;
          lineColors.push(
            0.66,
            0.33,
            0.97,
            alpha,
            0.66,
            0.33,
            0.97,
            alpha
          );
        }
      }
    }

    lineGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linePositions, 3)
    );

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.2,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Animation loop
    let time = 0;
    function animate() {
      const animationId = requestAnimationFrame(animate);
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }

      time += 0.001;

      // Rotate particles slowly
      particles.rotation.y = time * 0.2;
      particles.rotation.x = Math.sin(time) * 0.1;

      lines.rotation.y = time * 0.2;
      lines.rotation.x = Math.sin(time) * 0.1;

      // Move particles slightly
      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += Math.sin(time * 2 + i) * 0.01;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Store refs
    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles,
      lines,
      animationId: 0,
    };

    // Cleanup function

    return () => {
      window.removeEventListener("resize", handleResize);
      if (sceneRef.current) {
        sceneRef.current.renderer.dispose();
        sceneRef.current.particles.geometry.dispose();
        sceneRef.current.lines.geometry.dispose();
        container.removeChild(sceneRef.current.renderer.domElement);
        sceneRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={initScene}
      className="absolute inset-0 -z-10"
      style={{ background: "transparent" }}
    />
  );
}
