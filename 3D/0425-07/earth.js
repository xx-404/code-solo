// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 创建地球
const geometry = new THREE.SphereGeometry(2, 64, 64);

// 使用纹理加载器
const textureLoader = new THREE.TextureLoader();
// 设置跨域，允许加载外部纹理
textureLoader.setCrossOrigin('anonymous');

// 创建备用材质（如果纹理加载失败时使用）
// 使用 MeshBasicMaterial 确保即使光照有问题也能显示
const fallbackMaterial = new THREE.MeshBasicMaterial({
    color: 0x4a9eff,
    wireframe: false
});

let material = fallbackMaterial;
let earth = null;

// 尝试加载纹理
function loadTextures() {
    let loadedCount = 0;
    const totalTextures = 3;
    let earthTexture = null;
    let normalTexture = null;
    let specularTexture = null;
    
    // 检查所有纹理是否加载完成
    function checkAllLoaded() {
        loadedCount++;
        if (loadedCount === totalTextures) {
            // 所有纹理加载成功，创建带有纹理的材质
            material = new THREE.MeshPhongMaterial({
                map: earthTexture,
                normalMap: normalTexture,
                specularMap: specularTexture,
                specular: new THREE.Color(0x333333),
                shininess: 15
            });
            if (earth) {
                earth.material = material;
            }
            console.log('所有纹理加载成功');
        }
    }
    
    // 纹理加载失败处理
    function onTextureError(error) {
        console.warn('纹理加载失败，使用备用材质:', error);
        // 即使一个纹理失败，也使用备用材质
        loadedCount = totalTextures + 1; // 标记为全部处理
    }
    
    // 加载地球表面纹理
    earthTexture = textureLoader.load(
        'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
        checkAllLoaded,
        undefined,
        onTextureError
    );
    
    // 加载地球法线贴图（增加表面细节）
    normalTexture = textureLoader.load(
        'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
        checkAllLoaded,
        undefined,
        onTextureError
    );
    
    // 加载地球高光贴图
    specularTexture = textureLoader.load(
        'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
        checkAllLoaded,
        undefined,
        onTextureError
    );
}

// 先使用备用材质创建地球
earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// 尝试加载纹理
loadTextures();

// 创建线框网格
const wireframeGeometry = new THREE.SphereGeometry(2.01, 32, 32);
const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
scene.add(wireframe);

// 颜色循环相关变量
const colors = [0xff0000, 0xff8800, 0x00ff00, 0x0088ff]; // 红、橙、绿、蓝
let colorIndex = 0;
let colorProgress = 0;
const colorChangeSpeed = 0.005;

// 创建地球大气层效果
const atmosphereGeometry = new THREE.SphereGeometry(2.05, 64, 64);
const atmosphereMaterial = new THREE.MeshPhongMaterial({
    color: 0x0088ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
scene.add(atmosphere);

// 添加光源
// 环境光
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// 平行光（模拟太阳）
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

// 创建球体内部的发光粒子
const innerParticleGeometry = new THREE.SphereGeometry(0.3, 32, 32);
const innerParticleMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.8
});
const innerParticle = new THREE.Mesh(innerParticleGeometry, innerParticleMaterial);
scene.add(innerParticle);

// 添加点光源模拟发光效果
const innerLight = new THREE.PointLight(0xffff00, 2, 10);
innerLight.position.set(0, 0, 0);
scene.add(innerLight);

// 发光粒子动画相关变量
let particleTime = 0;
const particleRadius = 0.8;

// 添加星星背景
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    sizeAttenuation: true
});

const starsVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    starsVertices.push(x, y, z);
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// 设置相机位置
camera.position.z = 5;

// 窗口大小调整
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 简单的鼠标交互
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;
let rotationX = 0;
let rotationY = 0;

document.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

document.addEventListener('mouseup', () => {
    isMouseDown = false;
});

document.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;
        
        rotationY += deltaX * 0.005;
        rotationX += deltaY * 0.005;
        
        // 限制垂直旋转角度
        rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));
        
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// 缩放功能
document.addEventListener('wheel', (e) => {
    camera.position.z += e.deltaY * 0.005;
    // 限制相机距离
    camera.position.z = Math.max(3, Math.min(10, camera.position.z));
});

// 颜色插值函数
function lerpColor(color1, color2, t) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return c1.lerp(c2, t);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 更新线框颜色循环
    colorProgress += colorChangeSpeed;
    if (colorProgress >= 1) {
        colorProgress = 0;
        colorIndex = (colorIndex + 1) % colors.length;
    }
    
    const currentColorIndex = colorIndex;
    const nextColorIndex = (colorIndex + 1) % colors.length;
    const interpolatedColor = lerpColor(colors[currentColorIndex], colors[nextColorIndex], colorProgress);
    wireframeMaterial.color = interpolatedColor;
    
    // 地球缓慢自转（如果用户没有在拖动）
    if (!isMouseDown) {
        earth.rotation.y += 0.002;
        atmosphere.rotation.y += 0.002;
        wireframe.rotation.y += 0.002;
    }
    
    // 应用用户旋转
    earth.rotation.x = rotationX;
    atmosphere.rotation.x = rotationX;
    wireframe.rotation.x = rotationX;
    
    if (!isMouseDown) {
        rotationY = earth.rotation.y;
    } else {
        earth.rotation.y = rotationY;
        atmosphere.rotation.y = rotationY;
        wireframe.rotation.y = rotationY;
    }
    
    // 更新内部发光粒子的位置和动画
    particleTime += 0.02;
    const particleX = Math.cos(particleTime) * particleRadius;
    const particleY = Math.sin(particleTime * 0.7) * particleRadius;
    const particleZ = Math.sin(particleTime * 1.3) * particleRadius;
    
    innerParticle.position.set(particleX, particleY, particleZ);
    innerLight.position.set(particleX, particleY, particleZ);
    
    // 粒子闪烁效果
    const pulse = (Math.sin(particleTime * 3) + 1) / 2;
    innerParticleMaterial.opacity = 0.6 + pulse * 0.4;
    innerLight.intensity = 1.5 + pulse * 1.5;
    
    // 星星缓慢旋转
    stars.rotation.y += 0.0005;
    
    renderer.render(scene, camera);
}

animate();
