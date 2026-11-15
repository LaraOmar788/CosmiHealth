import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

(() => {
  "use strict";

  const MODEL_BASE = "./assets/body-model/";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const partInfo = {
    brain: {
      name: "Brain & nervous system",
      system: "CENTRAL NERVOUS SYSTEM",
      evidence: "ADAPTATION DOCUMENTED · DETAILS EVOLVING",
      overview:
        "The brain integrates sensory information and helps coordinate movement, balance, cognition, and automatic body functions.",
      effects:
        "Microgravity changes vestibular input and the usual relationship between vision, body position, and gravity. Post-flight studies document changes in postural control; individual adaptation varies.",
      risks:
        "Temporary sensorimotor readaptation may affect orientation and balance. Brain-imaging findings and their long-term clinical meaning remain under investigation.",
      symptoms:
        "Disorientation, motion sensitivity, or unsteadiness can occur; these observations are nonspecific and do not identify a cause.",
      monitoring:
        "Mission teams may track symptom reports, balance, coordination, and other protocol-defined neurovestibular measures.",
      prevention:
        "Mission training and post-flight re-adaptation are managed by qualified teams. No single prevention method is established for every crew member.",
      sources: [
        {
          title: "NASA NTRS: Human neurovestibular studies and postural control",
          id: "20050000247",
        },
        {
          title: "NASA NTRS: Space-environment effects and open research questions",
          id: "20160014865",
        },
      ],
    },
    eyes: {
      name: "Eyes & visual system",
      system: "OCULAR SYSTEM",
      evidence: "DOCUMENTED IN SOME CREW · MECHANISM EVOLVING",
      overview:
        "The eyes and optic pathways detect light and transmit visual information to the brain.",
      effects:
        "Some astronauts develop spaceflight-associated neuro-ocular changes (SANS), including structural eye findings and altered vision during or after long-duration missions.",
      risks:
        "Visual changes can matter to crew function. The causes, individual susceptibility, long-term course, and best countermeasures are still being studied.",
      symptoms:
        "Reported changes can include blurred vision or a shift in near/far focus. Not every astronaut experiences symptoms.",
      monitoring:
        "NASA research includes visual function and eye-structure assessments; flight medical teams set the schedule and interpretation.",
      prevention:
        "Use mission-specific eye monitoring and medical guidance. This prototype cannot recommend or assess an individual countermeasure.",
      sources: [
        {
          title: "NASA Evidence Report: Risk of Spaceflight Associated Neuro-ocular Syndrome",
          id: "20180000936",
        },
        {
          title: "NASA NTRS: Finite element model of the posterior eye in microgravity",
          id: "20150018266",
        },
      ],
    },
    heart: {
      name: "Heart & circulation",
      system: "CARDIOVASCULAR SYSTEM",
      evidence: "PHYSIOLOGICAL ADAPTATION DOCUMENTED",
      overview:
        "The heart pumps blood through vessels, delivering oxygen and nutrients throughout the body.",
      effects:
        "In microgravity, body fluids shift toward the head and the cardiovascular system adapts to a different loading environment. Blood-volume and pressure regulation can also change.",
      risks:
        "Reduced tolerance to standing and lower exercise capacity may be apparent around return to gravity. The response differs among individuals and missions.",
      symptoms:
        "Light-headedness after standing or reduced exercise tolerance may be observed, especially during re-adaptation; symptoms need qualified assessment.",
      monitoring:
        "Mission protocols may include heart rate, blood pressure, exercise response, and cardiovascular testing before and after flight.",
      prevention:
        "Prescribed aerobic/resistive exercise and return-to-gravity countermeasures are planned by medical and operations teams.",
      sources: [
        {
          title: "NASA NTRS: Cardiovascular adaptation to spaceflight",
          id: "20040173169",
        },
        {
          title: "NASA Evidence Report: Muscle, aerobic capacity, and physical performance",
          id: "20220019338",
        },
      ],
    },
    lungs: {
      name: "Lungs & breathing",
      system: "RESPIRATORY SYSTEM",
      evidence: "FUNCTIONAL CHANGES MEASURED · CLINICAL SIGNIFICANCE VARIES",
      overview:
        "The lungs exchange oxygen and carbon dioxide between inhaled air and the blood.",
      effects:
        "Microgravity changes how blood and air are distributed through the lungs. Human flight studies measured changes in pulmonary tissue volume and gas-transfer measures.",
      risks:
        "The clinical importance of measured respiratory adaptations is not fully settled. A spaceflight study did not find evidence of interstitial pulmonary edema in the studied crew.",
      symptoms:
        "There is no single symptom pattern established for these adaptations. New or worsening breathlessness should be assessed by mission medical personnel.",
      monitoring:
        "Pulmonary function and respiratory symptoms may be assessed when indicated by the mission medical protocol.",
      prevention:
        "Follow the crew's prescribed exercise, cabin-environment, and medical procedures; no specific lung countermeasure is recommended here.",
      sources: [
        {
          title: "NASA NTRS: Pulmonary tissue volume and diffusing capacity in microgravity",
          id: "20040172910",
        },
        {
          title: "NASA NTRS: Space research on organs and tissues",
          id: "19940014741",
        },
      ],
    },
    bones: {
      name: "Bones & skeleton",
      system: "SKELETAL SYSTEM",
      evidence: "BONE CHANGES DOCUMENTED · FRACTURE RISK ASSESSED",
      overview:
        "The skeleton supports the body, protects organs, enables movement, and stores minerals such as calcium.",
      effects:
        "Without normal weight-bearing, bone remodeling changes. NASA tracks bone-density, structure, and recovery; effects are not identical across skeletal sites or crew members.",
      risks:
        "Long-duration flight can weaken some bones and may contribute to fracture risk. NASA's evidence report notes limitations in measurement and continuing uncertainty about recovery.",
      symptoms:
        "Bone-density changes are not usually felt as they develop. Pain after an injury is not specific and requires clinical evaluation.",
      monitoring:
        "NASA research uses measures such as DXA, quantitative CT, bone-turnover markers, and mission-specific medical assessments.",
      prevention:
        "Prescribed resistive exercise and individualized nutrition/medical plans are used and studied; follow the crew's own clinical plan.",
      sources: [
        {
          title: "NASA Evidence Report: Risk of Bone Fracture due to Spaceflight-induced Changes",
          id: "20240005190",
        },
        {
          title: "NASA Evidence Report: Muscle, aerobic capacity, and physical performance",
          id: "20220019338",
        },
      ],
    },
    muscles: {
      name: "Skeletal muscles",
      system: "MUSCULOSKELETAL SYSTEM",
      evidence: "DECONDITIONING DOCUMENTED · INDIVIDUAL RESPONSE VARIES",
      overview:
        "Skeletal muscles create movement, stabilize posture, and contribute to strength and endurance.",
      effects:
        "Reduced mechanical loading in microgravity can decondition muscle, particularly muscles used for posture and lower-limb loading. Exercise responses vary between crew members.",
      risks:
        "Loss of strength, endurance, or aerobic performance can affect demanding tasks and readaptation to gravity. The amount and time course are not uniform.",
      symptoms:
        "A person may notice reduced strength or stamina. Fatigue is nonspecific and cannot be interpreted by this tool.",
      monitoring:
        "Mission programs track exercise participation and may assess strength, endurance, and aerobic capacity under defined protocols.",
      prevention:
        "Individualized aerobic and resistive exercise is a central countermeasure; the prescription belongs to the mission medical and exercise teams.",
      sources: [
        {
          title: "NASA Evidence Report: Muscle and aerobic performance risks",
          id: "20220019338",
        },
        {
          title: "NASA NTRS: Skeletal-muscle response to unloading",
          id: "20040172850",
        },
      ],
    },
    spine: {
      name: "Spine & back",
      system: "AXIAL SKELETON",
      evidence: "POST-FLIGHT BACK PAIN REPORTED · CAUSES UNCERTAIN",
      overview:
        "The spine supports the trunk, protects the spinal cord, and allows controlled movement.",
      effects:
        "Reduced gravitational loading can alter spinal loading. NASA has examined post-flight back-pain reports, but available data do not establish one cause or a reliable individual prediction.",
      risks:
        "Back discomfort and muscle spasms have been reported after flight. The contribution of spinal lengthening, exercise, landing, and other factors remains uncertain.",
      symptoms:
        "Back pain, stiffness, or spasms are possible reports, not a diagnosis of a spinal injury.",
      monitoring:
        "Mission medical teams consider symptom history, function, and examination findings; there is no self-test in this explorer.",
      prevention:
        "Conditioning and rehabilitation are individualized. Report new, severe, or persistent back symptoms through established mission medical channels.",
      sources: [
        {
          title: "NASA NTRS: Post-flight back pain after International Space Station missions",
          id: "20150020953",
        },
        {
          title: "NASA Evidence Report: Risk of Bone Fracture from spaceflight changes",
          id: "20240005190",
        },
      ],
    },
    kidneys: {
      name: "Kidneys & urinary system",
      system: "RENAL SYSTEM",
      evidence: "RENAL-STONE RISK ASSESSED · INDIVIDUAL RISK VARIES",
      overview:
        "The kidneys filter blood, regulate fluid and electrolyte balance, and produce urine.",
      effects:
        "Fluid shifts, hydration changes, and spaceflight-related changes in calcium handling and urine chemistry may influence kidney-stone formation risk.",
      risks:
        "NASA's evidence report identifies renal stones as a concern for long-duration missions; it does not mean a stone will occur in an individual.",
      symptoms:
        "A stone can cause flank pain, blood in urine, or nausea, but symptoms vary and have other possible causes.",
      monitoring:
        "Mission medical teams may consider hydration, urine chemistry, symptoms, and the individual medical history.",
      prevention:
        "Hydration and other countermeasures must follow the mission's medical plan. Do not use this educational page to self-treat.",
      sources: [
        {
          title: "NASA Evidence Report: Risk of Renal Stone Formation",
          id: "20240012429",
        },
      ],
    },
    liver: {
      name: "Liver",
      system: "METABOLIC SYSTEM",
      evidence: "ONGOING RESEARCH · HUMAN CLINICAL EFFECTS UNCERTAIN",
      overview:
        "The liver processes nutrients and many medicines, produces important blood proteins, and supports metabolism.",
      effects:
        "NASA-supported space-biology work investigates metabolic, mitochondrial, and oxidative-stress responses that may involve liver tissue, including evidence from model organisms.",
      risks:
        "A specific spaceflight-related liver disease or predictable clinical outcome in astronauts is not established by the research cited here.",
      symptoms:
        "There is no spaceflight-specific symptom pattern established for liver effects in this evidence. Symptoms alone cannot identify liver involvement.",
      monitoring:
        "Any liver tests are selected and interpreted by qualified medical personnel; this prototype does not assess laboratory values.",
      prevention:
        "No liver-specific spaceflight countermeasure is established here. Follow mission nutrition and medical guidance.",
      sources: [
        {
          title: "NASA NTRS: Systemic microgravity responses and GeneLab research",
          id: "20180000833",
        },
        {
          title: "NASA NTRS: Space research on organs and tissues",
          id: "19940014741",
        },
      ],
    },
    digestive: {
      name: "Digestive system",
      system: "GASTROINTESTINAL SYSTEM",
      evidence: "LIMITED HUMAN EVIDENCE · MECHANISMS UNDER STUDY",
      overview:
        "The digestive system processes food, absorbs nutrients and water, and works with other systems to maintain energy and fluid balance.",
      effects:
        "NASA's literature discusses possible gastrointestinal contributions to fluid and electrolyte changes in microgravity; the mechanism and clinical importance are not fully understood.",
      risks:
        "Diet, hydration, motion sickness, and other mission factors can affect gastrointestinal comfort. The sources do not support predicting a specific disorder.",
      symptoms:
        "Nausea, appetite changes, or bowel changes are nonspecific observations and can have many causes.",
      monitoring:
        "Crew medical teams may review nutrition, hydration, medication use, and persistent gastrointestinal symptoms.",
      prevention:
        "Use mission-approved food, hydration, and medical plans. Persistent symptoms should be discussed with qualified crew medical personnel.",
      sources: [
        {
          title: "NASA NTRS: Microgravity-induced fluid and electrolyte changes",
          id: "19870051520",
        },
        {
          title: "NASA NTRS: Pharmacotherapeutic aspects of space medicine",
          id: "20050220667",
        },
      ],
    },
    immune: {
      name: "Immune & lymphatic system",
      system: "IMMUNE SYSTEM",
      evidence: "FUNCTIONAL CHANGES REPORTED · OUTCOMES UNDER STUDY",
      overview:
        "Immune and lymphatic tissues help recognize threats, coordinate immune responses, and maintain fluid balance.",
      effects:
        "Spaceflight studies report changes in some immune functions and latent-virus activity. Responses vary, and evidence from simulated deep-space conditions is not the same as a clinical outcome.",
      risks:
        "Immune changes may alter infection or inflammation-related responses; the individual risk and relevance to future exploration missions remain under study.",
      symptoms:
        "Many immune changes have no obvious symptom. Fever, rash, or feeling unwell can have many causes and require clinical assessment.",
      monitoring:
        "NASA research includes immune-cell and biomarker measurements; clinical monitoring is determined by the mission medical team.",
      prevention:
        "Follow mission infection-control, vaccination, sleep, nutrition, and medical protocols. No personalized immune-risk estimate is provided here.",
      sources: [
        {
          title: "NASA NTRS: Immune dysregulation in spaceflight and analog studies",
          id: "20190001034",
        },
        {
          title: "NASA NTRS: Immune responses under simulated deep-space conditions",
          id: "20210000525",
        },
      ],
    },
    vestibular: {
      name: "Vestibular system",
      system: "INNER EAR & BALANCE",
      evidence: "SENSORIMOTOR ADAPTATION DOCUMENTED",
      overview:
        "Inner-ear vestibular organs contribute to balance, spatial orientation, and the perception of motion.",
      effects:
        "Microgravity removes the usual gravity reference for the vestibular system. The brain adapts to altered sensory cues, then readapts after return to gravity.",
      risks:
        "Space motion sickness and post-flight balance changes can occur. The timing and severity vary, and symptoms do not by themselves indicate an injury.",
      symptoms:
        "Motion sickness, dizziness, disorientation, or unsteadiness may occur during adaptation or re-adaptation.",
      monitoring:
        "Crew medical teams use mission-specific symptom and sensorimotor assessments; persistent or severe symptoms need human evaluation.",
      prevention:
        "Training and operational countermeasures are selected by mission medical staff. This explorer does not provide treatment instructions.",
      sources: [
        {
          title: "NASA NTRS: Human neurovestibular studies and postural control",
          id: "20050000247",
        },
        {
          title: "NASA NTRS: Space medicine and motion-sickness research",
          id: "20050220667",
        },
      ],
    },
  };

  const modelFiles = {
    external: [
      "skeletal.glb",
      "muscular-1.glb",
      "muscular-2.glb",
      "muscular-3.glb",
      "muscular-4.glb",
    ],
    internal: [
      "visceral.glb",
      "cardiovascular-1.glb",
      "cardiovascular-2.glb",
      "cardiovascular-3.glb",
      "nervous-1.glb",
      "nervous-2.glb",
      "lymphoid.glb",
    ],
  };
  const partModes = {
    brain: "internal",
    eyes: "internal",
    heart: "internal",
    lungs: "internal",
    bones: "external",
    muscles: "external",
    spine: "external",
    kidneys: "internal",
    liver: "internal",
    digestive: "internal",
    immune: "internal",
    vestibular: "internal",
  };

  const state = {
    mode: "external",
    selectedPart: "bones",
    initialized: false,
    initializing: null,
    modeRequest: 0,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    modelRoot: null,
    shell: null,
    loader: null,
    modelMeshes: [],
    highlighted: [],
    loadedModels: new Map(),
    loadingModels: new Map(),
    activeFiles: [],
    animationFrame: 0,
    lastPointer: null,
    cameraGoal: null,
    targetGoal: null,
    observer: null,
    visible: false,
    motionAllowed: !reducedMotion.matches,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const canvas = $("#body-explorer-canvas");
  const stage = $("#body-explorer-stage");
  const loadingPanel = $("#body-explorer-loading");
  const retryButton = $('[data-anatomy-action="retry"]');

  function setStatus(title, detail, retry = false) {
    $("#body-explorer-status").textContent = title;
    $("#body-explorer-status-detail").textContent = detail;
    retryButton.classList.toggle("hidden", !retry);
    loadingPanel.hidden = false;
  }

  function clearStatus() {
    loadingPanel.hidden = true;
  }

  function createBodyShell() {
    const shell = new THREE.Group();
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x6ab8e2,
      emissive: 0x112f4d,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.1,
      roughness: 0.38,
      metalness: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    function addShape(geometry, position, scale = [1, 1, 1]) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.raycast = () => {};
      mesh.userData.isBodyShell = true;
      shell.add(mesh);
      return mesh;
    }

    function addSegment(start, end, radius) {
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const geometry = new THREE.CapsuleGeometry(radius, Math.max(0.01, length - 2 * radius), 4, 12);
      const mesh = addShape(geometry, [
        (start.x + end.x) / 2,
        (start.y + end.y) / 2,
        (start.z + end.z) / 2,
      ]);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    }

    const torsoPoints = [
      new THREE.Vector2(0, 0.78),
      new THREE.Vector2(0.1, 0.79),
      new THREE.Vector2(0.14, 0.91),
      new THREE.Vector2(0.13, 1.04),
      new THREE.Vector2(0.17, 1.23),
      new THREE.Vector2(0.17, 1.35),
      new THREE.Vector2(0.12, 1.43),
      new THREE.Vector2(0, 1.44),
    ];
    addShape(new THREE.LatheGeometry(torsoPoints, 32), [0, 0, 0], [1, 1, 0.62]);
    addShape(new THREE.SphereGeometry(0.13, 24, 18), [0, 0.85, 0], [1.18, 1, 0.7]);
    addShape(new THREE.SphereGeometry(0.1, 24, 18), [0, 1.58, 0], [0.87, 1.15, 0.86]);
    addSegment(new THREE.Vector3(0, 1.43, 0), new THREE.Vector3(0, 1.5, 0), 0.065);

    for (const side of [-1, 1]) {
      addSegment(
        new THREE.Vector3(side * 0.15, 1.35, 0),
        new THREE.Vector3(side * 0.23, 1.08, 0),
        0.075,
      );
      addSegment(
        new THREE.Vector3(side * 0.23, 1.08, 0),
        new THREE.Vector3(side * 0.25, 0.8, 0),
        0.055,
      );
      addShape(
        new THREE.SphereGeometry(0.055, 16, 12),
        [side * 0.25, 0.73, 0],
        [0.72, 1.2, 0.5],
      );
      addSegment(
        new THREE.Vector3(side * 0.1, 0.82, 0),
        new THREE.Vector3(side * 0.12, 0.45, 0),
        0.09,
      );
      addSegment(
        new THREE.Vector3(side * 0.12, 0.45, 0),
        new THREE.Vector3(side * 0.08, 0.12, 0),
        0.065,
      );
      addShape(
        new THREE.SphereGeometry(0.08, 16, 12),
        [side * 0.08, 0.07, 0.055],
        [1.15, 0.45, 1.9],
      );
    }

    shell.traverse((object) => {
      if (object.isMesh) object.material = material.clone();
    });
    return shell;
  }

  function setShellOpacity(opacity) {
    state.shell.traverse((object) => {
      if (object.isMesh) object.material.opacity = opacity;
    });
  }

  function createRenderer() {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x080c18);
    state.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
    state.camera.position.set(0.15, 1.13, 4.1);
    state.scene.add(new THREE.HemisphereLight(0xc9eaff, 0x10213b, 1.8));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(3, 4, 4);
    state.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x55caff, 1.7);
    fillLight.position.set(-3, 1.8, 2);
    state.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x9582ff, 1.6);
    rimLight.position.set(0, 2, -3);
    state.scene.add(rimLight);

    const grid = new THREE.GridHelper(2.4, 24, 0x315377, 0x182942);
    grid.position.y = 0.02;
    for (const gridMaterial of Array.isArray(grid.material) ? grid.material : [grid.material]) {
      gridMaterial.transparent = true;
      gridMaterial.opacity = 0.26;
    }
    state.scene.add(grid);

    state.modelRoot = new THREE.Group();
    state.scene.add(state.modelRoot);
    state.shell = createBodyShell();
    state.modelRoot.add(state.shell);

    state.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    state.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, window.matchMedia("(max-width: 740px)").matches ? 1.25 : 1.7),
    );
    state.renderer.outputColorSpace = THREE.SRGBColorSpace;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 1.2;

    state.controls = new OrbitControls(state.camera, canvas);
    state.controls.target.set(0, 0.88, 0);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.075;
    state.controls.enablePan = false;
    state.controls.minDistance = 0.75;
    state.controls.maxDistance = 7;
    state.controls.autoRotate = state.motionAllowed;
    state.controls.autoRotateSpeed = 0.45;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/",
    );
    dracoLoader.setDecoderConfig({ type: "wasm" });
    state.loader = new GLTFLoader();
    state.loader.setDRACOLoader(dracoLoader);

    state.cameraGoal = state.camera.position.clone();
    state.targetGoal = state.controls.target.clone();
    state.visible = true;
    resizeRenderer();
    startRenderLoop();

    canvas.addEventListener("pointerdown", (event) => {
      state.lastPointer = { x: event.clientX, y: event.clientY };
    });
    canvas.addEventListener("pointerup", handleModelPick);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      setStatus("3D renderer paused", "The graphics context was interrupted. Reload the page to restore it.");
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(resizeRenderer).observe(stage);
    } else {
      window.addEventListener("resize", resizeRenderer);
    }
  }

  function resizeRenderer() {
    if (!state.renderer || !state.camera) return;
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    state.renderer.setSize(width, height, false);
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
  }

  function startRenderLoop() {
    if (state.animationFrame || !state.renderer) return;
    const render = () => {
      state.animationFrame = 0;
      if (!state.visible || document.hidden || !state.renderer) return;
      if (state.targetGoal && state.cameraGoal) {
        state.controls.target.lerp(state.targetGoal, 0.1);
        state.camera.position.lerp(state.cameraGoal, 0.1);
        if (
          state.controls.target.distanceToSquared(state.targetGoal) < 0.00001 &&
          state.camera.position.distanceToSquared(state.cameraGoal) < 0.00001
        ) {
          state.targetGoal = null;
          state.cameraGoal = null;
        }
      }

      const pulse = 0.62 + (Math.sin(performance.now() * 0.002) + 1) * 0.16;
      for (const mesh of state.highlighted) {
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          if (material.emissive) material.emissiveIntensity = pulse;
        }
      }

      state.controls.update();
      state.renderer.render(state.scene, state.camera);
      state.animationFrame = window.requestAnimationFrame(render);
    };
    state.animationFrame = window.requestAnimationFrame(render);
  }

  function classifyStructure(name) {
    const text = String(name).toLowerCase();
    if (/vestibul|semicircular|utricle|saccule|cochlear|labyrinth|inner ear/.test(text)) {
      return "vestibular";
    }
    if (/eyeball|optic nerve|retina|cornea|pupil|lens|iris|sclera|conjunctiv|\\beye\\b/.test(text)) {
      return "eyes";
    }
    if (/brain|cerebr|cerebell|medulla|pons|midbrain|hypothalam|thalam|fourth ventricle/.test(text)) {
      return "brain";
    }
    if (/kidney|\\brenal\\b|ureter/.test(text)) return "kidneys";
    if (/liver|hepatic/.test(text)) return "liver";
    if (/lung|bronch|pulmonary/.test(text)) return "lungs";
    if (/heart|cardiac|atrium|ventricle|myocardium|pericard/.test(text)) return "heart";
    if (/lymph|spleen|thymus|tonsil/.test(text)) return "immune";
    if (/stomach|intestin|pancrea|gallbladder|duodenum|colon|rectum/.test(text)) {
      return "digestive";
    }
    if (/vertebr|intervertebral|spinal cord|vertebral|sacrum|coccyx/.test(text)) {
      return "spine";
    }
    if (/bone|femur|tibia|fibula|humerus|radius|ulna|scapula|clavicle|pelvis/.test(text)) {
      return "bones";
    }
    if (/muscle/.test(text)) return "muscles";
    return null;
  }

  function cloneMeshMaterials(mesh) {
    const clone = (material) => material.clone();
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
  }

  async function loadModel(file) {
    if (state.loadedModels.has(file)) return state.loadedModels.get(file);
    if (state.loadingModels.has(file)) return state.loadingModels.get(file);

    const pending = state.loader
      .loadAsync(`${MODEL_BASE}${encodeURIComponent(file)}`)
      .then((gltf) => {
        const model = gltf.scene;
        model.visible = false;
        model.traverse((object) => {
          if (!object.isMesh) return;
          cloneMeshMaterials(object);
          object.userData.anatomyName = object.userData.zid || object.name;
          object.userData.anatomyPart = classifyStructure(object.userData.anatomyName);
          if (!object.userData.anatomyPart && file === "skeletal.glb") {
            object.userData.anatomyPart = "bones";
          }
          if (!object.userData.anatomyPart && file.startsWith("muscular-")) {
            object.userData.anatomyPart = "muscles";
          }
          object.userData.modelFile = file;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          object.userData.baseEmissive = materials.map((material) => ({
            color: material.emissive ? material.emissive.clone() : null,
            intensity: material.emissiveIntensity,
          }));
          state.modelMeshes.push(object);
        });
        state.modelRoot.add(model);
        state.loadedModels.set(file, model);
        return model;
      })
      .finally(() => state.loadingModels.delete(file));

    state.loadingModels.set(file, pending);
    return pending;
  }

  function setModeButtons(mode) {
    $$("[data-anatomy-mode]").forEach((button) => {
      const active = button.dataset.anatomyMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updatePartButtons(part) {
    $$("[data-anatomy-part]").forEach((button) => {
      const selected = button.dataset.anatomyPart === part;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function renderInformation(part) {
    const info = partInfo[part];
    if (!info) return;
    const index = Object.keys(partInfo).indexOf(part) + 1;
    $("#body-explorer-organ-index").textContent = String(index).padStart(2, "0");
    $("#body-explorer-organ-name").textContent = info.name;
    $("#body-explorer-organ-system").textContent = info.system;
    $("#body-explorer-evidence").textContent = info.evidence;
    $("#body-explorer-overview").textContent = info.overview;
    updatePartButtons(part);

    const factItems = [
      ["02", "Spaceflight effects", info.effects],
      ["03", "Potential health risks", info.risks],
      ["04", "Possible symptoms", info.symptoms],
      ["05", "Monitoring", info.monitoring],
      ["06", "Prevention & countermeasures", info.prevention],
    ];
    const facts = $("#body-explorer-facts");
    facts.replaceChildren();
    for (const [number, title, text] of factItems) {
      const item = document.createElement("article");
      item.className = "body-explorer-fact";
      const header = document.createElement("div");
      header.className = "body-explorer-fact-heading";
      const indexLabel = document.createElement("span");
      indexLabel.className = "mono body-explorer-fact-index";
      indexLabel.textContent = number;
      const heading = document.createElement("h4");
      heading.textContent = title;
      const body = document.createElement("p");
      body.textContent = text;
      header.append(indexLabel, heading);
      item.append(header, body);
      facts.append(item);
    }

    const sources = $("#body-explorer-sources");
    sources.replaceChildren();
    for (const source of info.sources) {
      const link = document.createElement("a");
      link.href = `https://ntrs.nasa.gov/citations/${encodeURIComponent(source.id)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = source.title;
      link.className = "body-explorer-source";
      const icon = document.createElement("span");
      icon.textContent = "↗";
      icon.setAttribute("aria-hidden", "true");
      link.append(icon);
      sources.append(link);
    }
  }

  function setHighlight(part) {
    for (const mesh of state.highlighted) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material, index) => {
        const base = mesh.userData.baseEmissive[index];
        if (!base || !material.emissive || !base.color) return;
        material.emissive.copy(base.color);
        material.emissiveIntensity = base.intensity;
      });
    }
    state.highlighted = [];
    for (const mesh of state.modelMeshes) {
      if (mesh.userData.anatomyPart !== part) continue;
      state.highlighted.push(mesh);
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        if (!material.emissive) continue;
        material.emissive.set(0x25cfff);
        material.emissiveIntensity = 0.78;
      }
    }
  }

  function focusPart(part) {
    const bounds = new THREE.Box3();
    for (const mesh of state.highlighted) {
      if (state.activeFiles.includes(mesh.userData.modelFile)) bounds.expandByObject(mesh);
    }
    if (bounds.isEmpty()) return;

    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const direction = state.camera.position.clone().sub(state.controls.target).normalize();
    const distance = Math.max(size.length() * 2.25, part === "bones" || part === "muscles" ? 3.4 : 0.9);
    state.targetGoal = center;
    state.cameraGoal = center.clone().add(direction.multiplyScalar(distance));
  }

  async function showMode(mode, selectedPart = state.selectedPart) {
    state.mode = mode;
    state.selectedPart = selectedPart;
    setModeButtons(mode);
    renderInformation(selectedPart);
    if (!state.renderer) return;

    const requestId = ++state.modeRequest;
    const files = modelFiles[mode];
    const modeLabel = mode === "external" ? "external anatomy" : "internal organs";
    setStatus(
      `Loading ${modeLabel}`,
      "High-detail anatomical structures are being decoded for this view.",
    );

    try {
      await Promise.all(files.map(loadModel));
    } catch (error) {
      if (requestId !== state.modeRequest) return;
      console.error("Could not load the 3D anatomy model.", error);
      setStatus(
        "3D anatomy could not be loaded",
        "Check your connection, then retry. Body-system information and NASA sources remain available below.",
        true,
      );
      return;
    }

    if (requestId !== state.modeRequest) return;
    state.activeFiles = files;
    for (const [file, model] of state.loadedModels) model.visible = files.includes(file);
    setShellOpacity(mode === "external" ? 0.1 : 0.055);
    $("#body-explorer-part-count").textContent =
      `${state.modelMeshes.length} STRUCTURES · ${mode.toUpperCase()} VIEW`;
    clearStatus();
    setHighlight(selectedPart);
    focusPart(selectedPart);
  }

  async function selectPart(part) {
    if (!partInfo[part]) return;
    state.selectedPart = part;
    renderInformation(part);
    const mode = partModes[part];

    if (!state.initialized) {
      if (!state.initializing) void initializeViewer();
      if (state.initializing) await state.initializing;
      if (!state.initialized) return;
    }

    if (state.mode !== mode || !state.loadedModels.has(modelFiles[mode][0])) {
      await showMode(mode, part);
      return;
    }

    state.mode = mode;
    state.activeFiles = modelFiles[mode];
    for (const [file, model] of state.loadedModels) model.visible = state.activeFiles.includes(file);
    setShellOpacity(mode === "external" ? 0.1 : 0.055);
    setModeButtons(mode);
    setHighlight(part);
    focusPart(part);
  }

  function handleModelPick(event) {
    if (!state.lastPointer || !state.renderer) return;
    const movement = Math.hypot(
      event.clientX - state.lastPointer.x,
      event.clientY - state.lastPointer.y,
    );
    state.lastPointer = null;
    if (movement > 5) return;

    const rect = canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, state.camera);
    const visibleModels = [...state.loadedModels.values()].filter((model) => model.visible);
    const hit = raycaster.intersectObjects(visibleModels, true).find((item) => item.object.isMesh);
    if (!hit) return;

    const part = hit.object.userData.anatomyPart;
    if (part) void selectPart(part);
  }

  function zoomBy(amount) {
    if (!state.controls) return;
    const direction = state.camera.position.clone().sub(state.controls.target).normalize();
    const currentDistance = state.camera.position.distanceTo(state.controls.target);
    const nextDistance = THREE.MathUtils.clamp(currentDistance + amount, 0.8, 7);
    state.camera.position.copy(state.controls.target).add(direction.multiplyScalar(nextDistance));
    state.cameraGoal = null;
    state.targetGoal = null;
    state.controls.update();
  }

  function resetView() {
    if (!state.controls) return;
    state.camera.position.set(0.15, 1.13, 4.1);
    state.controls.target.set(0, 0.88, 0);
    state.cameraGoal = null;
    state.targetGoal = null;
    state.controls.update();
  }

  async function initializeViewer() {
    if (state.initialized) return;
    if (state.initializing) return state.initializing;

    state.initializing = (async () => {
      setStatus("Starting 3D anatomy viewer", "Preparing the interactive model and rendering tools.");
      try {
        createRenderer();
        state.initialized = true;
        await showMode(state.mode, state.selectedPart);
      } catch (error) {
        console.error("The 3D anatomy viewer could not start.", error);
        setStatus(
          "3D rendering is unavailable",
          "Your browser or graphics device could not start the 3D view. Body-system information and NASA sources remain available below.",
          true,
        );
      } finally {
        state.initializing = null;
      }
    })();

    return state.initializing;
  }

  function setupInteractions() {
    $$("[data-anatomy-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.anatomyMode;
        const defaultPart = mode === "external" ? "bones" : "heart";
        state.selectedPart = defaultPart;
        renderInformation(defaultPart);
        void showMode(mode, defaultPart);
      });
    });

    $$("[data-anatomy-part]").forEach((button) => {
      button.addEventListener("click", () => void selectPart(button.dataset.anatomyPart));
    });

    $$("[data-anatomy-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.anatomyAction;
        if (action === "retry") {
          if (!state.initialized) {
            state.initializing = null;
            void initializeViewer();
          } else {
            void showMode(state.mode, state.selectedPart);
          }
        } else if (action === "rotate" && state.controls) {
          state.controls.autoRotate = !state.controls.autoRotate;
          button.setAttribute("aria-pressed", String(state.controls.autoRotate));
        } else if (action === "zoom-in") {
          zoomBy(-0.45);
        } else if (action === "zoom-out") {
          zoomBy(0.45);
        } else if (action === "reset") {
          resetView();
        }
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (state.animationFrame) window.cancelAnimationFrame(state.animationFrame);
        state.animationFrame = 0;
      } else {
        startRenderLoop();
      }
    });

    reducedMotion.addEventListener?.("change", (event) => {
      state.motionAllowed = !event.matches;
      if (state.controls) {
        state.controls.autoRotate = event.matches ? false : state.controls.autoRotate;
        $('[data-anatomy-action="rotate"]').setAttribute(
          "aria-pressed",
          String(state.controls.autoRotate),
        );
      }
    });

    if ("IntersectionObserver" in window) {
      state.observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          state.visible = entry.isIntersecting;
          if (entry.isIntersecting) {
            void initializeViewer();
            startRenderLoop();
          } else if (state.animationFrame) {
            window.cancelAnimationFrame(state.animationFrame);
            state.animationFrame = 0;
          }
        },
        { rootMargin: "160px 0px" },
      );
      state.observer.observe($("#body-explorer"));
    } else {
      state.visible = true;
      void initializeViewer();
    }
  }

  renderInformation(state.selectedPart);
  setupInteractions();
})();
