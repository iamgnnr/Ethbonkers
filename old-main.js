import { JsonRpcProvider } from 'ethers';

export async function getLatestBlockAndTransactions(providerUrl) {
    // Initialize a provider
    const provider = new JsonRpcProvider(providerUrl);
    try {
        // Get the latest block number
        const blockNumber = await provider.getBlockNumber();

        // Get the latest block details
        const block = await provider.getBlock(blockNumber);

        // Get the list of transaction hashes in the latest block
        const transactionHashes = block.transactions;

        return {
            blockNumber,
            block,
            transactionHashes,
        };
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}




let INTERSECTED;
const mouse = new THREE.Vector2();
const objects = [];
const pointer = new THREE.Vector2();



const sphereToTX = {};


// Three.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


window.addEventListener('resize', onWindowResize);
document.addEventListener('mousemove', onPointerMove);
document.addEventListener('click', onClick);



const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(1, 1, 1).normalize();
scene.add(light);


// Cannon.js physics setup
const world = new CANNON.World();
world.gravity.set(0, -10, 0);

// Create a ground plane
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);
let raycaster = new THREE.Raycaster();


function createSphere(x, y, z, txh) {
    const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphereMesh);
    sphereToTX[sphereMesh.id] = txh;
    objects.push(sphereMesh);




    const sphereShape = new CANNON.Sphere(0.2);

    const sphereBody = new CANNON.Body({ mass: 1, shape: sphereShape });

    sphereBody.position.set(x, y, z);
    world.addBody(sphereBody);

    // Link the Three.js mesh to the Cannon.js body
    sphereBody.threeMesh = sphereMesh;


    // Add a callback to keep the mesh position in sync with the body
    sphereBody.addEventListener('collide', function (event) {
        // console.log('Sphere collided with', event.body);
    });
}

const providerUrl = 'https://eth-mainnet.blastapi.io/7ba8e1ac-14a0-4e49-a96e-adb82420a114';

const block = await getLatestBlockAndTransactions(providerUrl);

// Create falling spheres
if (block) {
    for (let i = 0; i < block.transactionHashes.length; i++) {
        const x = Math.random() * 8 - 4; // Random x position within the scene
        const y = 5; // Initial height
        const z = Math.random() * 8 - 4; // Random z position within the scene
        const txh = block.transactionHashes[i];
        createSphere(x, y, z, txh);
    }

}

function onPointerMove(event) {

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

async function getTXData(objId) {
    const provider = new JsonRpcProvider(providerUrl);
    let hash = sphereToTX[objId];
    console.log(hash);

    // Fetch transaction data
    const tx = await provider.getTransaction(hash);
    createPopUp(tx);
}

function createPopUp(txData) {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';
    for (const key in txData) {
        if (txData.hasOwnProperty(key)) {
            const p = document.createElement('p');
            p.className = 'transaction-data';
            p.innerText = `${key}: ${txData[key]}`;
            sidebar.appendChild(p);
        }
    }
    sidebar.style.display = 'block';
}

// Add an event listener to your existing `onClick` function
function onClick(event) {
    // Calculate the mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    const provider = new JsonRpcProvider(providerUrl);

    // Update the raycaster's origin based on the mouse position
    raycaster.setFromCamera(mouse, camera);

    // Perform the raycasting
    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        // An object was clicked
        const clickedObject = intersects[0].object;

        // Access the ID of the clicked object
        const objectId = clickedObject.id;

        getTXData(objectId);

    } else {
        console.log(intersects.length);
        console.log("Your operation was unsuccessful.");
    }
}






// Animation function
function animate() {
    requestAnimationFrame(animate);

    // Step the Cannon.js world
    world.step(1 / 60);

    // Update sphere positions
    world.bodies.forEach(function (body) {
        if (body.threeMesh) {
            body.threeMesh.position.copy(body.position);
            body.threeMesh.quaternion.copy(body.quaternion);
        }
    });

    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {

        if (INTERSECTED != intersects[0].object) {
            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex(0xff0000);

        }

    } else {

        if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

        INTERSECTED = null;

    }

    renderer.render(scene, camera);
}

// Set camera position
camera.position.z = 10;

// Start the animation
animate();