   import * as data from 'ethData';
    
    
    // Three.js scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Cannon.js physics setup
    const world = new CANNON.World();
    world.gravity.set(0, -10, 0);
    
    // Create a ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Create spheres and add them to the scene
    const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    function createSphere(x, y, z) {
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(sphereMesh);

        const sphereShape = new CANNON.Sphere(0.2);
        const sphereBody = new CANNON.Body({ mass: 1, shape: sphereShape });
        sphereBody.position.set(x, y, z);
        world.addBody(sphereBody);

        // Link the Three.js mesh to the Cannon.js body
        sphereBody.threeMesh = sphereMesh;

        // Add a callback to keep the mesh position in sync with the body
        sphereBody.addEventListener('collide', function(event) {
            console.log('Sphere collided with', event.body);
        });
    }

    // Create falling spheres
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * 8 - 4; // Random x position within the scene
        const y = 5; // Initial height
        const z = Math.random() * 8 - 4; // Random z position within the scene

        createSphere(x, y, z);
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

        renderer.render(scene, camera);
    }

    // Set camera position
    camera.position.z = 5;

    // Start the animation
    animate();