"use client";

import { useRef, useCallback } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function TubeScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneDataRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    tube: THREE.Mesh;
    curve: THREE.CatmullRomCurve3;
    animationId: number;
    scrollProgress: { value: number };
  } | null>(null);

  const initScene = useCallback((container: HTMLDivElement | null) => {
    if (!container || sceneDataRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // Renderer with performance optimization
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create curved path for the tube
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(2, 1, -10),
      new THREE.Vector3(-2, 2, -20),
      new THREE.Vector3(3, 0, -30),
      new THREE.Vector3(-1, -1, -40),
      new THREE.Vector3(2, 1, -50),
      new THREE.Vector3(0, 0, -60),
      new THREE.Vector3(-3, 2, -70),
      new THREE.Vector3(1, -1, -80),
      new THREE.Vector3(0, 0, -90),
      new THREE.Vector3(-2, 1, -100),
      new THREE.Vector3(0, 0, -110),
    ];

    const curve = new THREE.CatmullRomCurve3(points);

    // Create tube geometry
    const tubeGeometry = new THREE.TubeGeometry(curve, 300, 0.8, 32, false);

    // Custom shader material for gradient effect
    const tubeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uColor1: { value: new THREE.Color(0x6366f1) }, // Indigo
        uColor2: { value: new THREE.Color(0x8b5cf6) }, // Violet
        uColor3: { value: new THREE.Color(0xec4899) }, // Pink
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          float gradient = vUv.x;
          
          vec3 color;
          if (gradient < 0.5) {
            color = mix(uColor1, uColor2, gradient * 2.0);
          } else {
            color = mix(uColor2, uColor3, (gradient - 0.5) * 2.0);
          }
          
          // Add glow based on progress
          float glow = smoothstep(uProgress - 0.1, uProgress, gradient) * 
                       smoothstep(uProgress + 0.1, uProgress, gradient);
          color += glow * 0.5;
          
          // Edge fade
          float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
          float alpha = pow(edge, 0.5) * 0.6;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tube);

    // Add ambient particles
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const point = curve.getPointAt(t);
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      particlePositions[i * 3] = point.x + offset.x;
      particlePositions[i * 3 + 1] = point.y + offset.y;
      particlePositions[i * 3 + 2] = point.z + offset.z;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x6366f1,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Scroll progress object for GSAP
    const scrollProgress = { value: 0 };

    // Position camera at start
    const startPoint = curve.getPointAt(0);
    const startTangent = curve.getTangentAt(0);
    camera.position.copy(startPoint);
    camera.lookAt(startPoint.clone().add(startTangent));

    // Store refs
    sceneDataRef.current = {
      scene,
      camera,
      renderer,
      tube,
      curve,
      animationId: 0,
      scrollProgress,
    };

    // Animation loop
    let time = 0;
    function animate() {
      const animationId = requestAnimationFrame(animate);
      if (sceneDataRef.current) {
        sceneDataRef.current.animationId = animationId;
      }

      time += 0.01;

      // Update shader uniforms
      if (tube.material instanceof THREE.ShaderMaterial) {
        tube.material.uniforms.uTime.value = time;
        tube.material.uniforms.uProgress.value = scrollProgress.value;
      }

      // Update camera position based on scroll
      const progress = Math.min(Math.max(scrollProgress.value, 0), 0.99);
      const cameraPoint = curve.getPointAt(progress);
      const lookAtProgress = Math.min(progress + 0.01, 0.99);
      const lookAtPoint = curve.getPointAt(lookAtProgress);

      camera.position.copy(cameraPoint);
      camera.lookAt(lookAtPoint);

      // Rotate particles slightly
      particles.rotation.z = time * 0.02;

      renderer.render(scene, camera);
    }

    animate();

    // GSAP ScrollTrigger
    gsap.to(scrollProgress, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      },
    });

    // Handle resize
    const handleResize = () => {
      if (!container || !sceneDataRef.current) return;
      const { camera, renderer } = sceneDataRef.current;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      if (sceneDataRef.current) {
        cancelAnimationFrame(sceneDataRef.current.animationId);
        sceneDataRef.current.renderer.dispose();
        container.removeChild(sceneDataRef.current.renderer.domElement);
        sceneDataRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={initScene}
      className="fixed inset-0 -z-10"
      style={{ background: "#000" }}
    />
  );
}
