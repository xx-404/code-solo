import * as THREE from 'three';

class GlowingSphereElement extends HTMLElement {
    static get observedAttributes() {
        return [
            'sphere-color',
            'wireframe-color',
            'star-color',
            'background-color',
            'sphere-opacity',
            'wave-speed',
            'wave-amplitude',
            'show-stars',
            'show-wireframe',
            'auto-rotate',
            'width',
            'height'
        ];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sphere = null;
        this.latitudeLines = [];
        this.longitudeLines = [];
        this.stars = [];
        this.animationId = null;
        this.time = 0;
        this.isInitialized = false;
        
        this.config = {
            sphereColor: 0x3399ff,
            wireframeColor: 0x88ddff,
            starColor: 0xffdd00,
            backgroundColor: 0x0a0a1a,
            sphereOpacity: 0.6,
            waveSpeed: 2.0,
            waveAmplitude: 0.08,
            showStars: true,
            showWireframe: true,
            autoRotate: true,
            width: '100%',
            height: '100%'
        };
    }

    connectedCallback() {
        this.render();
        this.initScene();
        this.isInitialized = true;
    }

    disconnectedCallback() {
        this.dispose();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        const configKey = this.getAttributeToConfigKey(name);
        
        if (name === 'sphere-color' || name === 'wireframe-color' || 
            name === 'star-color' || name === 'background-color') {
            this.config[configKey] = this.parseColor(newValue);
        } else if (name === 'sphere-opacity' || name === 'wave-speed' || 
                   name === 'wave-amplitude') {
            this.config[configKey] = parseFloat(newValue);
        } else if (name === 'show-stars' || name === 'show-wireframe' || 
                   name === 'auto-rotate') {
            this.config[configKey] = newValue !== 'false';
        } else if (name === 'width' || name === 'height') {
            this.config[configKey] = newValue;
            if (this.container) {
                this.container.style[name] = newValue;
            }
        }
        
        if (this.isInitialized) {
            this.updateScene();
        }
    }

    getAttributeToConfigKey(attrName) {
        return attrName.split('-').map((word, index) => {
            if (index === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join('');
    }

    parseColor(colorStr) {
        if (colorStr.startsWith('#')) {
            return parseInt(colorStr.slice(1), 16);
        }
        if (colorStr.startsWith('0x')) {
            return parseInt(colorStr.slice(2), 16);
        }
        return parseInt(colorStr, 10);
    }

    render() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                width: ${this.config.width};
                height: ${this.config.height};
            }
            .container {
                width: 100%;
                height: 100%;
                position: relative;
                overflow: hidden;
            }
            canvas {
                display: block;
                width: 100%;
                height: 100%;
            }
        `;
        
        this.container = document.createElement('div');
        this.container.className = 'container';
        this.container.style.width = this.config.width;
        this.container.style.height = this.config.height;
        
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this.container);
    }

    createStarGeometry(outerRadius = 0.15, innerRadius = 0.07, points = 5) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            
            vertices.push(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0
            );
        }
        
        const indices = [];
        for (let i = 0; i < points * 2; i++) {
            indices.push(i, (i + 1) % (points * 2));
        }
        indices.push(0);
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        
        return geometry;
    }

    createStarsOnSphere() {
        if (!this.config.showStars) return;
        
        const starGeometry = this.createStarGeometry(0.08, 0.04, 5);
        const starMaterial = new THREE.LineBasicMaterial({
            color: this.config.starColor,
            transparent: true,
            opacity: 0.9
        });
        
        const radius = 2.01;
        const latitudeBands = 12;
        const longitudeBands = 24;
        
        for (let lat = 1; lat < latitudeBands; lat++) {
            const theta = (lat * Math.PI) / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            const longitudeCount = Math.round(longitudeBands * sinTheta);
            
            for (let lon = 0; lon < longitudeCount; lon++) {
                const phi = (lon * 2 * Math.PI) / longitudeCount;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;
                
                const star = new THREE.LineLoop(starGeometry.clone(), starMaterial.clone());
                
                star.position.set(
                    x * radius,
                    y * radius,
                    z * radius
                );
                
                const normal = new THREE.Vector3(x, y, z).normalize();
                const up = new THREE.Vector3(0, 1, 0);
                const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
                star.setRotationFromQuaternion(quaternion);
                
                star.userData = {
                    originalPosition: star.position.clone(),
                    floatOffset: Math.random() * Math.PI * 2,
                    floatSpeed: 0.5 + Math.random() * 0.5,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                    baseScale: 0.8 + Math.random() * 0.4,
                    latIndex: lat,
                    latTotal: latitudeBands
                };
                
                this.scene.add(star);
                this.stars.push(star);
            }
        }
    }

    createLatitudeLine(latitudeIndex, totalLatitudes, baseRadius) {
        const theta = (latitudeIndex * Math.PI) / totalLatitudes;
        const radiusAtLatitude = baseRadius * Math.sin(theta);
        const yPosition = baseRadius * Math.cos(theta);
        
        const segments = 128;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        for (let i = 0; i <= segments; i++) {
            const phi = (i * 2 * Math.PI) / segments;
            positions.push(
                Math.cos(phi) * radiusAtLatitude,
                yPosition,
                Math.sin(phi) * radiusAtLatitude
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: this.config.wireframeColor,
            transparent: true,
            opacity: 0.8
        });
        
        const line = new THREE.Line(geometry, material);
        
        line.userData = {
            latitudeIndex: latitudeIndex,
            totalLatitudes: totalLatitudes,
            baseRadius: baseRadius,
            yPosition: yPosition,
            theta: theta
        };
        
        return line;
    }

    createLongitudeLine(longitudeIndex, totalLongitudes, baseRadius) {
        const phi = (longitudeIndex * 2 * Math.PI) / totalLongitudes;
        
        const segments = 64;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i * Math.PI) / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            positions.push(
                Math.cos(phi) * sinTheta * baseRadius,
                cosTheta * baseRadius,
                Math.sin(phi) * sinTheta * baseRadius
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: this.config.wireframeColor,
            transparent: true,
            opacity: 0.6
        });
        
        const line = new THREE.Line(geometry, material);
        
        line.userData = {
            longitudeIndex: longitudeIndex,
            totalLongitudes: totalLongitudes,
            baseRadius: baseRadius,
            phi: phi
        };
        
        return line;
    }

    createWireframe() {
        if (!this.config.showWireframe) return;
        
        const baseRadius = 2.005;
        const totalLatitudes = 32;
        const totalLongitudes = 48;
        
        for (let i = 1; i < totalLatitudes; i++) {
            const line = this.createLatitudeLine(i, totalLatitudes, baseRadius);
            this.scene.add(line);
            this.latitudeLines.push(line);
        }
        
        for (let i = 0; i < totalLongitudes; i++) {
            const line = this.createLongitudeLine(i, totalLongitudes, baseRadius);
            this.scene.add(line);
            this.longitudeLines.push(line);
        }
    }

    initScene() {
        const containerRect = this.container.getBoundingClientRect();
        const width = containerRect.width || window.innerWidth;
        const height = containerRect.height || window.innerHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor);

        this.camera = new THREE.PerspectiveCamera(
            60,
            width / height,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x4488ff, 1.5, 20);
        pointLight1.position.set(5, 5, 5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff4488, 1, 20);
        pointLight2.position.set(-5, -5, 5);
        this.scene.add(pointLight2);

        const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);

        const sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: this.config.sphereColor,
            transparent: true,
            opacity: this.config.sphereOpacity,
            transmission: 0.3,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2,
            ior: 1.5,
            thickness: 0.5,
            side: THREE.DoubleSide
        });

        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.scene.add(this.sphere);

        this.createWireframe();
        this.createStarsOnSphere();

        window.addEventListener('resize', this.handleResize.bind(this));

        this.animate();
    }

    updateScene() {
        if (this.scene) {
            this.scene.background = new THREE.Color(this.config.backgroundColor);
        }
        
        if (this.sphere) {
            this.sphere.material.color.setHex(this.config.sphereColor);
            this.sphere.material.opacity = this.config.sphereOpacity;
        }
    }

    handleResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        
        const containerRect = this.container.getBoundingClientRect();
        const width = containerRect.width || window.innerWidth;
        const height = containerRect.height || window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    updateLatitudeWave(time) {
        const waveSpeed = this.config.waveSpeed;
        const waveAmplitude = this.config.waveAmplitude;
        const waveFrequency = 8;
        
        this.latitudeLines.forEach(line => {
            const userData = line.userData;
            const geometry = line.geometry;
            const positions = geometry.attributes.position.array;
            
            const normalizedY = (userData.latitudeIndex / userData.totalLatitudes);
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];
                
                const phi = Math.atan2(z, x);
                
                const waveOffset = Math.sin(
                    time * waveSpeed + 
                    normalizedY * waveFrequency * Math.PI +
                    phi * 2
                ) * waveAmplitude;
                
                const verticalWave = Math.sin(
                    time * waveSpeed * 0.7 +
                    normalizedY * waveFrequency * Math.PI * 0.5
                ) * waveAmplitude * 0.5;
                
                const newRadius = userData.baseRadius + waveOffset;
                const radiusAtLatitude = newRadius * Math.sin(userData.theta);
                const newYPosition = newRadius * Math.cos(userData.theta) + verticalWave;
                
                const normalizedPhi = Math.atan2(z, x);
                positions[i] = Math.cos(normalizedPhi) * radiusAtLatitude;
                positions[i + 1] = newYPosition;
                positions[i + 2] = Math.sin(normalizedPhi) * radiusAtLatitude;
            }
            
            geometry.attributes.position.needsUpdate = true;
            
            const material = line.material;
            const brightness = 0.5 + Math.sin(time * 2 + normalizedY * Math.PI * 2) * 0.3;
            material.opacity = 0.4 + brightness * 0.4;
        });
    }

    updateLongitudeWave(time) {
        const waveSpeed = this.config.waveSpeed * 0.75;
        const waveAmplitude = this.config.waveAmplitude * 0.625;
        
        this.longitudeLines.forEach(line => {
            const userData = line.userData;
            const geometry = line.geometry;
            const positions = geometry.attributes.position.array;
            
            const normalizedPhi = userData.longitudeIndex / userData.totalLongitudes;
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];
                
                const theta = Math.acos(y / userData.baseRadius);
                const normalizedY = theta / Math.PI;
                
                const waveOffset = Math.sin(
                    time * waveSpeed + 
                    normalizedY * 12 * Math.PI +
                    normalizedPhi * 4 * Math.PI
                ) * waveAmplitude;
                
                const direction = new THREE.Vector3(x, y, z).normalize();
                const newRadius = userData.baseRadius + waveOffset;
                const newPos = direction.multiplyScalar(newRadius);
                
                positions[i] = newPos.x;
                positions[i + 1] = newPos.y;
                positions[i + 2] = newPos.z;
            }
            
            geometry.attributes.position.needsUpdate = true;
            
            const material = line.material;
            const brightness = 0.5 + Math.sin(time * 1.5 + normalizedPhi * Math.PI * 4) * 0.3;
            material.opacity = 0.3 + brightness * 0.3;
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        this.time += 0.01;

        if (this.sphere && this.config.autoRotate) {
            this.sphere.rotation.y = this.time * 0.1;
            this.sphere.rotation.x = Math.sin(this.time * 0.1) * 0.05;
            this.sphere.material.opacity = this.config.sphereOpacity * (0.83 + Math.sin(this.time * 1.5) * 0.17);
        }

        if (this.config.showWireframe) {
            this.updateLatitudeWave(this.time);
            this.updateLongitudeWave(this.time);
        }

        if (this.config.showStars) {
            this.stars.forEach(star => {
                const userData = star.userData;
                
                star.rotation.z += userData.rotationSpeed;
                
                const waveOffset = Math.sin(
                    this.time * 2 + 
                    (userData.latIndex / userData.latTotal) * 8 * Math.PI +
                    userData.floatOffset
                ) * 0.05;
                
                const direction = userData.originalPosition.clone().normalize();
                star.position.copy(userData.originalPosition).add(direction.multiplyScalar(waveOffset));
                
                const pulseScale = userData.baseScale * (1 + Math.sin(this.time * 2 + userData.floatOffset) * 0.1);
                star.scale.setScalar(pulseScale);
                
                const material = star.material;
                material.opacity = 0.6 + Math.sin(this.time * 1.5 + userData.floatOffset) * 0.3;
            });
        }

        this.camera.position.x = Math.sin(this.time * 0.3) * 0.3;
        this.camera.position.y = Math.cos(this.time * 0.2) * 0.2;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        window.removeEventListener('resize', this.handleResize.bind(this));
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.stars.forEach(star => {
            star.geometry.dispose();
            star.material.dispose();
        });
        
        [...this.latitudeLines, ...this.longitudeLines].forEach(line => {
            line.geometry.dispose();
            line.material.dispose();
        });
        
        if (this.sphere) {
            this.sphere.geometry.dispose();
            this.sphere.material.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
        
        this.stars = [];
        this.latitudeLines = [];
        this.longitudeLines = [];
        this.isInitialized = false;
    }

    getSphere() {
        return this.sphere;
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }
}

customElements.define('glowing-sphere', GlowingSphereElement);

export default GlowingSphereElement;
