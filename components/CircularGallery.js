"use client";

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { useEffect, useRef } from "react";

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}

class Media {
  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    viewport,
    bend,
    borderRadius = 0,
    originalIndex,
    onClick,
  }) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.viewport = viewport;
    this.bend = bend;
    this.borderRadius = borderRadius;
    this.originalIndex = originalIndex;
    this.onClick = onClick;
    this.createShader();
    this.createMesh();
    this.onResize();
  }
  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true,
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        uniform float uOpacity;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          
          // Smooth antialiasing for edges
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          gl_FragColor = vec4(color.rgb, alpha * uOpacity);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
        uOpacity: { value: 0 },
      },
      transparent: true,
    });
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
      // Fade in animation
      this.fadeIn();
    };
  }
  fadeIn() {
    const duration = 500; // ms
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      this.program.uniforms.uOpacity.value = eased;
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });
    this.plane.setParent(this.scene);
  }
  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === "right" && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === "left" && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }
  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (950 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (750 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class GalleryApp {
  constructor(
    container,
    {
      items,
      bend,
      borderRadius = 0,
      scrollSpeed = 2,
      scrollEase = 0.05,
      autoRotate = false,
      autoRotateSpeed = 0.5,
      onImageClick,
      disableWheel = false,
    } = {}
  ) {
    document.documentElement.classList.remove("no-js");
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.autoRotate = autoRotate;
    this.autoRotateSpeed = autoRotateSpeed;
    this.isInteracting = false;
    this.idleTimer = null;
    this.onImageClick = onImageClick;
    this.disableWheel = disableWheel;
    this.onCheckDebounce = debounce(this.onCheck, 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, borderRadius);

    // Set initial scroll position to start from left (negative offset to show first image on the left)
    const initialOffset = this.viewport ? this.viewport.width * 0.35 : -5;
    this.scroll = { ease: scrollEase, current: initialOffset, target: initialOffset, last: initialOffset };

    this.update();
    this.addEventListeners();
  }
  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }
  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }
  createScene() {
    this.scene = new Transform();
  }
  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100,
    });
  }
  createMedias(items, bend = 1, borderRadius) {
    if (!items || items.length === 0) {
      this.medias = [];
      return;
    }

    // Store original items length before duplication
    this.originalItemsLength = items.length;

    // Duplicate items for seamless infinite scroll, preserving originalIndex
    const itemsWithIndex = items.map((item, idx) => ({
      ...item,
      originalIndex: item.originalIndex ?? idx,
    }));

    this.mediasImages = items.length > 3
      ? itemsWithIndex.concat(itemsWithIndex)
      : itemsWithIndex.concat(itemsWithIndex).concat(itemsWithIndex);

    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        viewport: this.viewport,
        bend,
        borderRadius,
        originalIndex: data.originalIndex,
        onClick: () => this.onImageClick?.(data.originalIndex),
      });
    });
  }
  onTouchDown(e) {
    // Only handle events within our container
    if (!this.container.contains(e.target)) return;

    this.isDown = true;
    this.isInteracting = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
    this.startY = e.touches ? e.touches[0].clientY : e.clientY;
    this.clickStart = { x: this.start, y: this.startY };

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
  }
  onTouchMove(e) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }
  onTouchUp(e) {
    if (!this.isDown) return;

    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    // Check if it was a click (minimal movement)
    const deltaX = Math.abs(endX - this.clickStart.x);
    const deltaY = Math.abs(endY - this.clickStart.y);

    if (deltaX < 5 && deltaY < 5 && this.medias && this.onImageClick) {
      // Find the clicked media based on click position relative to container
      const rect = this.container.getBoundingClientRect();
      const clickXInContainer = endX - rect.left;
      const clickedMedia = this.findMediaAtPosition(clickXInContainer);

      if (clickedMedia) {
        this.onImageClick(clickedMedia.originalIndex);
      }
    }

    this.isDown = false;
    this.onCheck();

    // Resume auto-rotate after idle
    this.idleTimer = setTimeout(() => {
      this.isInteracting = false;
    }, 2000);
  }
  findMediaAtPosition(clickX) {
    if (!this.medias || !this.screen) return null;

    // Convert click X position to viewport coordinates
    const normalizedX = (clickX / this.screen.width - 0.5) * this.viewport.width;

    let closestMedia = null;
    let closestDistance = Infinity;

    this.medias.forEach((media) => {
      // Get the current position of this media plane
      const mediaX = media.plane.position.x;
      const halfWidth = media.plane.scale.x / 2;

      // Check if click is within this media's bounds
      if (normalizedX >= mediaX - halfWidth && normalizedX <= mediaX + halfWidth) {
        const distance = Math.abs(normalizedX - mediaX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestMedia = media;
        }
      }
    });

    // If no direct hit, find the closest one
    if (!closestMedia) {
      this.medias.forEach((media) => {
        const distance = Math.abs(normalizedX - media.plane.position.x);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestMedia = media;
        }
      });
    }

    return closestMedia;
  }
  findCenterMedia() {
    if (!this.medias) return -1;
    let closestIndex = -1;
    let closestDistance = Infinity;

    this.medias.forEach((media, index) => {
      const distance = Math.abs(media.plane.position.x);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }
  onWheel(e) {
    // Only handle events within our container
    if (!this.container.contains(e.target)) return;

    e.preventDefault();
    this.isInteracting = true;

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();

    // Resume auto-rotate after idle
    this.idleTimer = setTimeout(() => {
      this.isInteracting = false;
    }, 2000);
  }
  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }
  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }
  update() {
    // Auto-rotate when idle
    if (this.autoRotate && !this.isInteracting && !this.isDown) {
      this.scroll.target += this.autoRotateSpeed * 0.01;
    }

    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? "right" : "left";
    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);

    window.addEventListener("resize", this.boundOnResize);

    // Use container-scoped events for better control
    if (!this.disableWheel) {
      this.container.addEventListener("wheel", this.boundOnWheel, { passive: false });
    }
    this.container.addEventListener("mousedown", this.boundOnTouchDown);
    this.container.addEventListener("touchstart", this.boundOnTouchDown, { passive: true });

    window.addEventListener("mousemove", this.boundOnTouchMove);
    window.addEventListener("mouseup", this.boundOnTouchUp);
    window.addEventListener("touchmove", this.boundOnTouchMove, { passive: true });
    window.addEventListener("touchend", this.boundOnTouchUp);
  }
  destroy() {
    window.cancelAnimationFrame(this.raf);

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    window.removeEventListener("resize", this.boundOnResize);

    if (!this.disableWheel) {
      this.container.removeEventListener("wheel", this.boundOnWheel);
    }
    this.container.removeEventListener("mousedown", this.boundOnTouchDown);
    this.container.removeEventListener("touchstart", this.boundOnTouchDown);

    window.removeEventListener("mousemove", this.boundOnTouchMove);
    window.removeEventListener("mouseup", this.boundOnTouchUp);
    window.removeEventListener("touchmove", this.boundOnTouchMove);
    window.removeEventListener("touchend", this.boundOnTouchUp);

    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

/**
 * CircularGallery - WebGL-based circular/orbital image gallery
 * 
 * @param {Object} props
 * @param {Array<{image: string, text?: string}>} props.items - Array of items with image URL and optional text
 * @param {number} props.bend - Curvature of the gallery arc (0 = flat, positive = curve down, negative = curve up)
 * @param {string} props.textColor - Color of text labels
 * @param {number} props.borderRadius - Border radius for images (0-0.5)
 * @param {string} props.font - Font for text labels
 * @param {number} props.scrollSpeed - Speed of scroll interaction
 * @param {number} props.scrollEase - Easing factor for scroll (0-1)
 * @param {boolean} props.autoRotate - Enable auto-rotation when idle
 * @param {number} props.autoRotateSpeed - Speed of auto-rotation
 * @param {function} props.onImageClick - Callback when image is clicked (receives index)
 */
export default function CircularGallery({
  items,
  bend = 3,
  borderRadius = 0.05,
  scrollSpeed = 2,
  scrollEase = 0.05,
  autoRotate = false,
  autoRotateSpeed = 0.5,
  onImageClick,
  disableWheel = false,
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const onImageClickRef = useRef(onImageClick);

  // Keep callback ref updated without triggering re-render
  useEffect(() => {
    onImageClickRef.current = onImageClick;
  }, [onImageClick]);

  // Stable stringified items for dependency comparison
  const itemsKey = JSON.stringify(items?.map(i => i.image) || []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing instance if any
    if (appRef.current) {
      appRef.current.destroy();
      appRef.current = null;
    }

    appRef.current = new GalleryApp(containerRef.current, {
      items,
      bend,
      borderRadius,
      scrollSpeed,
      scrollEase,
      autoRotate,
      autoRotateSpeed,
      onImageClick: (index) => onImageClickRef.current?.(index),
      disableWheel,
    });

    return () => {
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, bend, borderRadius]);

  return (
    <div
      ref={containerRef}
      className="circular-gallery"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: "grab",
      }}
    />
  );
}
