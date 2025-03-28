// Three.js Animation
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const canvas = document.getElementById('hero-canvas');

renderer.setSize(window.innerWidth, window.innerHeight);
canvas.appendChild(renderer.domElement);

// Create particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 5;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.005,
    color: '#0066ff',
    transparent: true,
    opacity: 0.8
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

camera.position.z = 2;

// Animation
function animate() {
    requestAnimationFrame(animate);

    particlesMesh.rotation.y += 0.001;
    particlesMesh.rotation.x += 0.0005;

    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, {
    threshold: 0.1
});

// Observe elements for animation
document.querySelectorAll('.feature-card, .pricing-card, .metric').forEach((el) => {
    observer.observe(el);
});

// Code editor demo
const codeEditor = document.querySelector('.code-editor code');
const runButton = document.querySelector('.run-button');
const analyzeButton = document.querySelector('.analyze-button');

runButton.addEventListener('click', () => {
    // Simulate code execution
    const progressBars = document.querySelectorAll('.progress');
    progressBars.forEach(bar => {
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = Math.random() * 30 + 70 + '%';
        }, 500);
    });
});

analyzeButton.addEventListener('click', () => {
    // Simulate code analysis
    const progressBars = document.querySelectorAll('.progress');
    progressBars.forEach(bar => {
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = Math.random() * 20 + 80 + '%';
        }, 500);
    });
});

// Parallax effect
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
});

// Navbar transparency
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(10, 10, 10, 0.9)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.8)';
    }
});

// Add hover effect to feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px) scale(1.05)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Add typing effect to hero subtitle
const subtitle = document.querySelector('.subtitle');
const text = subtitle.textContent;
subtitle.textContent = '';
let i = 0;

function typeWriter() {
    if (i < text.length) {
        subtitle.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
    }
}

typeWriter();

// Add particle effect to buttons
document.querySelectorAll('.primary-button, .secondary-button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        const particles = document.createElement('div');
        particles.className = 'button-particles';
        button.appendChild(particles);
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particles.appendChild(particle);
            
            const angle = (i / 10) * Math.PI * 2;
            const velocity = 2;
            const x = Math.cos(angle) * velocity;
            const y = Math.sin(angle) * velocity;
            
            particle.style.transform = `translate(${x}px, ${y}px)`;
        }
        
        setTimeout(() => {
            particles.remove();
        }, 1000);
    });
}); 