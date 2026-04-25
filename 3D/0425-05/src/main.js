import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AssetManager, defaultAssetManager } from './AssetManager.js';

class RobotViewer {
    constructor(options = {}) {
        this.options = {
            container: document.body,
            modelUrl: 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
            defaultAnimation: 'Idle',
            shadowEnabled: true,
            autoRotate: false,
            backgroundColor: 0x1a1a2e,
            assetManager: defaultAssetManager,
            ...options
        };

        this.assetManager = this.options.assetManager;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = null;
        this.mixer = null;
        this.model = null;
        this.currentModelUrl = null;
        this.gltf = null;
        this.animations = [];
        this.currentAction = null;
        this.shadowEnabled = this.options.shadowEnabled;
        this.isLoaded = false;
        this.isDestroyed = false;

        this.callbacks = {
            onProgress: [],
            onLoad: [],
            onError: [],
            onAnimationChange: [],
            onModelChange: []
        };

        this.lights = [];
        this.ground = null;
        this.animationId = null;
    }

    load() {
        if (this.isLoaded) {
            console.warn('RobotViewer: 已初始化，无需重复加载');
            return this;
        }

        this._initScene();
        this._initLights();
        this._initGround();
        this._loadModel(this.options.modelUrl);
        this._startAnimationLoop();

        return this;
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 3, 8);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = this.shadowEnabled;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.options.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.target.set(0, 1, 0);
        this.controls.autoRotate = this.options.autoRotate;

        this.clock = new THREE.Clock();

        window.addEventListener('resize', () => this._onWindowResize());
    }

    _initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
        this.scene.add(ambientLight);
        this.lights.push({ type: 'ambient', light: ambientLight });

        const mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainDirectionalLight.position.set(5, 10, 5);
        mainDirectionalLight.castShadow = this.shadowEnabled;
        mainDirectionalLight.shadow.mapSize.width = 2048;
        mainDirectionalLight.shadow.mapSize.height = 2048;
        mainDirectionalLight.shadow.camera.near = 0.5;
        mainDirectionalLight.shadow.camera.far = 50;
        mainDirectionalLight.shadow.camera.left = -15;
        mainDirectionalLight.shadow.camera.right = 15;
        mainDirectionalLight.shadow.camera.top = 15;
        mainDirectionalLight.shadow.camera.bottom = -15;
        mainDirectionalLight.shadow.bias = -0.0001;
        mainDirectionalLight.shadow.normalBias = 0.02;
        this.scene.add(mainDirectionalLight);
        this.lights.push({ type: 'directional', light: mainDirectionalLight, isMain: true });

        const fillDirectionalLight = new THREE.DirectionalLight(0x87ceeb, 0.4);
        fillDirectionalLight.position.set(-5, 8, -5);
        this.scene.add(fillDirectionalLight);
        this.lights.push({ type: 'directional', light: fillDirectionalLight });

        const mainPointLight = new THREE.PointLight(0xffffff, 0.8, 30);
        mainPointLight.position.set(0, 12, 0);
        this.scene.add(mainPointLight);
        this.lights.push({ type: 'point', light: mainPointLight });

        const warmPointLight = new THREE.PointLight(0xffd700, 0.3, 20);
        warmPointLight.position.set(-5, 3, 5);
        this.scene.add(warmPointLight);
        this.lights.push({ type: 'point', light: warmPointLight });

        const coolPointLight = new THREE.PointLight(0x4fc3f7, 0.3, 20);
        coolPointLight.position.set(5, 3, -5);
        this.scene.add(coolPointLight);
        this.lights.push({ type: 'point', light: coolPointLight });
    }

    _initGround() {
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a4a,
            roughness: 0.9,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0;
        this.ground.receiveShadow = this.shadowEnabled;
        this.scene.add(this.ground);

        const gridHelper = new THREE.GridHelper(50, 50, 0x555555, 0x333333);
        gridHelper.position.y = 0.001;
        this.scene.add(gridHelper);
    }

    async _loadModel(url) {
        try {
            const gltf = await this.assetManager.loadGLTF(url, {
                onProgress: (xhr) => {
                    if (xhr.total > 0) {
                        const percent = Math.round((xhr.loaded / xhr.total * 100));
                        this._trigger('onProgress', percent, xhr.loaded, xhr.total);
                    }
                }
            });

            this._onModelLoaded(gltf, url);
        } catch (error) {
            console.error('RobotViewer: 加载模型时出错:', error);
            this._createFallbackRobot();
            this._trigger('onError', error);
        }
    }

    _onModelLoaded(gltf, url) {
        if (this.model) {
            this.scene.remove(this.model);
            if (this.currentModelUrl) {
                this.assetManager.release(this.currentModelUrl);
            }
        }

        this.gltf = gltf;
        this.model = gltf.scene;
        this.currentModelUrl = url;

        this.model.scale.set(0.8, 0.8, 0.8);

        this.model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = this.shadowEnabled;
                object.receiveShadow = this.shadowEnabled;
            }
        });

        const box = new THREE.Box3().setFromObject(this.model);
        const boxCenter = box.getCenter(new THREE.Vector3());

        this.model.position.y = -box.min.y;
        this.model.position.x = -boxCenter.x;
        this.model.position.z = -boxCenter.z;

        this.scene.add(this.model);

        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }

        if (gltf.animations && gltf.animations.length > 0) {
            this.animations = gltf.animations;
            this.mixer = new THREE.AnimationMixer(this.model);
            
            console.log('模型包含', this.animations.length, '个动画:');
            this.animations.forEach((clip, index) => {
                console.log(index, ':', clip.name);
            });

            this.playAnimation(this.options.defaultAnimation);
        } else {
            this.animations = [];
        }

        this.isLoaded = true;
        this._trigger('onModelChange', url, this.model, this.animations);
        this._trigger('onLoad', this.model, this.animations);
    }

    _createFallbackRobot() {
        if (this.model) {
            this.scene.remove(this.model);
        }

        const robotGroup = new THREE.Group();

        const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4fc3f7,
            metalness: 0.3,
            roughness: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = this.shadowEnabled;
        robotGroup.add(body);

        const headGeometry = new THREE.BoxGeometry(1.2, 1, 1);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x29b6f6,
            metalness: 0.4,
            roughness: 0.4
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3;
        head.castShadow = this.shadowEnabled;
        robotGroup.add(head);

        const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffeb3b,
            emissive: 0xffeb3b,
            emissiveIntensity: 0.5
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 3, 0.5);
        robotGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 3, 0.5);
        robotGroup.add(rightEye);

        const armGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0x03a9f4,
            metalness: 0.5,
            roughness: 0.3
        });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1, 1.8, 0);
        leftArm.castShadow = this.shadowEnabled;
        robotGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1, 1.8, 0);
        rightArm.castShadow = this.shadowEnabled;
        robotGroup.add(rightArm);

        const legGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x0288d1,
            metalness: 0.4,
            roughness: 0.4
        });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.4, 0.4, 0);
        leftLeg.castShadow = this.shadowEnabled;
        robotGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.4, 0.4, 0);
        rightLeg.castShadow = this.shadowEnabled;
        robotGroup.add(rightLeg);

        robotGroup.position.y = 0;
        robotGroup.scale.set(0.8, 0.8, 0.8);

        this.scene.add(robotGroup);
        this.model = robotGroup;

        this._createFallbackAnimation();
        this.isLoaded = true;
    }

    _createFallbackAnimation() {
        if (this.model) {
            this.mixer = new THREE.AnimationMixer(this.model);

            const positionKF = new THREE.VectorKeyframeTrack(
                '.position[y]',
                [0, 1, 2],
                [0, 0.1, 0]
            );

            const rotationKF = new THREE.NumberKeyframeTrack(
                '.rotation[y]',
                [0, 2, 4],
                [0, 0.2, 0]
            );

            const clip = new THREE.AnimationClip('idle', 4, [positionKF, rotationKF]);
            this.animations = [clip];
            
            const action = this.mixer.clipAction(clip);
            this.currentAction = action;
            action.play();
        }
    }

    _startAnimationLoop() {
        const animate = () => {
            if (this.isDestroyed) return;

            this.animationId = requestAnimationFrame(animate);

            const delta = this.clock.getDelta();

            if (this.mixer) {
                this.mixer.update(delta);
            }

            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };

        animate();
    }

    _onWindowResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _trigger(eventName, ...args) {
        const callbacks = this.callbacks[eventName];
        if (callbacks) {
            callbacks.forEach(callback => callback(...args));
        }
    }

    onProgress(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onProgress.push(callback);
        }
        return this;
    }

    onLoad(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onLoad.push(callback);
            if (this.isLoaded) {
                callback(this.model, this.animations);
            }
        }
        return this;
    }

    onError(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onError.push(callback);
        }
        return this;
    }

    onAnimationChange(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onAnimationChange.push(callback);
        }
        return this;
    }

    onModelChange(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onModelChange.push(callback);
        }
        return this;
    }

    playAnimation(animationNameOrIndex) {
        if (!this.mixer || !this.animations.length) {
            console.warn('RobotViewer: 没有可用的动画');
            return this;
        }

        let targetClip;

        if (typeof animationNameOrIndex === 'number') {
            targetClip = this.animations[animationNameOrIndex];
        } else if (typeof animationNameOrIndex === 'string') {
            targetClip = this.animations.find(clip =>
                clip.name.toLowerCase() === animationNameOrIndex.toLowerCase()
            );
        }

        if (!targetClip) {
            console.warn('RobotViewer: 未找到动画:', animationNameOrIndex);
            return this;
        }

        if (this.currentAction) {
            this.currentAction.fadeOut(0.3);
        }

        const newAction = this.mixer.clipAction(targetClip);
        newAction.reset().fadeIn(0.3).play();
        this.currentAction = newAction;

        console.log('RobotViewer: 播放动画:', targetClip.name);
        this._trigger('onAnimationChange', targetClip.name, targetClip);

        return this;
    }

    getAnimationList() {
        return this.animations.map(clip => ({
            name: clip.name,
            duration: clip.duration
        }));
    }

    getCurrentAnimation() {
        return this.currentAction ? {
            name: this.currentAction.getClip().name,
            isRunning: this.currentAction.isRunning()
        } : null;
    }

    async switchModel(url) {
        if (!url) {
            console.warn('RobotViewer: 请提供模型URL');
            return this;
        }

        console.log('RobotViewer: 切换模型:', url);
        
        if (this.assetManager.isCached(url)) {
            console.log('RobotViewer: 模型已缓存，从缓存加载:', url);
        } else {
            console.log('RobotViewer: 模型未缓存，需要加载:', url);
        }

        await this._loadModel(url);
        return this;
    }

    preloadModels(urls) {
        console.log('RobotViewer: 预加载模型:', urls);
        return this.assetManager.preload(urls, 'gltf');
    }

    setShadow(enabled) {
        this.shadowEnabled = enabled;

        if (this.renderer) {
            this.renderer.shadowMap.enabled = enabled;
        }

        if (this.model) {
            this.model.traverse((object) => {
                if (object.isMesh) {
                    object.castShadow = enabled;
                    object.receiveShadow = enabled;
                }
            });
        }

        if (this.ground) {
            this.ground.receiveShadow = enabled;
        }

        this.lights.forEach(({ light, isMain }) => {
            if (isMain && light.castShadow !== undefined) {
                light.castShadow = enabled;
            }
        });

        console.log('RobotViewer: 阴影已', enabled ? '启用' : '禁用');
        return this;
    }

    toggleShadow() {
        return this.setShadow(!this.shadowEnabled);
    }

    setAutoRotate(enabled) {
        if (this.controls) {
            this.controls.autoRotate = enabled;
        }
        return this;
    }

    setBackgroundColor(color) {
        if (this.scene) {
            this.scene.background = new THREE.Color(color);
        }
        return this;
    }

    getModel() {
        return this.model;
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getAssetManager() {
        return this.assetManager;
    }

    destroy() {
        this.isDestroyed = true;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.currentModelUrl) {
            this.assetManager.release(this.currentModelUrl);
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        if (this.controls) {
            this.controls.dispose();
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = null;
        this.mixer = null;
        this.model = null;
        this.gltf = null;
        this.animations = [];
        this.currentAction = null;
        this.lights = [];
        this.ground = null;

        console.log('RobotViewer: 已销毁');
    }
}

const MODEL_PRESETS = {
    robotExpressive: 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    robot: 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
};

const viewer = new RobotViewer()
    .onProgress((percent, loaded, total) => {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.textContent = `加载模型中... ${percent}%`;
        }
    })
    .onLoad((model, animations) => {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
        console.log('模型加载完成！可用动画:', viewer.getAnimationList());
        console.log('缓存状态:', viewer.getAssetManager().getCacheStats());
    })
    .onError((error) => {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.textContent = '使用备用模型...';
            setTimeout(() => {
                loadingDiv.style.display = 'none';
            }, 1000);
        }
    })
    .onModelChange((url, model, animations) => {
        console.log('模型已切换:', url);
        console.log('当前模型动画列表:', animations.map(a => a.name));
    })
    .load();

window.RobotViewer = RobotViewer;
window.viewer = viewer;
window.AssetManager = AssetManager;
window.MODEL_PRESETS = MODEL_PRESETS;
