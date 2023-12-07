import { JsonRpcProvider } from 'ethers';
import logo from '/eth.png'

const providerUrl = 'https://eth-mainnet.blastapi.io/7ba8e1ac-14a0-4e49-a96e-adb82420a114';


async function getLatestBlockAndTransactions(providerUrl) {
    try {
        const provider = new JsonRpcProvider(providerUrl);
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);
        const transactionHashes = block.transactions;
        return {
            blockNumber,
            block,
            transactionHashes,
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const objects = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const pointer = new THREE.Vector2();
const sphereToTX = {};

const sphereMaterial = new CANNON.Material();
sphereMaterial.restitution = 0.9;

function setupScene() {
    // Initialize the scene, camera, and renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    camera.position.z = 10;

    // Add lighting
    const light = new THREE.DirectionalLight(0x8384d6, 3);
    const light2 = new THREE.HemisphereLight(0xffffbb, 0xFFFF00, 1);
    light.position.set(1, 1, 1).normalize();
    light.position.set(3, 3, 3).normalize();
    scene.add(light);
    scene.add(light2);


    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Handle mouse movement and clicks
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('click', onClick);
}

function createSphere(x, y, z, txh) {
    const spherePhysicsMaterial = new CANNON.Material();
    spherePhysicsMaterial.restitution = 0.9;

    // Create a Cannon.js sphere shape and body
    const spherePhysicsGeometry = new CANNON.Sphere(0.2); // Use CANNON.Sphere for collision
    const spherePhysicsBody = new CANNON.Body({ mass: 1, shape: spherePhysicsGeometry, material: spherePhysicsMaterial });
    spherePhysicsBody.position.set(x, y, z);
    world.addBody(spherePhysicsBody);

    const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x8384d6 });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    const loader = new THREE.TextureLoader();
    loader.load(logo, function (texture) {

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // Scale the texture to fit the sphere
        const xscale = 7; // Adjust the scale as needed
        const yscale = 3;
        texture.repeat.set(xscale, yscale);

        // Center the texture on the sphere
        const offsetX = (1 - xscale) / 2;
        const offsetY = (1 - yscale) / 2;
        texture.offset.set(offsetX, offsetY);


        sphereMaterial.map = texture;
        scene.add(sphereMesh);
    });

    spherePhysicsBody.threeMesh = sphereMesh;
    sphereToTX[sphereMesh.id] = txh;
    objects.push(sphereMesh);


    const sphereShape = new CANNON.Sphere(0.2);
    const sphereBody = new CANNON.Body({ mass: 1, shape: sphereShape });


    sphereBody.position.set(x, y, z);
    world.addBody(sphereBody);
    sphereBody.threeMesh = sphereMesh;


    sphereBody.addEventListener('collide', function (event) {
        // Handle collision
    });
}

async function initialize() {
    const block = await getLatestBlockAndTransactions(providerUrl);

    if (block) {
        for (let i = 0; i < block.transactionHashes.length; i++) {
            const x = Math.random() * 8 - 4;
            const y = 5;
            const z = Math.random() * 8 - 4;
            const txh = block.transactionHashes[i];
            createSphere(x, y, z, txh);
        }
    }
}


async function getTXData(objId) {
    const provider = new JsonRpcProvider(providerUrl);
    const hash = sphereToTX[objId];
    try {
        const tx = await provider.getTransaction(hash);
        createPopUp(tx);
    } catch (error) {
        console.error('Error fetching transaction data:', error);
    }
}

function createPopUp(txData) {
    // Create a popup with transaction data
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';
    for (const key in txData) {
        if (txData.hasOwnProperty(key) && key !== 'provider' && key !== 'index' && key !== 'signature' && key !== 'accessList') {
        
            const p = document.createElement('p');
            p.className = 'transaction-data';
            p.innerText = `${key}: ${txData[key]}`;
            sidebar.appendChild(p);
        }
    }

    sidebar.style.display = 'block';
}

function killPopUp() {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.display = 'none';
}


function onPointerMove(event) {

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}



function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const objectId = clickedObject.id;
        getTXData(objectId);
    } else {
        killPopUp();
    }
}

function onWindowResize() {
    // Handle window resizing
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    // Animation loop
    requestAnimationFrame(animate);
    world.step(1 / 60);

    // Update sphere positions
    world.bodies.forEach(function (body) {
        if (body.threeMesh) {
            body.threeMesh.position.copy(body.position);
            body.threeMesh.quaternion.copy(body.quaternion);
        }
    });

    renderer.render(scene, camera);
}

const world = new CANNON.World();
world.gravity.set(0, -1.2, 0);

// Create a Cannon.js plane shape and body
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });

world.addBody(groundBody);

// Make sure the plane is flat (horizontal)
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

// Initialize the 3D scene
setupScene();

// Start the animation loop
animate();

// Initialize the 3D objects
initialize();


