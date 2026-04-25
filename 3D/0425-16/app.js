// 3D 旋转相册主应用逻辑
class Gallery3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.images = [];
        this.autoRotate = true;
        this.rotationSpeed = 0.005;
        this.isDragging = false;
        this.isMouseOver = false;
        this.savedAutoRotateState = true;
        this.previousMousePosition = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.meshGroup = new THREE.Group();
        
        // 默认图片配置（动物主题）
        this.animalTypes = [
            { keyword: 'dog', title: '可爱的狗狗', description: '忠诚友善的狗狗，是人类最好的朋友。它们用无尽的爱和忠诚陪伴我们每一天。' },
            { keyword: 'cat', title: '优雅的猫咪', description: '独立优雅的猫咪，有着神秘的魅力。它们时而高冷，时而黏人，总是让人着迷。' },
            { keyword: 'bird', title: '自由的鸟儿', description: '展翅翱翔的鸟儿，象征着自由与希望。它们的歌声为大自然增添了无限生机。' },
            { keyword: 'fox', title: '机灵的狐狸', description: '聪明机灵的狐狸，有着美丽的皮毛。它们在森林中穿梭，充满了智慧与灵性。' },
            { keyword: 'rabbit', title: '可爱的兔子', description: '毛茸茸的小兔子，温顺可爱。它们蹦蹦跳跳的样子总是能带来欢乐。' },
            { keyword: 'panda', title: '呆萌的熊猫', description: '国宝级的大熊猫，黑白相间的外表憨态可掬。它们是和平与友谊的象征。' },
            { keyword: 'horse', title: '奔放的骏马', description: '自由奔放的骏马，力量与优雅的完美结合。它们是人类最古老的伙伴之一。' },
            { keyword: 'deer', title: '优雅的小鹿', description: '森林中的精灵小鹿，优雅而美丽。它们轻盈的身影为大自然增添了诗意。' }
        ];
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.createGallery();
        this.setupEventListeners();
        this.animate();
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        this.scene.add(this.meshGroup);
        
        // 添加星空背景粒子
        this.addStars();
    }
    
    addStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 1000;
        const positions = new Float32Array(starsCount * 3);
        
        for (let i = 0; i < starsCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000;
            positions[i + 1] = (Math.random() - 0.5) * 2000;
            positions[i + 2] = (Math.random() - 0.5) * 2000;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0.8
        });
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }
    
    setupCamera() {
        const container = document.querySelector('.gallery-container');
        const aspect = container.clientWidth / container.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.z = 500;
        this.camera.position.y = 50;
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        const container = document.querySelector('.gallery-container');
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gallery'),
            antialias: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
    }
    
    setupLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // 主光源
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(200, 200, 200);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        // 点光源
        const pointLight1 = new THREE.PointLight(0x4a90d9, 1, 1000);
        pointLight1.position.set(300, 100, 100);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xd94a90, 1, 1000);
        pointLight2.position.set(-300, 100, 100);
        this.scene.add(pointLight2);
    }
    
    createGallery() {
        const imageCount = this.animalTypes.length;
        const radius = 300;
        const imageWidth = 100;
        const imageHeight = 150;
        const borderSize = 8; // 边框大小增加到8像素，更明显
        
        // 创建纹理加载器
        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = 'anonymous';
        
        for (let i = 0; i < imageCount; i++) {
            const angle = (i / imageCount) * Math.PI * 2;
            const animal = this.animalTypes[i];
            
            // 创建组来包含图片和边框
            const imageGroup = new THREE.Group();
            
            // 创建边框（更明显的白色边框）
            const borderGeometry = new THREE.PlaneGeometry(
                imageWidth + borderSize * 2, 
                imageHeight + borderSize * 2
            );
            const borderMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                roughness: 0.05,
                metalness: 0.5,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1,
                emissive: 0x222222,
                emissiveIntensity: 0.3
            });
            const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
            borderMesh.position.z = -5; // 明显靠后
            imageGroup.add(borderMesh);
            
            // 创建4个细长的矩形作为边框
            const borderThickness = borderSize;
            
            // 左边框
            const leftBorderGeo = new THREE.PlaneGeometry(borderThickness, imageHeight + borderThickness * 2);
            const leftBorder = new THREE.Mesh(leftBorderGeo, borderMaterial.clone());
            leftBorder.position.x = -(imageWidth / 2 + borderThickness / 2);
            leftBorder.position.z = -4;
            imageGroup.add(leftBorder);
            
            // 右边框
            const rightBorder = new THREE.Mesh(leftBorderGeo, borderMaterial.clone());
            rightBorder.position.x = imageWidth / 2 + borderThickness / 2;
            rightBorder.position.z = -4;
            imageGroup.add(rightBorder);
            
            // 上边框
            const topBottomGeo = new THREE.PlaneGeometry(imageWidth + borderThickness * 2, borderThickness);
            const topBorder = new THREE.Mesh(topBottomGeo, borderMaterial.clone());
            topBorder.position.y = imageHeight / 2 + borderThickness / 2;
            topBorder.position.z = -4;
            imageGroup.add(topBorder);
            
            // 下边框
            const bottomBorder = new THREE.Mesh(topBottomGeo, borderMaterial.clone());
            bottomBorder.position.y = -(imageHeight / 2 + borderThickness / 2);
            bottomBorder.position.z = -4;
            imageGroup.add(bottomBorder);
            
            // 创建图片平面
            const geometry = new THREE.PlaneGeometry(imageWidth, imageHeight);
            
            // 使用随机动物图片URL
            // 使用loremflickr服务获取随机动物图片
            const randomSeed = Date.now() + i * 1000; // 确保每张图片不同
            const imageUrl = `https://loremflickr.com/400/600/${animal.keyword}?random=${randomSeed}`;
            
            // 默认材质（加载中使用）
            const defaultMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                side: THREE.DoubleSide,
                roughness: 0.3,
                metalness: 0.2,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1
            });
            
            const mesh = new THREE.Mesh(geometry, defaultMaterial);
            mesh.position.z = 0; // 图片在最前面
            imageGroup.add(mesh);
            
            // 异步加载纹理
            this.loadAnimalTexture(textureLoader, imageUrl, mesh, animal);
            
            // 位置排列成圆形
            imageGroup.position.x = Math.cos(angle) * radius;
            imageGroup.position.z = Math.sin(angle) * radius;
            
            // 朝向中心
            imageGroup.lookAt(0, 0, 0);
            
            // 存储图片信息
            mesh.userData = {
                index: i,
                config: animal,
                imageGroup: imageGroup,
                imageUrl: imageUrl
            };
            
            this.meshGroup.add(imageGroup);
            this.images.push(mesh);
        }
    }
    
    loadAnimalTexture(textureLoader, url, mesh, animal) {
        textureLoader.load(
            url,
            (texture) => {
                // 加载成功
                texture.encoding = THREE.sRGBEncoding;
                const material = new THREE.MeshStandardMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    roughness: 0.3,
                    metalness: 0.1,
                    polygonOffset: true,
                    polygonOffsetFactor: 1,
                    polygonOffsetUnits: 1
                });
                mesh.material = material;
                console.log(`成功加载 ${animal.title} 图片`);
            },
            // 加载进度回调
            undefined,
            // 加载失败回调
            (error) => {
                console.warn(`加载 ${animal.title} 图片失败，使用备用方案`);
                // 失败时使用纯色背景和动物emoji
                const colors = [0x5dade2, 0xf1948a, 0x82e0aa, 0xf9e79f, 0xbb8fce, 0x85c1e9, 0xf5b7b1, 0xabebc3];
                const colorIndex = mesh.userData.index % colors.length;
                
                // 创建一个带有emoji的Canvas纹理作为备用
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 600;
                const ctx = canvas.getContext('2d');
                
                // 渐变背景
                const gradient = ctx.createLinearGradient(0, 0, 0, 600);
                gradient.addColorStop(0, `#${colors[colorIndex].toString(16).padStart(6, '0')}`);
                gradient.addColorStop(1, `#${(colors[(colorIndex + 1) % colors.length]).toString(16).padStart(6, '0')}`);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 400, 600);
                
                // 动物emoji
                const animalEmojis = {
                    'dog': '🐕',
                    'cat': '🐱',
                    'bird': '🐦',
                    'fox': '🦊',
                    'rabbit': '🐰',
                    'panda': '🐼',
                    'horse': '🐴',
                    'deer': '🦌'
                };
                const emoji = animalEmojis[animal.keyword] || '🐾';
                
                ctx.font = '180px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji, 200, 300);
                
                // 标题
                ctx.font = 'bold 32px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 3;
                ctx.strokeText(animal.title, 200, 500);
                ctx.fillText(animal.title, 200, 500);
                
                const fallbackTexture = new THREE.CanvasTexture(canvas);
                fallbackTexture.encoding = THREE.sRGBEncoding;
                
                const fallbackMaterial = new THREE.MeshStandardMaterial({
                    map: fallbackTexture,
                    side: THREE.DoubleSide,
                    roughness: 0.3,
                    metalness: 0.1,
                    polygonOffset: true,
                    polygonOffsetFactor: 1,
                    polygonOffsetUnits: 1
                });
                mesh.material = fallbackMaterial;
            }
        );
    }
    
    setupEventListeners() {
        const container = document.querySelector('.gallery-container');
        
        // 窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 鼠标进入/离开事件
        container.addEventListener('mouseenter', () => this.onMouseEnter());
        container.addEventListener('mouseleave', () => this.onMouseLeave());
        
        // 鼠标事件
        container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        container.addEventListener('mouseup', () => this.onMouseUp());
        
        // 触摸事件
        container.addEventListener('touchstart', (e) => this.onTouchStart(e));
        container.addEventListener('touchmove', (e) => this.onTouchMove(e));
        container.addEventListener('touchend', () => this.onMouseUp());
        
        // 点击事件
        container.addEventListener('click', (e) => this.onImageClick(e));
        
        // 控制按钮
        document.getElementById('autoRotate').addEventListener('click', () => this.toggleAutoRotate());
        document.getElementById('speedUp').addEventListener('click', () => this.speedUp());
        document.getElementById('speedDown').addEventListener('click', () => this.speedDown());
        document.getElementById('reset').addEventListener('click', () => this.reset());
        
        // 模态框关闭
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('imageModal').addEventListener('click', (e) => {
            if (e.target.id === 'imageModal') {
                this.closeModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    onWindowResize() {
        const container = document.querySelector('.gallery-container');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    onMouseDown(e) {
        this.isDragging = true;
        this.previousMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    onMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        
        this.targetRotation.y += deltaX * 0.01;
        this.targetRotation.x += deltaY * 0.01;
        
        // 限制垂直旋转角度
        this.targetRotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.targetRotation.x));
        
        this.previousMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    onMouseUp() {
        this.isDragging = false;
    }
    
    onMouseEnter() {
        this.isMouseOver = true;
        this.savedAutoRotateState = this.autoRotate;
        this.autoRotate = false;
    }
    
    onMouseLeave() {
        this.isMouseOver = false;
        this.autoRotate = this.savedAutoRotateState;
        this.isDragging = false;
    }
    
    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    }
    
    onTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;
        
        e.preventDefault();
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
        
        this.targetRotation.y += deltaX * 0.01;
        this.targetRotation.x += deltaY * 0.01;
        
        this.targetRotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.targetRotation.x));
        
        this.previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    }
    
    onImageClick(e) {
        const container = document.querySelector('.gallery-container');
        const rect = container.getBoundingClientRect();
        
        // 转换鼠标坐标
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        // 射线检测
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.images);
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            this.showImageDetail(clickedMesh);
        }
    }
    
    showImageDetail(mesh) {
        const config = mesh.userData.config;
        
        document.getElementById('modalTitle').textContent = config.title;
        document.getElementById('modalDescription').textContent = config.description;
        document.getElementById('modalImage').src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='800' height='600' fill='%23${config.color.toString(16).padStart(6, '0')}'/><text x='400' y='300' font-family='Arial' font-size='48' fill='white' text-anchor='middle' dominant-baseline='middle'>${config.title}</text></svg>`;
        
        document.getElementById('imageModal').style.display = 'block';
    }
    
    closeModal() {
        document.getElementById('imageModal').style.display = 'none';
    }
    
    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        this.savedAutoRotateState = this.autoRotate;
        const button = document.getElementById('autoRotate');
        button.textContent = `自动旋转: ${this.autoRotate ? '开启' : '关闭'}`;
    }
    
    speedUp() {
        this.rotationSpeed = Math.min(0.02, this.rotationSpeed + 0.002);
    }
    
    speedDown() {
        this.rotationSpeed = Math.max(0.001, this.rotationSpeed - 0.002);
    }
    
    reset() {
        this.targetRotation = { x: 0, y: 0 };
        this.rotationSpeed = 0.005;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 自动旋转
        if (this.autoRotate) {
            this.targetRotation.y += this.rotationSpeed;
        }
        
        // 平滑旋转
        this.meshGroup.rotation.y += (this.targetRotation.y - this.meshGroup.rotation.y) * 0.1;
        this.meshGroup.rotation.x += (this.targetRotation.x - this.meshGroup.rotation.x) * 0.1;
        
        // 星星背景动画
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
            this.stars.rotation.x += 0.00005;
        }
        
        // 图片缩放动画（包括边框）
        const time = Date.now() * 0.001;
        this.images.forEach((mesh, index) => {
            const scale = 1 + Math.sin(time + index * 0.5) * 0.05;
            if (mesh.userData.imageGroup) {
                mesh.userData.imageGroup.scale.set(scale, scale, scale);
            } else {
                mesh.scale.set(scale, scale, scale);
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    new Gallery3D();
});
