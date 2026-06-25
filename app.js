const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const componentData = {
  resistor: {
    name: "Resistor",
    color: 0xef9a44,
    labels: ["Ceramic body", "Color bands", "Metal leads"],
    principle: "A resistor limits current flow. Its voltage and current relationship follows Ohm's law: V = I x R.",
    applications: "LED protection, voltage dividers, biasing networks, pull-up inputs, timing circuits, and sensor conditioning.",
    interview: "Why does an LED need a series resistor? What is tolerance? How does a voltage divider work?"
  },
  capacitor: {
    name: "Capacitor",
    color: 0xef4444,
    labels: ["Plates", "Dielectric", "Polarity stripe"],
    principle: "A capacitor stores charge in an electric field and resists sudden voltage changes.",
    applications: "Filtering, coupling, smoothing, RC timing, signal shaping, and power-supply decoupling.",
    interview: "What is the RC time constant? What happens to a capacitor at DC?"
  },
  diode: {
    name: "Diode",
    color: 0xdc2626,
    labels: ["Anode", "PN junction", "Cathode stripe"],
    principle: "A diode allows current mainly in one direction when forward biased and blocks current in reverse bias.",
    applications: "Rectifiers, reverse-polarity protection, clamping, switching, and demodulation.",
    interview: "What is forward voltage? Why does a silicon diode drop about 0.7 V?"
  },
  led: {
    name: "LED",
    color: 0xff3434,
    labels: ["Anode", "Cathode", "Light lens"],
    principle: "An LED emits light when electrons recombine with holes in a forward-biased semiconductor junction.",
    applications: "Indicators, displays, optical links, lighting, status panels, and sensor emitters.",
    interview: "Why is current limiting required? How do color and band gap relate?"
  },
  transistor: {
    name: "Transistor",
    color: 0xb91c1c,
    labels: ["Collector", "Base", "Emitter"],
    principle: "A transistor uses a small control signal to switch or amplify a larger current.",
    applications: "Amplifiers, logic gates, motor drivers, oscillators, regulators, and digital processors.",
    interview: "Explain cutoff, active, and saturation regions. Compare BJT and MOSFET."
  },
  ic: {
    name: "IC Chip",
    color: 0x151515,
    labels: ["Package", "Pins", "Silicon die"],
    principle: "An integrated circuit combines many microscopic components on a silicon die to perform complex functions.",
    applications: "Microcontrollers, op-amps, memory, timers, sensors, codecs, and power controllers.",
    interview: "Why do ICs need decoupling capacitors? What is pin pitch?"
  },
  transformer: {
    name: "Transformer",
    color: 0x7f1d1d,
    labels: ["Primary coil", "Core", "Secondary coil"],
    principle: "A transformer transfers AC energy between coils using changing magnetic flux in a core.",
    applications: "Voltage step-up, step-down, isolation, adapters, power supplies, and signal coupling.",
    interview: "Why does a transformer require AC? What is turns ratio?"
  },
  relay: {
    name: "Relay",
    color: 0x991b1b,
    labels: ["Coil", "Armature", "Contacts"],
    principle: "A relay uses an electromagnetic coil to mechanically open or close contacts.",
    applications: "Isolation switching, automation panels, motor control, safety circuits, and high-power loads.",
    interview: "Why use a flyback diode across a relay coil? What is contact rating?"
  }
};

const quizzes = [
  {
    type: "MCQ",
    question: "Which condition makes an LED glow in a diode bias experiment?",
    options: ["Forward bias with current limiting", "Reverse bias with open circuit", "No supply voltage", "Only a voltmeter connected"],
    answer: 0,
    feedback: "An LED glows only when forward biased and current is limited by a resistor or driver."
  },
  {
    type: "Circuit Identification",
    question: "A resistor and capacitor connected with a DC source commonly demonstrate:",
    options: ["RC charging", "FM modulation", "Magnetic saturation", "Transformer isolation"],
    answer: 0,
    feedback: "An RC circuit shows exponential capacitor charging and discharging behavior."
  },
  {
    type: "Match Concept",
    question: "Match the law: sum of voltage drops around a closed loop equals the source voltage.",
    options: ["Kirchhoff Voltage Law", "Kirchhoff Current Law", "Faraday Law", "Coulomb Law"],
    answer: 0,
    feedback: "KVL is based on energy conservation around a closed loop."
  },
  {
    type: "Drag Idea",
    question: "Which instrument should be connected in series to measure current?",
    options: ["Ammeter", "Voltmeter", "Oscilloscope probe only", "Transformer"],
    answer: 0,
    feedback: "An ammeter has low resistance and must be placed in series with the current path."
  }
];

let componentScene;
let componentCamera;
let componentRenderer;
let componentGroup;
let currentComponent = "resistor";
let currentInfo = "principle";
let exploded = false;
let labParts = [];
let quizIndex = 0;
let score = 0;
let timeLeft = 60;
let lastTutorAnswer = "";
let scopeTick = 0;
let scopeFramePending = false;
let quizChart;
let weeklyChart;
let topicChart;

const defaultProgress = {
  loggedIn: false,
  userType: "",
  quizAttempts: 0,
  quizCorrect: 0,
  experimentsCompleted: [],
  tutorQuestions: 0,
  modulesVisited: [],
  activities: []
};

const progressState = {
  ...defaultProgress,
  ...JSON.parse(localStorage.getItem("voltEdgeProgress") || "{}")
};
progressState.loggedIn = sessionStorage.getItem("voltEdgeSession") === "true";
if (!progressState.loggedIn) progressState.userType = "";

function saveProgress() {
  localStorage.setItem("voltEdgeProgress", JSON.stringify(progressState));
}

function addActivity(message) {
  progressState.activities = [message, ...(progressState.activities || [])].slice(0, 5);
  saveProgress();
  updateDashboard();
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}

function initParticles() {
  const canvas = $("#particle-canvas");
  const ctx = canvas.getContext("2d");
  const particles = Array.from({ length: 72 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 2 + 0.6,
    vx: (Math.random() - 0.5) * 0.0007,
    vy: (Math.random() - 0.5) * 0.0007
  }));

  function resize() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.x = (p.x + p.vx + 1) % 1;
      p.y = (p.y + p.vy + 1) % 1;
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      ctx.beginPath();
      ctx.fillStyle = "rgba(239,68,68,0.62)";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 18;
      ctx.arc(x, y, p.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
      const next = particles[(i + 1) % particles.length];
      const nx = next.x * canvas.width;
      const ny = next.y * canvas.height;
      const dist = Math.hypot(nx - x, ny - y);
      if (dist < 190 * devicePixelRatio) {
        ctx.strokeStyle = `rgba(239,68,68,${0.14 - dist / (1900 * devicePixelRatio)})`;
        ctx.lineWidth = devicePixelRatio;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
    });
    requestAnimationFrame(draw);
  }

  addEventListener("resize", resize);
  resize();
  draw();
}

function initRevealAndTilt() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.14 });

  $$(".reveal").forEach((el) => observer.observe(el));

  $$(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-2px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function initCounters() {
  const counters = $$("[data-count]");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.done) return;
      entry.target.dataset.done = "true";
      const target = Number(entry.target.dataset.count);
      const start = performance.now();
      const run = (now) => {
        const progress = Math.min((now - start) / 1400, 1);
        entry.target.textContent = Math.floor(target * progress).toLocaleString();
        if (progress < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    });
  });
  counters.forEach((counter) => observer.observe(counter));
}

function initHero3D() {
  const host = $("#hero-3d");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.2, 9);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x220000, 1.9));
  const red = new THREE.PointLight(0xef4444, 4.5, 20);
  red.position.set(3, 2, 3);
  scene.add(red);

  const group = new THREE.Group();
  scene.add(group);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.35, metalness: 0.5 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef1111, emissiveIntensity: 1.5 });
  const chip = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 1.5), boardMat);
  group.add(chip);
  for (let i = 0; i < 18; i++) {
    const trace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 1.7), lineMat);
    trace.position.set(-2.8 + i * 0.33, 0.18, Math.sin(i) * 0.75);
    trace.rotation.y = i % 2 ? 0.7 : -0.7;
    group.add(trace);
  }
  for (let i = 0; i < 10; i++) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), lineMat);
    node.position.set(-3 + i * 0.7, 0.28, Math.cos(i * 1.7));
    group.add(node);
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    renderer.setSize(rect.width, Math.max(rect.height, 620), false);
    camera.aspect = rect.width / Math.max(rect.height, 620);
    camera.updateProjectionMatrix();
  }
  function animate() {
    group.rotation.x = -0.55;
    group.rotation.y += 0.004;
    group.position.x = 1.4;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  addEventListener("resize", resize);
  resize();
  animate();
}

function mat(color, emissive = false) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.36,
    metalness: 0.18,
    emissive: emissive ? color : 0x000000,
    emissiveIntensity: emissive ? 0.75 : 0
  });
}

function initComponent3D() {
  const host = $("#component-3d");
  componentScene = new THREE.Scene();
  componentCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  componentCamera.position.set(0, 1.5, 6);
  componentRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  componentRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(componentRenderer.domElement);
  componentScene.add(new THREE.HemisphereLight(0xffffff, 0x250000, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 4);
  const red = new THREE.PointLight(0xef4444, 3, 12);
  red.position.set(-2, 1, 3);
  componentScene.add(key, red);
  componentGroup = new THREE.Group();
  componentScene.add(componentGroup);

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  host.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    componentGroup.rotation.y += (event.clientX - lastX) * 0.01;
    componentGroup.rotation.x += (event.clientY - lastY) * 0.01;
    lastX = event.clientX;
    lastY = event.clientY;
  });
  host.addEventListener("pointerup", () => dragging = false);

  $("#component-select").addEventListener("change", (event) => {
    currentComponent = event.target.value;
    exploded = false;
    $("#explode-toggle").textContent = "Explode";
    buildComponent();
  });
  $("#explode-toggle").addEventListener("click", () => {
    exploded = !exploded;
    $("#explode-toggle").textContent = exploded ? "Assemble" : "Explode";
    buildComponent();
  });
  $$(".mini-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".mini-tabs button").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      currentInfo = button.dataset.info;
      updateComponentText();
    });
  });
  $$("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.view === "zoomIn") componentCamera.position.z = Math.max(3.4, componentCamera.position.z - 0.5);
      if (button.dataset.view === "zoomOut") componentCamera.position.z = Math.min(9, componentCamera.position.z + 0.5);
      if (button.dataset.view === "pan") componentGroup.position.x = componentGroup.position.x > 0 ? -0.5 : 0.5;
    });
  });
  $("#speak-component").addEventListener("click", () => speak(`${componentData[currentComponent].name}. ${componentData[currentComponent][currentInfo]}`));

  addEventListener("resize", resizeComponent3D);
  buildComponent();
  resizeComponent3D();
  animateComponent3D();
}

function addMesh(mesh, x = 0, y = 0, z = 0) {
  mesh.position.set(x, y, z);
  componentGroup.add(mesh);
  return mesh;
}

function buildComponent() {
  componentGroup.clear();
  componentGroup.position.set(0, 0, 0);
  const data = componentData[currentComponent];
  const main = mat(data.color, currentComponent === "led");
  const red = mat(0xef4444, true);
  const metal = mat(0xc9ccd3);
  const off = exploded ? 0.45 : 0;

  if (currentComponent === "resistor") {
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 2.2, 48), main), 0, 0, 0).rotation.z = Math.PI / 2;
    [-0.55, -0.1, 0.35].forEach((x) => addMesh(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 12, 48), red), x, off, 0).rotation.y = Math.PI / 2);
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2, 24), metal), -2.1 - off, 0, 0).rotation.z = Math.PI / 2;
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2, 24), metal), 2.1 + off, 0, 0).rotation.z = Math.PI / 2;
  } else if (currentComponent === "capacitor") {
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.7, 56), main), 0, off, 0);
    addMesh(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.05), red), 0.45, off, 0.72);
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 24), metal), -0.32, -1.45 - off, 0).rotation.x = Math.PI / 2;
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 24), metal), 0.32, -1.32 - off, 0).rotation.x = Math.PI / 2;
  } else if (currentComponent === "diode" || currentComponent === "led") {
    addMesh(new THREE.Mesh(currentComponent === "led" ? new THREE.SphereGeometry(0.58, 36, 36) : new THREE.CylinderGeometry(0.42, 0.42, 1.6, 48), main), 0, off, 0).rotation.z = Math.PI / 2;
    addMesh(new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.035, 12, 48), red), 0.5, off, 0).rotation.y = Math.PI / 2;
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2, 24), metal), -1.8 - off, 0, 0).rotation.z = Math.PI / 2;
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2, 24), metal), 1.8 + off, 0, 0).rotation.z = Math.PI / 2;
  } else if (currentComponent === "transistor") {
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.5, 48), main), 0, off, 0);
    [-0.35, 0, 0.35].forEach((x) => addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.7, 24), metal), x, -0.9 - off, 0).rotation.x = Math.PI / 2);
  } else if (currentComponent === "transformer") {
    addMesh(new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 16, 80), metal), -0.55 - off, 0, 0);
    addMesh(new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 16, 80), metal), 0.55 + off, 0, 0);
    for (let i = 0; i < 10; i++) {
      addMesh(new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 8, 28), red), -1.0 + i * 0.22, 0, 0).rotation.y = Math.PI / 2;
    }
  } else if (currentComponent === "relay") {
    addMesh(new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.3, 0.85), main), 0, off, 0);
    addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 32), red), -0.55, off, 0).rotation.z = Math.PI / 2;
    addMesh(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.08), metal), 0.55 + off, 0.2, 0.48);
  } else {
    addMesh(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.55, 0.35), main), 0, off, 0);
    for (let i = 0; i < 12; i++) {
      const x = -1 + (i % 6) * 0.4;
      const y = i < 6 ? -1.05 - off : 1.05 + off;
      addMesh(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.58, 0.08), metal), x, y, 0);
    }
    addMesh(new THREE.Mesh(new THREE.CircleGeometry(0.11, 32), red), -0.9, -0.48, 0.19);
  }

  updateComponentText();
}

function updateComponentText() {
  const data = componentData[currentComponent];
  $("#component-title").textContent = data.name;
  $("#component-copy").textContent = data[currentInfo];
  $("#component-labels").innerHTML = data.labels.map((label) => `<span>${label}</span>`).join("");
}

function resizeComponent3D() {
  if (!componentRenderer) return;
  const rect = $("#component-3d").getBoundingClientRect();
  componentRenderer.setSize(rect.width, rect.height, false);
  componentCamera.aspect = rect.width / rect.height;
  componentCamera.updateProjectionMatrix();
}

function animateComponent3D() {
  componentGroup.rotation.y += 0.004;
  componentRenderer.render(componentScene, componentCamera);
  requestAnimationFrame(animateComponent3D);
}

function initLab() {
  const board = $("#lab-board");
  $$(".part-bin button").forEach((button) => {
    button.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", button.dataset.part));
  });
  board.addEventListener("dragover", (event) => event.preventDefault());
  board.addEventListener("drop", (event) => {
    event.preventDefault();
    const rect = $("#lab-canvas").getBoundingClientRect();
    const part = event.dataTransfer.getData("text/plain");
    if (!part) return;
    labParts.push({ part, x: (event.clientX - rect.left) * (1000 / rect.width), y: (event.clientY - rect.top) * (600 / rect.height) });
    drawLab();
  });

  ["experiment-select", "voltage-range", "resistance-range"].forEach((id) => {
    $(`#${id}`).addEventListener("input", drawLab);
  });
  $("#run-experiment").addEventListener("click", () => {
    drawLab(true);
    if (progressState.loggedIn) {
      const experiment = $("#experiment-select").value;
      if (!progressState.experimentsCompleted.includes(experiment)) {
        progressState.experimentsCompleted.push(experiment);
      }
      addActivity(`Completed experiment: ${experiment}`);
    }
    toast("Experiment running with AI diagnostics");
  });
  $("#clear-lab").addEventListener("click", () => {
    labParts = [];
    drawLab();
  });
  drawLab();
}

function drawLab(running = false) {
  const canvas = $("#lab-canvas");
  const ctx = canvas.getContext("2d");
  const experiment = $("#experiment-select").value;
  const voltage = Number($("#voltage-range").value);
  const resistance = Number($("#resistance-range").value);
  $("#voltage-read").textContent = `${voltage} V`;
  $("#resistance-read").textContent = `${resistance} ohm`;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height, 40, "rgba(239,68,68,0.09)");

  ctx.strokeStyle = "rgba(239,68,68,0.82)";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#ef4444";
  ctx.shadowBlur = 16;
  roundRect(ctx, 170, 140, 650, 280, 26, true);
  drawLabSymbol(ctx, "battery", 170, 280);

  if (experiment.includes("Forward")) {
    drawLabSymbol(ctx, "diode", 420, 140);
    drawLabSymbol(ctx, "led", 620, 140, running);
    drawElectrons(ctx, running ? 1 : 0.35);
    $("#lab-ai").textContent = "Forward bias lowers the junction barrier. Current flows, so the LED glows when polarity and series resistance are correct.";
  } else if (experiment.includes("Reverse")) {
    drawLabSymbol(ctx, "diode", 420, 140, false, true);
    drawLabSymbol(ctx, "led", 620, 140, false);
    drawElectrons(ctx, 0.08);
    $("#lab-ai").textContent = "Reverse bias blocks majority-carrier current. The LED remains OFF; only tiny leakage current is visualized.";
  } else if (experiment.includes("Ohm")) {
    drawLabSymbol(ctx, "resistor", 440, 140);
    drawLabSymbol(ctx, "bulb", 640, 140, voltage / Math.max(resistance / 120, 1));
    $("#lab-ai").textContent = `Ohm's law predicts I = V/R. Current is about ${(voltage / resistance).toFixed(3)} A in this simplified model.`;
    drawElectrons(ctx, Math.min(voltage / 8, 1));
  } else if (experiment.includes("RC")) {
    drawLabSymbol(ctx, "resistor", 400, 140);
    drawLabSymbol(ctx, "capacitor", 620, 280, running);
    drawRcGraph(ctx, experiment.includes("Charging"));
    $("#lab-ai").textContent = experiment.includes("Charging")
      ? "Capacitor voltage rises exponentially toward the supply voltage during charging."
      : "Capacitor voltage falls exponentially as stored charge leaves the plates.";
  } else if (experiment.includes("Parallel")) {
    drawBranch(ctx, 330, 190, 690, 190);
    drawBranch(ctx, 330, 330, 690, 330);
    drawLabSymbol(ctx, "resistor", 510, 190);
    drawLabSymbol(ctx, "bulb", 510, 330, 0.8);
    $("#lab-ai").textContent = "Parallel circuits split current across branches while voltage remains the same across each branch.";
    drawElectrons(ctx, 0.8);
  } else {
    drawLabSymbol(ctx, "resistor", 420, 140);
    drawLabSymbol(ctx, "ammeter", 620, 140);
    $("#lab-ai").textContent = "Trace the loop, verify source polarity, and compare measured values with Kirchhoff laws.";
    drawElectrons(ctx, running ? 0.8 : 0.35);
  }

  labParts.forEach((item) => drawLabSymbol(ctx, item.part, item.x, item.y));
}

function drawGrid(ctx, width, height, step, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r, strokeOnly = false) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (strokeOnly) ctx.stroke();
  else ctx.fill();
}

function drawLabSymbol(ctx, part, x, y, active = false, reverse = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = active ? "#ef4444" : "transparent";
  ctx.shadowBlur = active ? 24 : 0;
  ctx.strokeStyle = active ? "#fecaca" : "#ef4444";
  ctx.fillStyle = active ? "rgba(239,68,68,0.45)" : "rgba(239,68,68,0.12)";
  ctx.lineWidth = 4;
  if (part === "battery") {
    ctx.beginPath();
    ctx.moveTo(-28, -48); ctx.lineTo(-28, 48);
    ctx.moveTo(22, -30); ctx.lineTo(22, 30);
    ctx.stroke();
    text(ctx, "DC", -18, 78);
  } else if (part === "resistor") {
    ctx.beginPath();
    ctx.moveTo(-70, 0);
    for (let i = 0; i < 6; i++) ctx.lineTo(-46 + i * 18, i % 2 ? -24 : 24);
    ctx.lineTo(72, 0);
    ctx.stroke();
    text(ctx, "R", -8, -36);
  } else if (part === "diode" || part === "led") {
    ctx.beginPath();
    ctx.moveTo(-38, -36);
    ctx.lineTo(-38, 36);
    ctx.lineTo(34, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(42, -38); ctx.lineTo(42, 38);
    ctx.stroke();
    if (reverse) {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(-48, -48, 102, 96);
    }
    if (part === "led" && active) {
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, part.toUpperCase(), -24, -54);
  } else if (part === "bulb") {
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-24, -22); ctx.lineTo(24, 22);
    ctx.moveTo(24, -22); ctx.lineTo(-24, 22);
    ctx.stroke();
    text(ctx, "Bulb", -28, 72);
  } else if (part === "capacitor") {
    ctx.beginPath();
    ctx.moveTo(-26, -54); ctx.lineTo(-26, 54);
    ctx.moveTo(26, -54); ctx.lineTo(26, 54);
    ctx.stroke();
    text(ctx, "C", -8, 82);
  } else {
    roundRect(ctx, -46, -34, 92, 68, 14);
    ctx.stroke();
    text(ctx, part.toUpperCase(), -42, 8);
  }
  ctx.restore();
}

function drawBranch(ctx, x1, y1, x2, y2) {
  ctx.save();
  ctx.strokeStyle = "rgba(239,68,68,0.72)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function text(ctx, value, x, y) {
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 18px Inter";
  ctx.fillText(value, x, y);
}

function drawElectrons(ctx, intensity) {
  const now = performance.now() / 420;
  ctx.save();
  ctx.fillStyle = "#fecaca";
  ctx.shadowColor = "#ef4444";
  ctx.shadowBlur = 18;
  for (let i = 0; i < 24 * intensity; i++) {
    const t = (i / 24 + now * 0.08) % 1;
    let x;
    let y;
    if (t < 0.5) {
      x = 170 + t * 2 * 650;
      y = 140;
    } else {
      x = 820 - (t - 0.5) * 2 * 650;
      y = 420;
    }
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRcGraph(ctx, charging) {
  ctx.save();
  ctx.translate(680, 350);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.strokeRect(0, 0, 220, 130);
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = 0; x < 220; x++) {
    const t = x / 220;
    const v = charging ? 1 - Math.exp(-4 * t) : Math.exp(-4 * t);
    const y = 118 - v * 105;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function initScope() {
  ["wave-type", "freq", "amp", "phase"].forEach((id) => $(`#${id}`).addEventListener("input", drawScope));
  drawScope();
}

function drawScope() {
  const canvas = $("#scope-canvas");
  const ctx = canvas.getContext("2d");
  const type = $("#wave-type").value;
  const frequency = Number($("#freq").value);
  const amplitude = Number($("#amp").value);
  const phase = Number($("#phase").value) * Math.PI / 180;
  $("#freq-read").textContent = `${frequency} Hz`;
  $("#amp-read").textContent = `${amplitude} V`;
  $("#phase-read").textContent = `${Math.round(phase * 180 / Math.PI)} deg`;
  $("#scope-ai").textContent = `For a ${type} signal, frequency controls how often the pattern repeats, amplitude controls height, and phase shifts the trace sideways.`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height, 44, "rgba(239,68,68,0.12)");
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  scopeTick += 0.018;
  ctx.strokeStyle = "#ef4444";
  ctx.shadowColor = "#ef4444";
  ctx.shadowBlur = 18;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = 0; x < canvas.width; x++) {
    const t = x / canvas.width;
    const angle = Math.PI * 2 * frequency * t + phase + scopeTick;
    let value = Math.sin(angle);
    if (type === "square") value = value >= 0 ? 1 : -1;
    if (type === "triangle") value = 2 * Math.abs(2 * ((frequency * t + phase / (Math.PI * 2) + scopeTick / 6) % 1) - 1) - 1;
    if (type === "pwm") value = ((frequency * t + phase / (Math.PI * 2) + scopeTick / 6) % 1) < 0.35 ? 1 : -1;
    const y = canvas.height / 2 - value * amplitude * 44;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (!scopeFramePending) {
    scopeFramePending = true;
    requestAnimationFrame(() => {
      scopeFramePending = false;
      drawScope();
    });
  }
}

function initQuiz() {
  $("#next-quiz").addEventListener("click", () => {
    quizIndex = (quizIndex + 1) % quizzes.length;
    renderQuiz();
  });
  setInterval(() => {
    timeLeft = Math.max(0, timeLeft - 1);
    $("#quiz-timer").textContent = `${timeLeft}s`;
    if (timeLeft === 0) {
      timeLeft = 60;
      quizIndex = (quizIndex + 1) % quizzes.length;
      renderQuiz();
    }
  }, 1000);
  renderQuiz();
}

function renderQuiz() {
  const item = quizzes[quizIndex];
  $("#quiz-question").textContent = `${item.type}: ${item.question}`;
  $("#quiz-bar").style.width = `${((quizIndex + 1) / quizzes.length) * 100}%`;
  $("#quiz-score").textContent = score;
  $("#quiz-feedback").textContent = "Choose an answer to receive AI feedback.";
  $("#quiz-options").innerHTML = "";
  let answered = false;
  item.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      const correct = index === item.answer;
      if (correct) score += 10;
      if (progressState.loggedIn) {
        progressState.quizAttempts += 1;
        if (correct) progressState.quizCorrect += 1;
        addActivity(`${correct ? "Correct" : "Attempted"} quiz: ${item.type}`);
      }
      button.classList.add(correct ? "correct" : "wrong");
      $$("#quiz-options button").forEach((choice, choiceIndex) => {
        choice.disabled = true;
        if (choiceIndex === item.answer) choice.classList.add("correct");
      });
      $("#quiz-score").textContent = score;
      $("#quiz-feedback").textContent = `${correct ? "Correct." : "Incorrect."} ${item.feedback}`;
      if (correct) toast("Achievement progress updated");
    });
    $("#quiz-options").appendChild(button);
  });
}

function initTutor() {
  addMessage("I am your AI electronics tutor. Ask about transistors, modulation, AM/FM, op-amps, circuits, or waveforms.", "ai");
  $(".prompt-chips").addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON") $("#tutor-input").value = event.target.textContent;
  });
  $("#ask-ai").addEventListener("click", askTutor);
  $("#voice-out").addEventListener("click", () => speak(lastTutorAnswer || "Ask a question first, then I can speak the explanation."));
  $("#voice-in").addEventListener("click", voiceInput);
}

function askTutor() {
  const input = $("#tutor-input");
  const question = input.value.trim();
  if (!question) return;
  addMessage(question, "user");
  input.value = "";
  const typing = addMessage("Thinking", "ai typing");
  setTimeout(() => {
    lastTutorAnswer = tutorAnswer(question);
    typing.classList.remove("typing");
    typing.textContent = lastTutorAnswer;
    if (progressState.loggedIn) {
      progressState.tutorQuestions += 1;
      addActivity(`Asked AI Tutor: ${question.slice(0, 42)}${question.length > 42 ? "..." : ""}`);
    }
  }, 550);
}

const tutorKnowledge = [
  {
    keys: ["transistor", "bjt", "npn", "pnp", "base", "collector", "emitter"],
    answer: "A transistor is a semiconductor device used as a switch or amplifier. In a BJT, a small base current controls a larger collector-emitter current. Main regions: cutoff means OFF, active means amplification, and saturation means fully ON. For switching an LED or relay, use a base resistor and make sure the emitter, collector, and supply polarity are correct. Diagram suggestion: draw collector to load, emitter to ground, and base driven through a resistor."
  },
  {
    keys: ["mosfet", "gate", "drain", "source", "field effect"],
    answer: "A MOSFET is a voltage-controlled transistor. Gate voltage controls the channel between drain and source. It needs almost no steady gate current, so it is efficient for switching. For an N-channel MOSFET used as a low-side switch, connect source to ground, drain to the load, and drive the gate above the threshold voltage. Important terms: Vgs(th), Rds(on), drain current, and gate charge."
  },
  {
    keys: ["diode", "forward bias", "reverse bias", "rectifier", "zener"],
    answer: "A diode conducts mainly in one direction. In forward bias, the anode is more positive than the cathode and current flows after the forward voltage is reached, about 0.7 V for silicon and lower for Schottky diodes. In reverse bias, current is blocked except small leakage. A rectifier converts AC to pulsating DC. A Zener diode is designed to operate in reverse breakdown for voltage regulation."
  },
  {
    keys: ["led", "light emitting", "brightness", "current limiting"],
    answer: "An LED is a diode that emits light in forward bias. It must have current limiting, usually a series resistor, because a small voltage increase can cause a large current rise. Resistor formula: R = (Vsupply - Vled) / Iled. Example: for 5 V supply, 2 V LED, and 10 mA current, R = (5 - 2) / 0.01 = 300 ohm."
  },
  {
    keys: ["resistor", "resistance", "ohm", "ohm's law", "current", "voltage"],
    answer: "A resistor opposes current flow. Ohm's law is V = I x R, where V is voltage in volts, I is current in amperes, and R is resistance in ohms. If resistance increases while voltage stays constant, current decreases. Resistors are used for current limiting, voltage division, biasing, pull-up/pull-down networks, and timing with capacitors."
  },
  {
    keys: ["capacitor", "capacitance", "charge", "rc", "charging", "discharging"],
    answer: "A capacitor stores energy in an electric field between two plates. It resists sudden voltage changes. In an RC charging circuit, capacitor voltage follows Vc = Vs(1 - e^(-t/RC)); while discharging, Vc = V0e^(-t/RC). The time constant tau = R x C. After one time constant, charging reaches about 63.2% of final voltage."
  },
  {
    keys: ["inductor", "inductance", "coil", "magnetic"],
    answer: "An inductor stores energy in a magnetic field and resists sudden current changes. Its voltage is V = L(di/dt). In DC steady state it behaves almost like a short circuit, while at high frequency its reactance increases: XL = 2*pi*f*L. Inductors are used in filters, power converters, relays, transformers, and tuning circuits."
  },
  {
    keys: ["op-amp", "opamp", "operational amplifier", "inverting", "non-inverting"],
    answer: "An op-amp is a high-gain differential amplifier with inverting and non-inverting inputs. With negative feedback, it can make accurate amplifiers and filters. Inverting amplifier gain is -Rf/Rin. Non-inverting amplifier gain is 1 + Rf/Rg. Ideal op-amp assumptions: very high input impedance, very low output impedance, and nearly zero input voltage difference when negative feedback is active."
  },
  {
    keys: ["am", "fm", "amplitude modulation", "frequency modulation"],
    answer: "AM and FM are modulation methods. In AM, the carrier amplitude changes according to the message signal while carrier frequency stays constant. In FM, the carrier frequency changes according to the message signal while amplitude stays nearly constant. FM usually gives better noise immunity because many noise sources disturb amplitude more than frequency."
  },
  {
    keys: ["modulation", "carrier", "demodulation", "communication"],
    answer: "Modulation means placing information onto a high-frequency carrier so it can travel efficiently through a channel. The message can vary the carrier's amplitude, frequency, or phase. Demodulation recovers the original message at the receiver. Diagram suggestion: show message signal, carrier signal, modulated signal, channel, and detector."
  },
  {
    keys: ["kvl", "kirchhoff voltage", "loop law"],
    answer: "Kirchhoff Voltage Law says the algebraic sum of all voltages around any closed loop is zero. It comes from conservation of energy. In practice, source voltage equals the sum of voltage drops in a series loop. Example: a 10 V source with drops of 4 V and 6 V satisfies KVL because 10 - 4 - 6 = 0."
  },
  {
    keys: ["kcl", "kirchhoff current", "node law"],
    answer: "Kirchhoff Current Law says the total current entering a node equals the total current leaving it. It comes from conservation of charge. Example: if 5 mA enters a node and one branch takes 2 mA, the other branch must take 3 mA."
  },
  {
    keys: ["series", "parallel", "circuit"],
    answer: "In a series circuit, the same current flows through all components and voltage divides across them. Total resistance is Rtotal = R1 + R2 + ... In a parallel circuit, voltage is the same across each branch and current divides. Equivalent resistance is found using 1/Rtotal = 1/R1 + 1/R2 + ..."
  },
  {
    keys: ["oscilloscope", "waveform", "sine", "square", "triangle", "pwm", "frequency", "amplitude", "phase"],
    answer: "An oscilloscope displays voltage versus time. Amplitude is the signal height, frequency is cycles per second, period is T = 1/f, and phase is the horizontal shift between signals. A sine wave is smooth, a square wave switches between levels, a triangle wave ramps linearly, and PWM changes duty cycle to control average power."
  },
  {
    keys: ["transformer", "turns ratio", "primary", "secondary"],
    answer: "A transformer transfers AC power using mutual induction. Voltage ratio equals turns ratio: Vs/Vp = Ns/Np. A step-up transformer has more secondary turns than primary turns; a step-down transformer has fewer. Transformers need changing magnetic flux, so they do not work with steady DC."
  },
  {
    keys: ["relay", "coil", "contacts", "flyback"],
    answer: "A relay is an electrically controlled switch. Current through the coil creates a magnetic field that moves contacts. A flyback diode is placed across the coil in DC circuits to protect the transistor or driver from the high reverse voltage produced when the coil turns off."
  }
];

function tutorAnswer(question) {
  const q = question.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ");
  const scored = tutorKnowledge.map((topic) => ({
    topic,
    score: topic.keys.reduce((total, key) => total + (q.includes(key) ? key.split(" ").length + 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);

  if (scored[0].score > 0) {
    const related = scored[1].score > 0 ? ` Related concept: ${scored[1].topic.keys[0]}.` : "";
    return `${scored[0].topic.answer}${related}`;
  }

  if (q.includes("difference") || q.includes("compare")) {
    return "To compare two electronics concepts, check these points: what each device stores or controls, its voltage-current behavior, symbol, applications, and limitations. Ask with the two topic names, for example 'difference between capacitor and inductor', and I will explain them point by point.";
  }

  if (q.includes("formula") || q.includes("calculate")) {
    return "For calculations, identify the known values and the target quantity first. Common formulas are V = I x R, P = V x I, tau = R x C, T = 1/f, inverting op-amp gain = -Rf/Rin, and non-inverting gain = 1 + Rf/Rg.";
  }

  return "I can help with electronics basics, components, Ohm's law, diode biasing, transistors, op-amps, modulation, AM/FM, KVL, KCL, RC circuits, waveforms, transformers, and relays. Please ask one specific concept or circuit problem so I can give a precise educational explanation.";
}

function addMessage(textValue, type) {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = textValue;
  $("#chat").appendChild(node);
  node.scrollIntoView({ block: "end" });
  return node;
}

function speak(textValue) {
  if (!("speechSynthesis" in window)) {
    toast("Voice output is not supported in this browser");
    return;
  }
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(textValue));
}

function voiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    toast("Voice input is not supported in this browser");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.onresult = (event) => {
    $("#tutor-input").value = event.results[0][0].transcript;
    toast("Voice captured");
  };
  recognition.start();
}

function initAuth() {
  const modal = $("#auth");
  const protectedHashes = new Set(["#modules", "#virtual-lab", "#signals", "#quiz", "#ai-tutor", "#dashboard", "#analytics"]);
  const openLogin = () => {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  };
  const closeLogin = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  };

  $("#student-reg").addEventListener("input", () => {
    const valid = /^[0-9]{5}[A-Z][0-9]{4}$/.test($("#student-reg").value.trim());
    $("#student-login").classList.toggle("invalid", $("#student-reg").value.length > 0 && !valid);
    $("#reg-message").textContent = valid ? "Valid registration number" : "Format: 23481A0409";
  });
  $("#student-login").addEventListener("submit", (event) => {
    event.preventDefault();
    const valid = $("#student-reg").value.trim() === "23481A0409" && $("#student-password").value === "student123";
    if (!valid) {
      $("#student-login").classList.add("invalid");
      toast("Use the displayed student credentials");
      return;
    }
    progressState.loggedIn = true;
    progressState.userType = "student";
    sessionStorage.setItem("voltEdgeSession", "true");
    addActivity("Student logged in");
    saveProgress();
    updateDashboard();
    closeLogin();
    toast("Student dashboard unlocked");
    location.hash = "#dashboard";
  });
  $("#faculty-login").addEventListener("submit", (event) => {
    event.preventDefault();
    const valid = $("#faculty-id").value.trim() === "FAC-ECE-102" && $("#faculty-password").value === "faculty123";
    if (!valid) {
      toast("Use the displayed faculty credentials");
      return;
    }
    progressState.loggedIn = true;
    progressState.userType = "faculty";
    sessionStorage.setItem("voltEdgeSession", "true");
    saveProgress();
    updateDashboard();
    closeLogin();
    toast("Faculty console preview unlocked");
  });
  $$("[data-open-login]").forEach((button) => button.addEventListener("click", openLogin));
  $$("[data-close-login]").forEach((button) => button.addEventListener("click", closeLogin));
  $$("[data-requires-login]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!progressState.loggedIn) {
        event.preventDefault();
        history.replaceState(null, "", "#home");
        openLogin();
        toast("Login first to access learning modules");
      }
    });
  });

  const guardRoute = (showMessage = false) => {
    if (!progressState.loggedIn && protectedHashes.has(location.hash)) {
      history.replaceState(null, "", "#home");
      window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
      if (showMessage) {
        openLogin();
        toast("Login is required before viewing modules");
      }
    }
  };
  guardRoute(false);
  addEventListener("hashchange", () => guardRoute(true));
}

function initCharts() {
  const options = {
    responsive: true,
    plugins: { legend: { labels: { color: "#d1d5db" } } },
    scales: {
      x: { ticks: { color: "#d1d5db" }, grid: { color: "rgba(239,68,68,0.08)" } },
      y: { ticks: { color: "#d1d5db" }, grid: { color: "rgba(239,68,68,0.08)" } }
    }
  };
  quizChart = new Chart($("#quiz-chart"), {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      datasets: [{ label: "Quiz %", data: [58, 64, 72, 76, 84, 91], borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.16)", tension: 0.42, fill: true }]
    },
    options
  });
  weeklyChart = new Chart($("#weekly-chart"), {
    type: "line",
    data: {
      labels: ["W1", "W2", "W3", "W4", "W5"],
      datasets: [
        { label: "Learning Hours", data: [3, 6, 5, 9, 12], borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.14)", tension: 0.38, fill: true },
        { label: "Experiments", data: [1, 3, 4, 6, 10], borderColor: "#fecaca", backgroundColor: "rgba(254,202,202,0.08)", tension: 0.38 }
      ]
    },
    options
  });
  topicChart = new Chart($("#topic-chart"), {
    type: "doughnut",
    data: {
      labels: ["Quiz Accuracy", "Lab Practice", "Tutor Usage", "Overall Readiness"],
      datasets: [{ data: [1, 1, 1, 1], backgroundColor: ["#ef4444", "#dc2626", "#b91c1c", "#991b1b"], borderColor: "#050505" }]
    },
    options: { plugins: { legend: { labels: { color: "#d1d5db" } } } }
  });
}

function calculateProgress() {
  if (!progressState.loggedIn) return 0;
  const quizScore = progressState.quizAttempts ? (progressState.quizCorrect / progressState.quizAttempts) * 35 : 0;
  const labScore = Math.min(progressState.experimentsCompleted.length / 10, 1) * 35;
  const tutorScore = Math.min(progressState.tutorQuestions / 8, 1) * 20;
  const activityScore = Math.min(progressState.activities.length / 5, 1) * 10;
  return Math.round(quizScore + labScore + tutorScore + activityScore);
}

function updateDashboard() {
  const locked = !progressState.loggedIn;
  document.body.classList.toggle("authenticated", progressState.loggedIn);
  $("#dashboard-lock").classList.toggle("hidden", !locked);
  $("#dashboard-content").classList.toggle("locked", locked);

  if (locked) {
    $("#dashboard-intro").textContent = "Login to track quiz performance, completed experiments, recommended topics, weak areas, and AI study suggestions.";
    return;
  }

  const progress = calculateProgress();
  const quizPercent = progressState.quizAttempts ? Math.round((progressState.quizCorrect / progressState.quizAttempts) * 100) : 0;
  $("#dashboard-intro").textContent = `Logged in as ${progressState.userType}. Your progress updates from quizzes, labs, and AI tutor sessions.`;
  $("#progress-ring").style.setProperty("--value", progress);
  $("#progress-percent").textContent = `${progress}%`;
  $("#progress-copy").textContent = `${progressState.experimentsCompleted.length} experiments completed, ${progressState.quizAttempts} quiz attempts, and ${progressState.tutorQuestions} AI tutor questions tracked.`;
  $("#activity-list").innerHTML = progressState.activities.length
    ? progressState.activities.map((item) => `<li>${item}</li>`).join("")
    : "<li>No activity yet. Start a lab, quiz, or AI tutor session.</li>";

  let suggestion = "Start with Ohm's law, diode biasing, and the oscilloscope module to build a strong foundation.";
  if (progressState.quizAttempts > 0 && quizPercent < 70) suggestion = "Revise the quiz explanations and ask the AI tutor about every incorrect concept before retrying.";
  if (progressState.experimentsCompleted.length < 3) suggestion = "Run at least three virtual lab experiments: Forward Bias Diode, Ohm's Law Verification, and RC Charging Circuit.";
  if (progressState.tutorQuestions < 2) suggestion = "Ask the AI tutor two theory questions after each lab to connect practical observation with concept clarity.";
  if (progress >= 75) suggestion = "Great momentum. Move toward KVL, KCL, op-amps, and communication systems for advanced mastery.";
  $("#study-suggestion").textContent = suggestion;

  $("#badge-beginner").classList.toggle("unlocked", progress >= 1);
  $("#badge-intermediate").classList.toggle("unlocked", progress >= 35);
  $("#badge-advanced").classList.toggle("unlocked", progress >= 65);
  $("#badge-expert").classList.toggle("unlocked", progress >= 90);

  if (quizChart) {
    quizChart.data.datasets[0].data = [0, Math.round(quizPercent * 0.35), Math.round(quizPercent * 0.55), Math.round(quizPercent * 0.75), quizPercent, quizPercent];
    quizChart.update();
  }
  if (weeklyChart) {
    weeklyChart.data.datasets[0].data = [0, 1, progressState.tutorQuestions + 1, progressState.activities.length + 2, Math.max(progressState.activities.length + progressState.experimentsCompleted.length, 1)];
    weeklyChart.data.datasets[1].data = [0, 0, 1, Math.max(progressState.experimentsCompleted.length - 1, 0), progressState.experimentsCompleted.length];
    weeklyChart.update();
  }
  if (topicChart) {
    topicChart.data.datasets[0].data = [
      Math.max(quizPercent, 1),
      Math.max(progressState.experimentsCompleted.length * 10, 1),
      Math.max(progressState.tutorQuestions * 8, 1),
      Math.max(progress, 1)
    ];
    topicChart.update();
  }

  const risks = [];
  if (progressState.quizAttempts === 0) risks.push("Quiz accuracy is unknown. Attempt the Quiz Arena to measure concept recall.");
  else if (quizPercent < 70) risks.push("Quiz accuracy is below 70%. Review incorrect answers and ask the AI Tutor for explanations.");
  if (progressState.experimentsCompleted.length < 3) risks.push("Practical exposure is low. Complete diode biasing, Ohm's law, and RC charging experiments.");
  if (progressState.tutorQuestions < 3) risks.push("Theory reinforcement is limited. Ask the AI Tutor at least three follow-up questions.");
  if (!risks.length) risks.push("No major risk detected. Continue with KVL, KCL, op-amps, and communication systems.");

  const plan = [];
  if (progressState.experimentsCompleted.length < 3) plan.push("Run one virtual lab experiment and write down the expected observation.");
  if (progressState.quizAttempts < 5) plan.push("Attempt five quiz questions and read the AI feedback after each one.");
  if (progressState.tutorQuestions < 3) plan.push("Ask the AI Tutor about every concept that felt unclear.");
  if (progress >= 70) plan.push("Move to advanced circuit analysis: KVL, KCL, op-amps, and modulation.");
  if (!plan.length) plan.push("Maintain mastery by alternating one lab, one quiz, and one tutor question per topic.");

  $("#readiness-score").textContent = `${progress}%`;
  $("#analytics-summary").textContent = `Readiness is based on ${progressState.quizAttempts} quiz attempts, ${progressState.experimentsCompleted.length} completed experiments, and ${progressState.tutorQuestions} tutor questions.`;
  $("#risk-list").innerHTML = risks.map((risk) => `<li>${risk}</li>`).join("");
  $("#study-plan").innerHTML = plan.map((step) => `<li>${step}</li>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initRevealAndTilt();
  initCounters();
  initHero3D();
  initComponent3D();
  initLab();
  initScope();
  initQuiz();
  initTutor();
  initAuth();
  initCharts();
  updateDashboard();
});
