import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

function main() {
	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		logarithmicDepthBuffer: true
	});
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setPixelRatio(window.devicePixelRatio);

	const fov = 45;
	const aspect = 2;
	const near = 0.1;
	const far = 100;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(20, 10, 20);

	// Game variables
	let score = 0;
	let gameActive = false;
	let currentAnimal = null;
	let animalTimeout = null;
	let scoreDisplay = null;
	let gameStartTime = null;
	const gameDuration = 10000; // 10 seconds
	const animalTypes = ['bird']; // Simplified to just birds
	const animalColors = [0x4169E1]; // Blue color for birds
	const treePositions = [];

	// Load bird model
	const mtlLoader = new MTLLoader();
	const objLoader = new OBJLoader();
	let birdModel = null;

	// Preload the bird model
	mtlLoader.load(
		'resources/models/bird/tiny-bird.mtl',
		(materials) => {
			materials.preload();
			// Enable shadows for all materials
			Object.values(materials.materials).forEach(material => {
				material.castShadow = true;
				material.receiveShadow = true;
				// Ensure materials work well with shadows
				material.shadowSide = THREE.FrontSide;
			});
			objLoader.setMaterials(materials);
			
			objLoader.load(
				'resources/models/bird/tiny-bird.obj',
				(root) => {
					console.log('Bird model loaded successfully');
					birdModel = root;
					// Scale down the bird model
					birdModel.scale.set(0.5, 0.5, 0.5);
					// Enable shadows for the bird model
					birdModel.traverse((child) => {
						if (child.isMesh) {
							child.castShadow = true;
							child.receiveShadow = true;
							// Ensure proper shadow rendering
							if (child.material) {
								child.material.shadowSide = THREE.FrontSide;
								// Increase material quality for better shadows
								child.material.shininess = 30;
								child.material.needsUpdate = true;
							}
						}
					});
				},
				(xhr) => {
					console.log((xhr.loaded / xhr.total * 100) + '% Bird model loaded');
				},
				(error) => {
					console.error('Error loading bird model:', error);
				}
			);
		},
		(xhr) => {
			console.log((xhr.loaded / xhr.total * 100) + '% Bird materials loaded');
		},
		(error) => {
			console.error('Error loading bird materials:', error);
		}
	);

	// Load windmill
	console.log('Starting to load windmill...');
	mtlLoader.load(
		'resources/models/windmill/windmill.mtl',
		(materials) => {
			materials.preload();
			// Enable shadows for all materials
			Object.values(materials.materials).forEach(material => {
				material.castShadow = true;
				material.receiveShadow = true;
				// Ensure materials work well with shadows
				material.shadowSide = THREE.FrontSide;
			});
			objLoader.setMaterials(materials);
			
			objLoader.load(
				'resources/models/windmill/windmill.obj',
				(root) => {
					console.log('Windmill loaded successfully');
					// Position the windmill to align with other buildings
					root.position.set(18, 0, -10); // Moved to the right of other buildings
					root.scale.set(2, 2, 2);
					// Rotate the windmill 90 degrees to face the user
					root.rotation.y = - Math.PI / 2;
					
					// Enable shadows for the entire windmill model
					root.traverse((child) => {
						if (child.isMesh) {
							child.castShadow = true;
							child.receiveShadow = true;
							// Ensure proper shadow rendering
							if (child.material) {
								child.material.shadowSide = THREE.FrontSide;
								// Increase material quality for better shadows
								child.material.shininess = 30;
								child.material.needsUpdate = true;
							}
						}
					});
					
					scene.add(root);
					console.log('Windmill added to scene');

					// Update camera to show everything
					camera.position.set(40, 25, 40);
					controls.target.set(0, 5, 0);
					controls.update();
				},
				(xhr) => {
					console.log((xhr.loaded / xhr.total * 100) + '% OBJ loaded');
				},
				(error) => {
					console.error('Error loading OBJ:', error);
				}
			);
		},
		(xhr) => {
			console.log((xhr.loaded / xhr.total * 100) + '% MTL loaded');
		},
		(error) => {
			console.error('Error loading MTL:', error);
		}
	);

	// GUI Helper class for camera settings
	class MinMaxGUIHelper {
		constructor(obj, minProp, maxProp, minDif) {
			this.obj = obj;
			this.minProp = minProp;
			this.maxProp = maxProp;
			this.minDif = minDif;
		}
		get min() {
			return this.obj[this.minProp];
		}
		set min(v) {
			this.obj[this.minProp] = v;
			this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
		}
		get max() {
			return this.obj[this.maxProp];
		}
		set max(v) {
			this.obj[this.maxProp] = v;
			this.min = this.min;
		}
	}

	function updateCamera() {
		camera.updateProjectionMatrix();
	}

	// Setup GUI
	const gui = new GUI();
	
	// Camera controls
	const cameraFolder = gui.addFolder('Camera Controls');
	cameraFolder.add(camera, 'fov', 1, 180).name('FOV').onChange(updateCamera);
	const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
	cameraFolder.add(minMaxGUIHelper, 'min', 0.00001, 50, 0.00001).name('Near').onChange(updateCamera);
	cameraFolder.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('Far').onChange(updateCamera);
	cameraFolder.open();

	// Setup OrbitControls
	const controls = new OrbitControls(camera, canvas);
	controls.target.set(0, 5, 0);
	controls.update();

	const scene = new THREE.Scene();

	// Add skybox
	{
		const loader = new THREE.TextureLoader();
		const texture = loader.load(
			'https://threejs.org/manual/examples/resources/images/equirectangularmaps/tears_of_steel_bridge_2k.jpg',
			() => {
				texture.mapping = THREE.EquirectangularReflectionMapping;
		texture.colorSpace = THREE.SRGBColorSpace;
				scene.background = texture;
			}
		);
	}

	// Add ground plane with shadows
	{
		const planeSize = 100;
		const loader = new THREE.TextureLoader();
		const texture = loader.load('https://threejs.org/manual/examples/resources/images/checker.png');
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		texture.colorSpace = THREE.SRGBColorSpace;
		const repeats = planeSize / 2;
		texture.repeat.set(repeats, repeats);

		const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
		const planeMat = new THREE.MeshPhongMaterial({
			map: texture,
			side: THREE.DoubleSide,
		});
		const mesh = new THREE.Mesh(planeGeo, planeMat);
		mesh.rotation.x = Math.PI * -0.5;
		mesh.receiveShadow = true;
		scene.add(mesh);
	}

	// Add village buildings (cubes) with shadows
	{
		const buildingGeometry = new THREE.BoxGeometry(4, 6, 4);
		const loader = new THREE.TextureLoader();
		const brickTexture = loader.load('resources/images/brickwall.jpg');
		brickTexture.colorSpace = THREE.SRGBColorSpace;
		brickTexture.wrapS = THREE.RepeatWrapping;
		brickTexture.wrapT = THREE.RepeatWrapping;
		brickTexture.repeat.set(2, 3); // Adjust the number of brick repeats
		
		// Create materials for each face of the building
		const materials = [
			new THREE.MeshPhongMaterial({ map: brickTexture }), // right
			new THREE.MeshPhongMaterial({ map: brickTexture }), // left
			new THREE.MeshPhongMaterial({ color: 0x8B4513 }),   // top (roof)
			new THREE.MeshPhongMaterial({ color: 0x808080 }),   // bottom
			new THREE.MeshPhongMaterial({ map: brickTexture }), // front
			new THREE.MeshPhongMaterial({ map: brickTexture })  // back
		];
		
		// Create a row of buildings
		for (let i = 0; i < 5; i++) {
			const building = new THREE.Mesh(buildingGeometry, materials);
			building.position.set(i * 6 - 12, 3, -10);
			building.castShadow = true;
			building.receiveShadow = true;
			scene.add(building);
			
			// Add roofs (triangular prisms)
			const roofGeometry = new THREE.ConeGeometry(3, 2, 4);
			const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
			const roof = new THREE.Mesh(roofGeometry, roofMaterial);
			roof.position.set(i * 6 - 12, 7, -10);
			roof.rotation.y = Math.PI / 4;
			roof.castShadow = true;
			scene.add(roof);
		}
	}

	// Add textured flower beds
	{
		const flowerTextures = [
			'resources/images/flower-1.jpg',
			'resources/images/flower-2.jpg',
			'resources/images/flower-3.jpg',
			'resources/images/flower-4.jpg',
			'resources/images/flower-5.jpg',
			'resources/images/flower-6.jpg'
		];

		const loader = new THREE.TextureLoader();
		
		// Create flower beds in front of buildings
		for (let i = 0; i < 5; i++) {
			// Create flower bed base
			const bedGeometry = new THREE.BoxGeometry(3, 0.5, 1);
			const texture = loader.load(flowerTextures[i % flowerTextures.length]);
			texture.colorSpace = THREE.SRGBColorSpace;
			
			// Create materials for each face of the box
			const materials = [
				new THREE.MeshPhongMaterial({ color: 0x654321 }), // right
				new THREE.MeshPhongMaterial({ color: 0x654321 }), // left
				new THREE.MeshPhongMaterial({ color: 0x654321 }), // top
				new THREE.MeshPhongMaterial({ color: 0x654321 }), // bottom
				new THREE.MeshPhongMaterial({ color: 0x654321 }), // front
				new THREE.MeshPhongMaterial({ color: 0x654321 })  // back
			];
			
			// Set the flower texture for the top face
			materials[2] = new THREE.MeshPhongMaterial({
				map: texture,
				side: THREE.DoubleSide
			});
			
			const bed = new THREE.Mesh(bedGeometry, materials);
			bed.position.set(i * 6 - 12, 0.25, -7);
			bed.castShadow = true;
			bed.receiveShadow = true;
			scene.add(bed);
		}
	}

	// Add trees (cylinders and spheres) with shadows
	{
		const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
		const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
		const leavesGeometry = new THREE.SphereGeometry(2, 16, 16);
		const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });

		for (let i = 0; i < 8; i++) {
			const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
			trunk.position.set(i * 4 - 14, 2, 5);
			trunk.castShadow = true;
			scene.add(trunk);

			const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
			leaves.position.set(i * 4 - 14, 5, 5);
			leaves.castShadow = true;
			scene.add(leaves);

			// Store tree positions for game
			treePositions.push(new THREE.Vector3(i * 4 - 14, 5, 5));
		}
	}

	// Add a fountain (cylinder and torus) with shadows
	{
		const baseGeometry = new THREE.CylinderGeometry(3, 3, 1, 32);
		const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
		const base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(0, 0.5, -2);
		base.castShadow = true;
		base.receiveShadow = true;
		scene.add(base);

		const poolGeometry = new THREE.TorusGeometry(2, 0.5, 16, 32);
		const poolMaterial = new THREE.MeshPhongMaterial({ color: 0x4169E1 });
		const pool = new THREE.Mesh(poolGeometry, poolMaterial);
		pool.position.set(0, 1, -2);
		pool.rotation.x = Math.PI / 2;
		pool.castShadow = true;
		pool.receiveShadow = true;
		scene.add(pool);
	}

	// Create particle system
	const particleCount = 100;
	const particles = new THREE.BufferGeometry();
	const positions = new Float32Array(particleCount * 3);
	const colors = new Float32Array(particleCount * 3);

	for (let i = 0; i < particleCount; i++) {
		positions[i * 3] = (Math.random() - 0.5) * 50;
		positions[i * 3 + 1] = Math.random() * 10;
		positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

		colors[i * 3] = Math.random();
		colors[i * 3 + 1] = Math.random();
		colors[i * 3 + 2] = Math.random();
	}

	particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

	const particleMaterial = new THREE.PointsMaterial({
		size: 0.6,
		vertexColors: true,
		transparent: true,
		opacity: 0.8
	});

	const particleSystem = new THREE.Points(particles, particleMaterial);
	scene.add(particleSystem);

	// Setup post-processing
	const composer = new EffectComposer(renderer);
	const renderPass = new RenderPass(scene, camera);
	composer.addPass(renderPass);

	const bloomPass = new UnrealBloomPass(
		new THREE.Vector2(window.innerWidth, window.innerHeight),
		1.5,  // strength
		0.4,  // radius
		0.85  // threshold
	);
	composer.addPass(bloomPass);

	// Add lighting with GUI controls
	{
		class ColorGUIHelper {
			constructor(object, prop) {
				this.object = object;
				this.prop = prop;
			}
			get value() {
				return `#${this.object[this.prop].getHexString()}`;
			}
			set value(hexString) {
				this.object[this.prop].set(hexString);
			}
		}

		// Directional light (sun)
		const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
		directionalLight.position.set(10, 20, 10);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.near = 0.5;
		directionalLight.shadow.camera.far = 50;
		directionalLight.shadow.camera.left = -20;
		directionalLight.shadow.camera.right = 20;
		directionalLight.shadow.camera.top = 20;
		directionalLight.shadow.camera.bottom = -20;
		scene.add(directionalLight);

		// Point light (street lamp)
		const pointLight = new THREE.PointLight(0xFFD700, 1, 20);
		pointLight.position.set(0, 5, -10);
		pointLight.castShadow = true;
		pointLight.shadow.mapSize.width = 1024;
		pointLight.shadow.mapSize.height = 1024;
		scene.add(pointLight);

		// Spot light (fountain light)
		const spotLight = new THREE.SpotLight(0xFFFFFF, 1);
		spotLight.position.set(0, 10, 0);
		spotLight.angle = Math.PI / 6;
		spotLight.penumbra = 0.1;
		spotLight.decay = 2;
		spotLight.distance = 50;
		spotLight.castShadow = true;
		spotLight.shadow.mapSize.width = 1024;
		spotLight.shadow.mapSize.height = 1024;
		scene.add(spotLight);

		// Setup GUI for light controls
		const lightFolder = gui.addFolder('Light Controls');
		
		// Directional light controls
		const dirLightFolder = lightFolder.addFolder('Sun Light');
		dirLightFolder.addColor(new ColorGUIHelper(directionalLight, 'color'), 'value').name('Color');
		dirLightFolder.add(directionalLight, 'intensity', 0, 2, 0.01).name('Intensity');
		dirLightFolder.add(directionalLight.position, 'x', -20, 20).name('X Position');
		dirLightFolder.add(directionalLight.position, 'y', 0, 30).name('Y Position');
		dirLightFolder.add(directionalLight.position, 'z', -20, 20).name('Z Position');
		
		// Point light controls
		const pointLightFolder = lightFolder.addFolder('Street Lamp');
		pointLightFolder.addColor(new ColorGUIHelper(pointLight, 'color'), 'value').name('Color');
		pointLightFolder.add(pointLight, 'intensity', 0, 2, 0.01).name('Intensity');
		pointLightFolder.add(pointLight.position, 'x', -10, 10).name('X Position');
		pointLightFolder.add(pointLight.position, 'y', 0, 10).name('Y Position');
		pointLightFolder.add(pointLight.position, 'z', -20, 0).name('Z Position');
		
		// Spot light controls
		const spotLightFolder = lightFolder.addFolder('Fountain Light');
		spotLightFolder.addColor(new ColorGUIHelper(spotLight, 'color'), 'value').name('Color');
		spotLightFolder.add(spotLight, 'intensity', 0, 2, 0.01).name('Intensity');
		spotLightFolder.add(spotLight, 'angle', 0, Math.PI / 2).name('Angle');
		spotLightFolder.add(spotLight, 'penumbra', 0, 1).name('Penumbra');

		// Post-processing controls
		const postFolder = gui.addFolder('Post-Processing');
		postFolder.add(bloomPass, 'enabled').name('Bloom Effect');
		postFolder.add(bloomPass, 'strength', 0, 3, 0.01).name('Bloom Strength');
		postFolder.add(bloomPass, 'radius', 0, 1, 0.01).name('Bloom Radius');
		postFolder.add(bloomPass, 'threshold', 0, 1, 0.01).name('Bloom Threshold');

		// Particle system controls
		const particleFolder = gui.addFolder('Particle System');
		particleFolder.add(particleSystem.material, 'size', 0.01, 0.5, 0.01).name('Particle Size');
		particleFolder.add(particleSystem.material, 'opacity', 0, 1, 0.01).name('Particle Opacity');
		
		lightFolder.open();
		dirLightFolder.open();
		pointLightFolder.open();
		spotLightFolder.open();
		postFolder.open();
		particleFolder.open();
	}

	// Create score display
	{
		const scoreDiv = document.createElement('div');
		scoreDiv.style.position = 'absolute';
		scoreDiv.style.top = '20px';
		scoreDiv.style.left = '20px';
		scoreDiv.style.color = 'white';
		scoreDiv.style.fontSize = '24px';
		scoreDiv.style.fontFamily = 'Arial';
		scoreDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
		document.body.appendChild(scoreDiv);
		scoreDisplay = scoreDiv;
	}

	// Create game instructions and start button
	{
		const container = document.createElement('div');
		container.style.position = 'absolute';
		container.style.top = '50%';
		container.style.left = '50%';
		container.style.transform = 'translate(-50%, -50%)';
		container.style.textAlign = 'center';
		container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		container.style.padding = '20px';
		container.style.borderRadius = '10px';
		container.style.color = 'white';
		container.style.fontFamily = 'Arial';

		const title = document.createElement('h2');
		title.textContent = 'Tree Animal Hunt';
		title.style.marginBottom = '20px';
		container.appendChild(title);

		const instructions = document.createElement('div');
		instructions.innerHTML = `
			<p style="margin-bottom: 15px">Click on the birds that appear in the trees!</p>
			<p style="margin-bottom: 15px">Each bird = 10 points</p>
			<p style="margin-bottom: 20px">You have 10 seconds to get the highest score!</p>
		`;
		container.appendChild(instructions);

		const startButton = document.createElement('button');
		startButton.textContent = 'Start Game';
		startButton.style.padding = '15px 30px';
		startButton.style.fontSize = '20px';
		startButton.style.cursor = 'pointer';
		startButton.style.backgroundColor = '#4CAF50';
		startButton.style.color = 'white';
		startButton.style.border = 'none';
		startButton.style.borderRadius = '5px';
		startButton.style.marginTop = '10px';
		container.appendChild(startButton);

		document.body.appendChild(container);

		startButton.addEventListener('click', () => {
			if (!gameActive) {
				startGame();
				container.style.display = 'none';
			}
		});
	}

	function startGame() {
		if (!birdModel) {
			alert('Please wait for the bird model to load...');
			return;
		}
		gameActive = true;
		score = 0;
		gameStartTime = Date.now();
		updateScore();
		console.log('Game started');
		spawnAnimal();
	}

	function endGame() {
		gameActive = false;
		if (currentAnimal) {
			scene.remove(currentAnimal);
			currentAnimal = null;
		}
		if (animalTimeout) {
			clearTimeout(animalTimeout);
			animalTimeout = null;
		}
		
		// Create game over message
		const gameOverDiv = document.createElement('div');
		gameOverDiv.style.position = 'absolute';
		gameOverDiv.style.top = '50%';
		gameOverDiv.style.left = '50%';
		gameOverDiv.style.transform = 'translate(-50%, -50%)';
		gameOverDiv.style.textAlign = 'center';
		gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		gameOverDiv.style.padding = '20px';
		gameOverDiv.style.borderRadius = '10px';
		gameOverDiv.style.color = 'white';
		gameOverDiv.style.fontFamily = 'Arial';
		
		gameOverDiv.innerHTML = `
			<h2>Game Over!</h2>
			<p style="font-size: 24px; margin: 20px 0">Final Score: ${score}</p>
			<button id="restartButton" style="padding: 15px 30px; font-size: 20px; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 5px;">Play Again</button>
		`;
		
		document.body.appendChild(gameOverDiv);
		
		document.getElementById('restartButton').addEventListener('click', () => {
			gameOverDiv.remove();
			document.querySelector('div[style*="text-align: center"]').style.display = 'block';
		});
	}

	function spawnAnimal() {
		if (!gameActive || !birdModel) return;

		// Remove previous animal if exists
		if (currentAnimal) {
			scene.remove(currentAnimal);
		}

		// Create new animal by cloning the bird model
		currentAnimal = birdModel.clone();
		
		// Position animal in a random tree
		const treeIndex = Math.floor(Math.random() * treePositions.length);
		const treePos = treePositions[treeIndex];
		currentAnimal.position.copy(treePos);
		currentAnimal.position.y += 2; // Position above the tree
		
		// Add a point light to make the animal more visible
		const light = new THREE.PointLight(animalColors[0], 1, 5);
		light.position.set(0, 0, 0);
		currentAnimal.add(light);

		scene.add(currentAnimal);
		console.log('Bird spawned at:', currentAnimal.position);

		// Set timeout for animal disappearance
		const displayTime = Math.random() * 2000 + 2000; // 2-4 seconds
		animalTimeout = setTimeout(() => {
			if (currentAnimal && gameActive) {
				scene.remove(currentAnimal);
				currentAnimal = null;
				spawnAnimal();
			}
		}, displayTime);
	}

	function updateScore() {
		scoreDisplay.textContent = `Score: ${score}`;
	}

	// Add click handler for the canvas
	canvas.addEventListener('click', (event) => {
		if (!gameActive || !currentAnimal) return;

		// Calculate mouse position in normalized device coordinates
		const rect = canvas.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
		const y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

		// Create raycaster
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

		// Check for intersection with animal
		const intersects = raycaster.intersectObject(currentAnimal);
		if (intersects.length > 0) {
			// Add points
			score += 10;
			updateScore();

			// Visual feedback
			currentAnimal.traverse((child) => {
				if (child.isMesh && child.material) {
					child.material.emissiveIntensity = 1;
					setTimeout(() => {
						if (child.material) {
							child.material.emissiveIntensity = 0.2;
						}
					}, 100);
				}
			});

			// Remove current animal and spawn new one
			scene.remove(currentAnimal);
			currentAnimal = null;
			if (animalTimeout) {
				clearTimeout(animalTimeout);
			}
			spawnAnimal();
		}
	});

	function resizeRendererToDisplaySize(renderer) {
		const canvas = renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if (needResize) {
			renderer.setSize(width, height, false);
			composer.setSize(width, height);
		}
		return needResize;
	}

	function render() {
		if (resizeRendererToDisplaySize(renderer)) {
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}

		// Check if game time is up
		if (gameActive && Date.now() - gameStartTime > gameDuration) {
			endGame();
		}

		// Update particle positions
		const positions = particleSystem.geometry.attributes.position.array;
		for (let i = 0; i < positions.length; i += 3) {
			positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01;
		}
		particleSystem.geometry.attributes.position.needsUpdate = true;

		composer.render();
		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);
}

main();
