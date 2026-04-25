import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

class AssetManager {
    constructor(options = {}) {
        this.options = {
            maxConcurrentLoads: 3,
            enableCache: true,
            cacheSize: 100,
            enableDraco: false,
            dracoDecoderPath: 'https://www.gstatic.com/draco/v1/decoders/',
            ...options
        };

        this._cache = new Map();
        this._loadingQueue = new Map();
        this._referenceCounts = new Map();
        this._pendingRequests = new Map();
        this._activeLoads = 0;
        this._waitQueue = [];

        this._gltfLoader = null;
        this._textureLoader = null;
        this._loadingManager = null;

        this._initLoaders();
    }

    _initLoaders() {
        this._loadingManager = new THREE.LoadingManager();

        this._gltfLoader = new GLTFLoader(this._loadingManager);
        
        if (this.options.enableDraco) {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath(this.options.dracoDecoderPath);
            this._gltfLoader.setDRACOLoader(dracoLoader);
        }

        this._textureLoader = new THREE.TextureLoader(this._loadingManager);
    }

    _addToCache(key, data, type, metadata = {}) {
        if (!this.options.enableCache) return;

        if (this._cache.size >= this.options.cacheSize) {
            const keys = this._cache.keys();
            const firstKey = keys.next().value;
            if (firstKey !== undefined) {
                this._evictFromCache(firstKey);
            }
        }

        this._cache.set(key, {
            data,
            type,
            metadata,
            createdAt: Date.now(),
            lastAccessed: Date.now()
        });

        console.log(`[AssetManager] Cached: ${key}`);
    }

    _getFromCache(key) {
        if (!this.options.enableCache) return null;

        const cached = this._cache.get(key);
        if (cached) {
            cached.lastAccessed = Date.now();
            return cached.data;
        }
        return null;
    }

    _evictFromCache(key) {
        const cached = this._cache.get(key);
        if (cached) {
            this._disposeResource(cached.data, cached.type);
            this._cache.delete(key);
            this._referenceCounts.delete(key);
            console.log(`[AssetManager] Evicted from cache: ${key}`);
        }
    }

    _disposeResource(data, type) {
        try {
            if (type === 'gltf' && data.scene) {
                data.scene.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) {
                            child.geometry.dispose();
                        }
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => m.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
            } else if (type === 'texture' && data.dispose) {
                data.dispose();
            }
        } catch (e) {
            console.warn(`[AssetManager] Error disposing resource:`, e);
        }
    }

    async _loadWithConcurrency(url, loaderMethod, type, options = {}) {
        return new Promise((resolve, reject) => {
            const cached = this._getFromCache(url);
            if (cached) {
                const currentCount = this._referenceCounts.get(url) || 0;
                this._referenceCounts.set(url, currentCount + 1);
                console.log(`[AssetManager] Using cached: ${url} (refCount: ${currentCount + 1})`);
                resolve(this._cloneIfNeeded(cached, type, options));
                return;
            }

            const pending = this._pendingRequests.get(url);
            if (pending) {
                console.log(`[AssetManager] Request already in progress, waiting: ${url}`);
                pending.then(resolve).catch(reject);
                return;
            }

            const request = new Promise((res, rej) => {
                const executeLoad = () => {
                    this._activeLoads++;
                    console.log(`[AssetManager] Starting load: ${url} (active: ${this._activeLoads})`);

                    loaderMethod(
                        url,
                        (result) => {
                            this._activeLoads--;
                            this._pendingRequests.delete(url);
                            
                            if (this.options.enableCache) {
                                this._addToCache(url, result, type, options);
                                this._referenceCounts.set(url, 1);
                            }
                            
                            this._processWaitQueue();
                            res(result);
                        },
                        (progress) => {
                            if (options.onProgress) {
                                options.onProgress(progress);
                            }
                        },
                        (error) => {
                            this._activeLoads--;
                            this._pendingRequests.delete(url);
                            this._processWaitQueue();
                            rej(error);
                        }
                    );
                };

                if (this._activeLoads < this.options.maxConcurrentLoads) {
                    executeLoad();
                } else {
                    console.log(`[AssetManager] Queued: ${url} (max concurrent reached)`);
                    this._waitQueue.push(executeLoad);
                }
            });

            this._pendingRequests.set(url, request);
            request.then(resolve).catch(reject);
        });
    }

    _processWaitQueue() {
        while (this._waitQueue.length > 0 && this._activeLoads < this.options.maxConcurrentLoads) {
            const next = this._waitQueue.shift();
            if (next) next();
        }
    }

    _cloneIfNeeded(data, type, options) {
        if (type === 'gltf' && options.clone !== false) {
            const clonedScene = data.scene.clone(true);
            
            const originalClips = data.animations || [];
            const clonedAnimations = originalClips.map(clip => {
                const clonedClip = clip.clone();
                return clonedClip;
            });

            return {
                scene: clonedScene,
                animations: clonedAnimations,
                cameras: data.cameras,
                asset: data.asset,
                userData: { ...data.userData, isClone: true }
            };
        }
        return data;
    }

    async loadGLTF(url, options = {}) {
        return this._loadWithConcurrency(
            url,
            (u, onLoad, onProgress, onError) => {
                this._gltfLoader.load(u, onLoad, onProgress, onError);
            },
            'gltf',
            options
        );
    }

    async loadTexture(url, options = {}) {
        return this._loadWithConcurrency(
            url,
            (u, onLoad, onProgress, onError) => {
                this._textureLoader.load(u, onLoad, onProgress, onError);
            },
            'texture',
            options
        );
    }

    async preload(urls, type = 'gltf', options = {}) {
        const promises = urls.map(url => {
            if (type === 'gltf') {
                return this.loadGLTF(url, { ...options, clone: false });
            } else if (type === 'texture') {
                return this.loadTexture(url, options);
            }
            return Promise.resolve(null);
        });
        return Promise.all(promises);
    }

    release(url) {
        const currentCount = this._referenceCounts.get(url) || 0;
        if (currentCount > 0) {
            const newCount = currentCount - 1;
            this._referenceCounts.set(url, newCount);
            console.log(`[AssetManager] Released: ${url} (refCount: ${newCount})`);
            
            if (newCount <= 0 && options.autoDispose) {
                this._evictFromCache(url);
            }
        }
        return currentCount - 1;
    }

    unload(url) {
        this._referenceCounts.set(url, 0);
        this._evictFromCache(url);
    }

    clearCache() {
        for (const key of this._cache.keys()) {
            this._evictFromCache(key);
        }
        console.log('[AssetManager] Cache cleared');
    }

    isCached(url) {
        return this._cache.has(url);
    }

    getCacheStats() {
        return {
            total: this._cache.size,
            maxSize: this.options.cacheSize,
            activeLoads: this._activeLoads,
            queued: this._waitQueue.length,
            pendingRequests: this._pendingRequests.size,
            items: Array.from(this._cache.entries()).map(([key, value]) => ({
                key,
                type: value.type,
                createdAt: value.createdAt,
                lastAccessed: value.lastAccessed,
                refCount: this._referenceCounts.get(key) || 0
            }))
        };
    }

    setOnLoad(callback) {
        this._loadingManager.onLoad = callback;
    }

    setOnProgress(callback) {
        this._loadingManager.onProgress = callback;
    }

    setOnError(callback) {
        this._loadingManager.onError = callback;
    }
}

const defaultAssetManager = new AssetManager();

export { AssetManager, defaultAssetManager };
export default AssetManager;
