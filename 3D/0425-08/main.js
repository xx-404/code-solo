import * as THREE from 'three';

let scene, camera, renderer;
let sphere;
let latitudeLines = [];
let longitudeLines = [];
let stars = [];
let time = 0;

function createStarGeometry(outerRadius = 0.15, innerRadius = 0.07, points = 5) {
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

function createStarsOnSphere() {
    const starGeometry = createStarGeometry(0.08, 0.04, 5);
    const starMaterial = new THREE.LineBasicMaterial({
        color: 0xffdd00,
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
            
            scene.add(star);
            stars.push(star);
        }
    }
}

function createLatitudeLine(latitudeIndex, totalLatitudes, baseRadius) {
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
        color: 0x88ddff,
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

function createLongitudeLine(longitudeIndex, totalLongitudes, baseRadius) {
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
        color: 0x88ddff,
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

function createWireframe() {
    const baseRadius = 2.005;
    const totalLatitudes = 32;
    const totalLongitudes = 48;
    
    for (let i = 1; i < totalLatitudes; i++) {
        const line = createLatitudeLine(i, totalLatitudes, baseRadius);
        scene.add(line);
        latitudeLines.push(line);
    }
    
    for (let i = 0; i < totalLongitudes; i++) {
        const line = createLongitudeLine(i, totalLongitudes, baseRadius);
        scene.add(line);
        longitudeLines.push(line);
    }
}

function updateLatitudeWave(time) {
    const waveSpeed = 2.0;
    const waveAmplitude = 0.08;
    const waveFrequency = 8;
    
    latitudeLines.forEach(line => {
        const userData = line.userData;
        const geometry = line.geometry;
        const positions = geometry.attributes.position.array;
        
        const normalizedY = (userData.latitudeIndex / userData.totalLatitudes);
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            const currentPos = new THREE.Vector3(x, y, z);
            const baseRadius = userData.baseRadius;
            const direction = currentPos.clone().normalize();
            
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
            
            const newRadius = baseRadius + waveOffset;
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

function updateLongitudeWave(time) {
    const waveSpeed = 1.5;
    const waveAmplitude = 0.05;
    
    longitudeLines.forEach(line => {
        const userData = line.userData;
        const geometry = line.geometry;
        const positions = geometry.attributes.position.array;
        
        const normalizedPhi = userData.longitudeIndex / userData.totalLongitudes;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            const currentPos = new THREE.Vector3(x, y, z);
            const baseRadius = userData.baseRadius;
            const direction = currentPos.clone().normalize();
            
            const theta = Math.acos(y / baseRadius);
            const normalizedY = theta / Math.PI;
            
            const waveOffset = Math.sin(
                time * waveSpeed + 
                normalizedY * 12 * Math.PI +
                normalizedPhi * 4 * Math.PI
            ) * waveAmplitude;
            
            const newRadius = baseRadius + waveOffset;
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

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x4488ff, 1.5, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff4488, 1, 20);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);

    const sphereMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x3399ff,
        transparent: true,
        opacity: 0.6,
        transmission: 0.3,
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        ior: 1.5,
        thickness: 0.5,
        side: THREE.DoubleSide
    });

    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    createWireframe();

    createStarsOnSphere();

    window.addEventListener('resize', onWindowResize);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    time += 0.01;

    sphere.rotation.y = time * 0.1;
    sphere.rotation.x = Math.sin(time * 0.1) * 0.05;

    const sphereMaterial = sphere.material;
    sphereMaterial.opacity = 0.5 + Math.sin(time * 1.5) * 0.1;

    updateLatitudeWave(time);
    updateLongitudeWave(time);

    stars.forEach(star => {
        const userData = star.userData;
        
        star.rotation.z += userData.rotationSpeed;
        
        const waveOffset = Math.sin(
            time * 2 + 
            (userData.latIndex / userData.latTotal) * 8 * Math.PI +
            userData.floatOffset
        ) * 0.05;
        
        const direction = userData.originalPosition.clone().normalize();
        star.position.copy(userData.originalPosition).add(direction.multiplyScalar(waveOffset));
        
        const pulseScale = userData.baseScale * (1 + Math.sin(time * 2 + userData.floatOffset) * 0.1);
        star.scale.setScalar(pulseScale);
        
        const material = star.material;
        material.opacity = 0.6 + Math.sin(time * 1.5 + userData.floatOffset) * 0.3;
    });

    camera.position.x = Math.sin(time * 0.3) * 0.3;
    camera.position.y = Math.cos(time * 0.2) * 0.2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

init();
