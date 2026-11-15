(() => {
  "use strict";

  const PREFERENCES_KEY = "cosmihealth-demo-preferences";
  const DEFAULT_API_BASE = "https://api.openai.com/v1";
  const MAX_CONTEXT_MESSAGES = 16;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    apiBase: DEFAULT_API_BASE,
    model: "gpt-4o-mini",
    apiKey: "",
    aiConsent: false,
    mode: "simulation",
    mood: "",
    checkIns: [],
    chat: [],
    busy: false,
    phaseTimer: 0,
    exerciseTimer: 0,
    exerciseActive: false,
    selectedScenario: "isolation",
    preferences: { motion: !reducedMotion.matches },
  };

  const scenarios = {
    isolation: {
      tag: "ISOLATION & CONNECTION",
      title: "A long, quiet orbit",
      description:
        "“The days have blurred together. I miss just being around people without having to schedule it.”",
      response:
        "That kind of quiet distance can weigh on you. What do you find yourself missing most today—an easy conversation, shared routines, or something else?",
      prompt:
        "I've been feeling isolated lately. I miss casual time with people. Can we talk about finding a small way to feel more connected?",
    },
    emergency: {
      tag: "STRESS & GROUNDING",
      title: "Pressure under a deadline",
      description:
        "“The technical team is working a simulated fault, and I notice my thoughts racing. I can't switch off.”",
      response:
        "That's a lot to hold while the team works through a demanding moment. If it feels useful, we can take one slow breath together, then notice one thing that's steady right now. What feels most helpful—pausing, naming what's in your control, or talking it through?",
      prompt:
        "I'm feeling pressure during a demanding simulated technical situation. My thoughts are racing. Can you help me slow down and focus on one thing I can control?",
    },
    conflict: {
      tag: "CREW COMMUNICATION",
      title: "A difficult conversation",
      description:
        "“A disagreement keeps coming back. I want to clear the air without making it worse.”",
      response:
        "It makes sense to want both honesty and care in a small team. Would it help to plan a calm opening that starts with what you noticed and how it affected you, then leaves room to hear their perspective?",
      prompt:
        "There's tension with another crewmember. I want to address it calmly without making it worse. Can you help me think of an opening?",
    },
    sleep: {
      tag: "REST & ROUTINES",
      title: "Rest feels out of reach",
      description:
        "“I’m tired, but I keep replaying the day. The usual cues for bedtime feel different up here.”",
      response:
        "It can take time to settle into an unfamiliar sleep environment. A consistent wind-down cue or a short grounding exercise may be worth trying if it fits your routine. What usually helps you shift out of work mode?",
      prompt:
        "I've been having trouble winding down before sleep in this unfamiliar environment. Can you suggest a gentle routine to discuss with my team?",
    },
    fatigue: {
      tag: "EMOTIONAL RECOVERY",
      title: "Running on empty",
      description: "“Nothing is exactly wrong. I'm just worn down by being 'on' every day.”",
      response:
        "You don't need a dramatic reason for tiredness to deserve attention. It may help to name one thing that could be made lighter today and to let a trusted crewmember know how you're doing. What's taking the most energy right now?",
      prompt:
        "I feel emotionally worn down from being 'on' every day. Nothing is exactly wrong, but I'm running on empty. What might a small, realistic reset look like?",
    },
  };

  const trainingTopics = {
    spaceflight: {
      title: "Spaceflight psychology",
      text: "Spaceflight psychology considers how people experience work, relationships, and well-being in a demanding mission environment. This educational prototype offers reflection—not a test, a clinical finding, or flight guidance.",
      prompt:
        "I'd like to talk about what makes the emotional side of a long-duration space mission challenging.",
    },
    isolation: {
      title: "Isolation & confinement",
      text: "Distance from familiar people, limited private space, and highly structured routines may shape how an individual experiences isolation. People respond differently; there is no one-size-fits-all coping prescription.",
      prompt:
        "I am feeling a little isolated. Could we talk about what might help me feel more connected?",
    },
    stress: {
      title: "Stress & recovery",
      text: "Periods of pressure and recovery can coexist in a demanding environment. Optional grounding, rest, and trusted human connection can be worth exploring, without treating this prototype as an assessment.",
      prompt:
        "I have been feeling pressure and would like a calm moment to work out what is within my control.",
    },
    sleep: {
      title: "Sleep & routines",
      text: "Light, timing, work schedules, and unfamiliar surroundings can affect rest. A familiar wind-down cue may be worth discussing with the crew and medical team; this assistant cannot assess or treat sleep problems.",
      prompt:
        "I would like to explore a gentle wind-down routine for a different sleep environment.",
    },
    team: {
      title: "Team communication",
      text: "In a small team, respectful communication can help people express needs and hear one another. If it feels safe, speak from a specific observation, name your experience, and invite the other person's perspective.",
      prompt:
        "I am navigating tension with a crewmate and would like to think through a calm way to talk about it.",
    },
    resilience: {
      title: "Emotional resilience",
      text: "Resilience is not the absence of difficult emotions or a requirement to stay positive. People can draw on their own routines, supportive relationships, and qualified professional help in different ways.",
      prompt:
        "I have had a hard day and want to talk through one small thing that could help me reset.",
    },
    support: {
      title: "Human support & escalation",
      text: "An app cannot determine whether someone is safe, provide crisis response, or contact the crew. When in immediate danger or distress, connect with a trusted person and established mission emergency procedures to reach qualified human support.",
      prompt: "",
    },
  };

  const nasaSources = [
    {
      id: "hfbp",
      title: "Human Factors and Behavioral Performance",
      url: "https://www.nasa.gov/reference/about-human-factors-and-behavioral-performance/",
      summary:
        "NASA describes research on behavioral health, sleep, cognitive function, team cohesion, and performance during long-duration spaceflight.",
      matches:
        /spaceflight|astronaut|mission|mental|psycholog|behavior|health|sleep|team|crew|عقلي|نفسي|نفسية|فضاء|مهمة|رواد|نوم|فريق|طاقم/iu,
    },
    {
      id: "hazards",
      title: "Five Hazards of Human Spaceflight",
      url: "https://www.nasa.gov/hrp/hazards/",
      summary:
        "NASA identifies isolation and confinement and distance from Earth among spaceflight hazards, and notes that hazards can interact.",
      matches:
        /isolation|isolated|confined|confinement|lonely|loneliness|distance|far from|homesick|عزلة|معزول|وحدة|وحيد|بعيد|اشتياق/u,
    },
    {
      id: "behavioral-risk",
      title: "Risk of Behavioral Changes and Psychiatric Disorders",
      url: "https://www.nasa.gov/reference/risk-of-behavioral-changes-and-psychiatric-disorders/",
      summary:
        "NASA describes ongoing research into how prolonged isolation and other spaceflight stressors may affect crew psychological health.",
      matches:
        /stress|anxious|anxiety|overwhelm|mood|fatigue|burn.?out|distress|ضغوط|توتر|قلق|إرهاق|مرهق|تعبان|حزين|مزاج/u,
    },
    {
      id: "sleep-risk",
      title: "Risk from Inadequate Sleep and Irregular Schedules",
      url: "https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/",
      summary:
        "NASA discusses research on sleep disruption, irregular light-dark cycles, work demands, and circadian timing in spaceflight.",
      matches:
        /sleep|insomnia|bedtime|wind.?down|rest|tired|exhausted|نوم|أنام|انام|نومي|أرق|راحة|ارتاح|مرهق|مرهقة|تعبان|تعبانة/u,
    },
    {
      id: "teamwork-risk",
      title: "Risk of Inadequate Teamwork",
      url: "https://www.nasa.gov/reference/risk-of-inadequate-teamwork/",
      summary:
        "NASA studies communication, coordination, team tensions, and how crews work together during prolonged isolation.",
      matches:
        /team|crew|colleague|crewmate|conflict|disagree|argument|communication|فريق|طاقم|زميل|خلاف|نزاع|تواصل/u,
    },
  ];

  // Shared helpers and browser preferences.
  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  function toast(message, warning = false) {
    const item = document.createElement("div");
    item.className = `toast${warning ? " warning" : ""}`;
    item.textContent = message;
    $("#toast-region").append(item);
    window.setTimeout(() => item.remove(), 4800);
  }

  function getNasaSources(text) {
    const matches = nasaSources.filter((source) => source.matches.test(text));
    if (matches.length) return matches.slice(0, 3);
    return nasaSources.filter((source) => source.id === "hfbp" || source.id === "hazards");
  }

  function appendNasaSources(container, sources, className = "nasa-source-list") {
    if (!sources.length) return;
    const list = document.createElement("div");
    list.className = className;

    sources.forEach((source) => {
      const link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = source.title;
      link.title = source.summary;
      list.append(link);
    });

    container.append(list);
  }

  function renderNasaLibrary() {
    const library = $("#nasa-library-sources");
    appendNasaSources(library, nasaSources);
  }

  function loadPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        state.preferences.motion =
          saved.motion === undefined ? !reducedMotion.matches : saved.motion === true;
      }
    } catch (error) {
      toast(`Local preferences could not be loaded: ${error.message}`, true);
    }
    if (reducedMotion.matches) state.preferences.motion = false;
    document.documentElement.dataset.motion = state.preferences.motion ? "on" : "off";
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state.preferences));
    } catch (error) {
      toast(`Local preferences could not be saved: ${error.message}`, true);
    }
  }

  // Space effects and page navigation.
  function drawStarfield() {
    const canvas = $("#starfield");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    let animationFrame = 0;
    let stars = [];
    const unit = (seed) => {
      const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return value - Math.floor(value);
    };
    const paintFrame = () => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star, index) => {
        const shimmer = state.preferences.motion ? Math.sin(frame * 0.016 + index) * 0.12 : 0;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(191,219,255,${Math.max(0.09, star.alpha + shimmer)})`;
        ctx.fill();
        if (state.preferences.motion) star.y = star.y > height ? 0 : star.y + star.drift;
      });
    };
    const paint = () => {
      paintFrame();
      frame += 1;
      animationFrame = requestAnimationFrame(paint);
    };
    const start = () => {
      if (state.preferences.motion) {
        if (running) return;
        running = true;
        paint();
      } else {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        running = false;
        paintFrame();
      }
    };
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = Array.from({ length: Math.min(115, Math.round(width / 11)) }, (_, index) => ({
        x: unit(index + 3) * width,
        y: unit(index + 333) * height,
        r: unit(index + 82) * 0.9 + 0.2,
        alpha: unit(index + 991) * 0.46 + 0.12,
        drift: unit(index + 17) * 0.1 + 0.015,
      }));
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      running = false;
      start();
    };
    window.addEventListener("resize", resize, { passive: true });
    const motionObserver = new MutationObserver(start);
    motionObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    resize();
  }

  function observeReveals() {
    const items = $$(".glass-panel, .metric-card, .scenario-card, .principles-grid article");
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (state.preferences.motion)
            entry.target.animate(
              [
                { opacity: 0, transform: "translateY(9px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" },
            );
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    items.forEach((item) => observer.observe(item));
  }

  function setupNavigation() {
    const header = $(".topbar");
    const nav = $(".top-nav");
    const toggle = $(".menu-toggle");
    window.addEventListener(
      "scroll",
      () => header.classList.toggle("scrolled", window.scrollY > 50),
      { passive: true },
    );
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      nav.classList.toggle("open", open);
    });
    $$("a", nav).forEach((link) =>
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
      }),
    );
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
      }
    });
    const dialog = $("#app-dialog");
    $(".dialog-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  // Dialogs, check-ins, and self-reflection.
  function openDialog(label, title, content) {
    $("#dialog-kicker").textContent = label;
    $("#dialog-content").innerHTML = `<h2 id="dialog-title">${escapeHtml(title)}</h2>${content}`;
    const dialog = $("#app-dialog");
    if (dialog.open) dialog.close();
    dialog.showModal();
  }

  function loadCheckInHistory() {
    const trend = $("#trend-empty");
    if (!state.checkIns.length) {
      trend.textContent =
        "Your private check-ins will appear here. No trend inferred without your input.";
      trend.hidden = hasStress;
      $(".wellness-graphic").classList.remove("has-checkins");
      $(".wellness-graphic").classList.remove("has-stress");
      $("#mood-history").replaceChildren();
      $(".checkin-trend-svg").replaceChildren();
      $("#stress-reading").textContent = "—";
      $("#stress-status").textContent = "SELF-REPORT · NOT SCORED";
      $("#sleep-reading").textContent = "—";
      return;
    }
    $(".wellness-graphic").classList.add("has-checkins");
    const latest = state.checkIns[state.checkIns.length - 1];
    $("#stress-reading").textContent = latest.stress == null ? "—" : latest.stress;
    $("#stress-status").textContent =
      latest.stress == null ? "NO STRESS SCORE SAVED" : "YOUR SELF-REPORT · NOT A RISK SCORE";
    $("#sleep-reading").textContent = latest.sleep == null ? "—" : latest.sleep.toFixed(1);
    const values = state.checkIns
      .map((entry) => entry.stress)
      .filter(Number.isFinite)
      .slice(-8);
    const hasStress = values.length > 0;
    $(".wellness-graphic").classList.toggle("has-stress", hasStress);
    trend.hidden = false;
    trend.textContent = hasStress
      ? "Only your own self-reported reflection is shown. No interpretation or assessment is generated."
      : "Your private check-in is noted. Add an optional reflection to see your own session-only history.";
    drawTrendLine(values);
    const history = $("#mood-history");
    history.replaceChildren();
    state.checkIns.slice(-5).forEach((entry, index) => {
      const label = [
        entry.mood ? entry.mood.toUpperCase() : "",
        Number.isFinite(entry.stress) ? `STRESS ${entry.stress}/10` : "",
        Number.isFinite(entry.connection) ? `CONNECTION ${entry.connection}/10` : "",
        Number.isFinite(entry.rest) ? `REST ${entry.rest}/10` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      if (!label) return;
      const chip = document.createElement("span");
      chip.className = `${entry.mood ? "has-mood " : ""}${Number.isFinite(entry.stress) ? "has-stress" : ""}`;
      chip.textContent = `${state.checkIns.length - Math.min(5, state.checkIns.length) + index + 1}. ${label}`;
      chip.title = "Optional self-reported reflection · this session only";
      history.append(chip);
    });
  }

  function drawTrendLine(values) {
    let svg = $(".checkin-trend-svg");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("checkin-trend-svg");
      svg.setAttribute("viewBox", "0 0 100 48");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("aria-label", "User-reported stress check-in trend in this session only");
      $(".wellness-graphic").append(svg);
    }
    svg.replaceChildren();
    const points = values
      .map((value, index) => {
        const x = 3 + (index / Math.max(values.length - 1, 1)) * 94;
        const y = 4 + ((10 - value) / 10) * 39;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    if (values.length > 1) {
      polyline.setAttribute("points", points);
      polyline.setAttribute("class", "checkin-polyline");
      svg.append(polyline);
    }
    values.forEach((value, index) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(3 + (index / Math.max(values.length - 1, 1)) * 94));
      circle.setAttribute("cy", String(4 + ((10 - value) / 10) * 39));
      circle.setAttribute("r", "1.25");
      circle.setAttribute("class", "checkin-point");
      svg.append(circle);
    });
  }

  function saveCheckIn() {
    const selected = $('[data-mood][aria-pressed="true"]');
    const note = $("#checkin-note").value.trim();
    if (!selected && !note) {
      toast("Choose a mood or add an optional note to save a private session check-in.");
      return;
    }
    state.mood = selected?.dataset.mood || "";
    state.checkIns.push({ mood: state.mood, note, stress: null, sleep: null, at: Date.now() });
    state.checkIns = state.checkIns.slice(-30);
    $("#checkin-note").value = "";
    loadCheckInHistory();
    toast("Saved in this browser session only. Refreshing will clear your check-in.");
  }

  function openSelfCheck() {
    openDialog(
      "OPTIONAL SELF-REFLECTION · SESSION ONLY",
      "A brief check-in",
      `
      <p>This is an unvalidated reflection prompt, not a screening tool. There are no scores, diagnoses, or right answers. Your response stays in this browser session and is not sent to ASTRA.</p>
      <form class="dialog-form" id="self-check-form">
        <label class="question-label" for="stress-range">On a scale of 0–10, how heavy does this moment feel to you? Choose “skip” if a number doesn't fit.</label>
        <div class="range-row"><input id="stress-range" type="range" min="0" max="10" value="4"><output class="range-value" id="stress-range-output">4</output></div>
        <label class="question-label" for="connection-range">Would you like to note how connected you feel right now? Optional · 0–10, or skip.</label>
        <div class="range-row"><input id="connection-range" type="range" min="0" max="10" value="5"><output class="range-value" id="connection-range-output">—</output></div>
        <label class="question-label" for="rest-range">Would you like to note how restored you feel? Optional · 0–10, or skip.</label>
        <div class="range-row"><input id="rest-range" type="range" min="0" max="10" value="5"><output class="range-value" id="rest-range-output">—</output></div>
        <label class="question-label" for="sleep-hours">How much sleep feels relevant to note? Optional · hours</label>
        <input id="sleep-hours" type="number" min="0" max="24" step="0.5" placeholder="Skip if you prefer">
        <label class="check-row"><input type="checkbox" id="skip-score"> I'd rather not choose a number.</label>
        <div class="dialog-actions"><button class="button button-main" type="submit">SAVE THIS SESSION ONLY <span>↗</span></button><button class="button button-ghost" type="button" id="cancel-self-check">CANCEL</button></div>
      </form><div id="self-check-result"></div>
    `,
    );
    const range = $("#stress-range");
    const output = $("#stress-range-output");
    const connection = $("#connection-range");
    const connectionOutput = $("#connection-range-output");
    const rest = $("#rest-range");
    const restOutput = $("#rest-range-output");
    [range, connection, rest].forEach((input) =>
      input.addEventListener("input", () => {
        const skip = $("#skip-score").checked;
        output.value = skip ? "—" : range.value;
        connectionOutput.value = skip || !connection.dataset.changed ? "—" : connection.value;
        restOutput.value = skip || !rest.dataset.changed ? "—" : rest.value;
      }),
    );
    connection.addEventListener("input", () => {
      connection.dataset.changed = "true";
      connectionOutput.value = $("#skip-score").checked ? "—" : connection.value;
    });
    rest.addEventListener("input", () => {
      rest.dataset.changed = "true";
      restOutput.value = $("#skip-score").checked ? "—" : rest.value;
    });
    $("#skip-score").addEventListener("change", (event) => {
      range.disabled = event.target.checked;
      connection.disabled = event.target.checked;
      rest.disabled = event.target.checked;
      output.value = event.target.checked ? "—" : range.value;
      connectionOutput.value =
        event.target.checked || !connection.dataset.changed ? "—" : connection.value;
      restOutput.value = event.target.checked || !rest.dataset.changed ? "—" : rest.value;
    });
    $("#cancel-self-check").addEventListener("click", () => $("#app-dialog").close());
    $("#self-check-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const sleepRaw = $("#sleep-hours").value;
      const sleep = sleepRaw === "" ? null : Number(sleepRaw);
      if (sleep != null && (!Number.isFinite(sleep) || sleep < 0 || sleep > 24)) {
        toast("Enter a sleep reflection between 0 and 24 hours, or leave it blank.", true);
        return;
      }
      const stress = $("#skip-score").checked ? null : Number(range.value);
      const connectionValue =
        !$("#skip-score").checked && connection.dataset.changed ? Number(connection.value) : null;
      const restValue =
        !$("#skip-score").checked && rest.dataset.changed ? Number(rest.value) : null;
      const current = state.checkIns[state.checkIns.length - 1] || { mood: state.mood, note: "" };
      state.checkIns.push({
        ...current,
        stress,
        connection: connectionValue,
        rest: restValue,
        sleep,
        at: Date.now(),
      });
      state.checkIns = state.checkIns.slice(-30);
      loadCheckInHistory();
      $("#self-check-result").innerHTML =
        '<div class="check-in-result">Check-in noted for this session. A number is not a diagnosis or a measure of mission readiness. Consider what support would feel helpful to you right now.</div>';
      toast("Reflection kept in this browser session only.");
    });
  }

  // Support guidance and educational topics.
  function showSupportDialog() {
    openDialog(
      "HUMAN SUPPORT · REAL PEOPLE FIRST",
      "Connect with human support",
      `
      <p>This prototype is not a clinical or emergency service. It cannot reach a crewmember, clinician, mission control, or emergency responder.</p>
      <div class="dialog-note"><strong>If you feel unsafe or in immediate danger:</strong> Tell a trusted crewmember now and use the established mission emergency procedures to contact qualified human support. Don't wait for an app or AI reply.</div>
      <ul class="support-list"><li>When concerns are not immediate, consider contacting a trusted person, crew-support resource, or qualified behavioral-health professional through your mission's approved confidential pathway.</li><li>If you are supporting a crewmate, listen without judgment, ask what would feel useful, and help them connect with the human resource they choose.</li></ul>
      <button class="button button-ghost" type="button" id="return-to-chat">RETURN TO ASTRA <span>↗</span></button>
    `,
    );
    $("#return-to-chat").addEventListener("click", () => {
      $("#app-dialog").close();
      $("#chat-input").focus();
    });
  }

  function showTrainingTopic(key) {
    const topic = trainingTopics[key];
    if (!topic) return;
    const action = topic.prompt
      ? `<button class="button button-main" type="button" id="start-topic-chat">TALK IT THROUGH WITH ASTRA <span>↗</span></button>`
      : `<button class="button button-ghost" type="button" id="open-support-pathway">VIEW HUMAN SUPPORT GUIDANCE <span>↗</span></button>`;
    openDialog(
      "TRAINING CENTER · EDUCATIONAL LENS",
      topic.title,
      `
      <p>${escapeHtml(topic.text)}</p>
      <div class="dialog-note"><strong>Research context only:</strong> General educational topic; not a NASA curriculum, clinical recommendation, or replacement for approved mission procedures or qualified care.</div>
      ${action}
    `,
    );
    if (topic.prompt) {
      $("#start-topic-chat").addEventListener("click", () => {
        $("#app-dialog").close();
        $("#chat-input").value = topic.prompt;
        $("#chat-form").requestSubmit();
        $("#agents").scrollIntoView({ behavior: state.preferences.motion ? "smooth" : "auto" });
      });
    } else {
      $("#open-support-pathway").addEventListener("click", () => showSupportDialog());
    }
  }

  // Guided breathing and grounding exercises.
  function attachExercises() {
    $$("[data-exercise]").forEach((button) =>
      button.addEventListener("click", () => startExercise(button.dataset.exercise)),
    );
    $("#breath-start").addEventListener("click", () => startBreathing());
    $("#breath-stop").addEventListener("click", stopBreathing);
    $("#open-selfcheck").addEventListener("click", openSelfCheck);
    $("#save-checkin").addEventListener("click", saveCheckIn);
    $$("[data-mood]").forEach((button) =>
      button.addEventListener("click", () => {
        $$("[data-mood]").forEach((item) =>
          item.setAttribute(
            "aria-pressed",
            String(item === button && item.getAttribute("aria-pressed") !== "true"),
          ),
        );
      }),
    );
    $("#clear-checkins").addEventListener("click", () => {
      state.checkIns = [];
      state.mood = "";
      $$("[data-mood]").forEach((button) => button.setAttribute("aria-pressed", "false"));
      $("#checkin-note").value = "";
      loadCheckInHistory();
      toast("Session check-ins cleared.");
    });
  }

  const breathingPhases = [
    {
      name: "BREATHE IN",
      instruction: "Gently breathe in.",
      detail: "Let the breath stay comfortable.",
      duration: 4000,
      scale: true,
    },
    {
      name: "BREATHE OUT",
      instruction: "Slowly breathe out.",
      detail: "Let go of any need to match a perfect pace.",
      duration: 6000,
      scale: false,
    },
  ];

  function startBreathing() {
    state.exerciseActive = true;
    $("#breath-start").classList.add("hidden");
    $("#breath-stop").classList.remove("hidden");
    $("#breathing-stage").classList.add("breath-active");
    const started = Date.now();
    function phaseStep() {
      if (!state.exerciseActive) return;
      const elapsed = Date.now() - started;
      if (elapsed >= 60000) {
        stopBreathing(true);
        return;
      }
      const phase = breathingPhases[Math.floor(elapsed / 10000) % breathingPhases.length];
      $("#breath-phase").textContent = phase.name;
      $("#breath-instruction").textContent = phase.instruction;
      $("#breath-detail").textContent = phase.detail;
      $("#breathing-stage").classList.toggle("breath-inhale", phase.scale);
      state.phaseTimer = window.setTimeout(
        phaseStep,
        phase.duration - ((elapsed % 10000) % phase.duration),
      );
    }
    phaseStep();
    toast("One-minute breathing practice started. Stop or skip at any time.");
  }

  function stopBreathing(completed = false) {
    state.exerciseActive = false;
    window.clearTimeout(state.phaseTimer);
    $("#breath-start").classList.remove("hidden");
    $("#breath-stop").classList.add("hidden");
    $("#breathing-stage").classList.remove("breath-active", "breath-inhale");
    $("#breath-phase").textContent = completed ? "PAUSE COMPLETE" : "A PAUSE FOR YOU";
    $("#breath-instruction").textContent = completed
      ? "You made a little space."
      : "Settle in at your own pace.";
    $("#breath-detail").textContent = "Take what was useful. Leave the rest.";
    if (completed) toast("Practice complete. Check in with how you feel.");
  }

  const groundingSteps = [
    [
      "LOOK AROUND",
      "Name five things you can see.",
      "Take your time. Notice shapes, colors, or light.",
    ],
    [
      "NOTICE TOUCH",
      "Name four things you can feel.",
      "Notice the seat, your clothing, or your feet.",
    ],
    ["LISTEN", "Name three things you can hear.", "Nearby sounds or the quiet itself both count."],
    [
      "NOTICE SCENT",
      "Name two scents you can notice.",
      "If none are clear, simply notice the air.",
    ],
    [
      "NOTICE TASTE",
      "Name one thing you can taste.",
      "Or simply notice the feeling in your mouth.",
    ],
  ];

  function startExercise(type) {
    if (type === "breathing") {
      $("#hologram").scrollIntoView({ behavior: state.preferences.motion ? "smooth" : "auto" });
      window.setTimeout(startBreathing, state.preferences.motion ? 350 : 0);
      return;
    }
    if (type === "grounding") {
      showGrounding(0);
      return;
    }
    openDialog(
      "OPTIONAL SELF-GUIDED PRACTICE",
      "A moment of observation",
      `
      <div class="breathing-modal"><div class="modal-orb" aria-hidden="true">✳</div><p>For a few moments, notice the space around you.</p><p>Choose an object, sound, or point of light. Notice it without needing to change or explain it.</p><p>Let your attention return gently if it wanders. There is nothing to achieve.</p><button class="button button-main" id="finish-mindful">FINISH WHEN YOU'RE READY <span>↗</span></button></div>
    `,
    );
    $("#finish-mindful").addEventListener("click", () => {
      $("#app-dialog").close();
      toast("Thanks for taking a moment for yourself.");
    });
  }

  function showGrounding(index) {
    const step = groundingSteps[index];
    if (!step) {
      $("#app-dialog").close();
      toast("Grounding practice complete. Take whatever felt useful.");
      return;
    }
    openDialog(
      `FIVE-SENSES GROUNDING · STEP ${index + 1} OF 5`,
      step[0],
      `
      <p class="grounding-prompt">${step[1]}</p><p>${step[2]}</p><div class="dialog-actions"><button class="button button-main" type="button" id="grounding-next">${index === 4 ? "FINISH PRACTICE" : "WHEN YOU'RE READY"} <span>↗</span></button><button class="button button-ghost" type="button" id="grounding-stop">STOP</button></div>
    `,
    );
    $("#grounding-next").addEventListener("click", () => showGrounding(index + 1));
    $("#grounding-stop").addEventListener("click", () => $("#app-dialog").close());
  }

  // Mission training scenarios.
  function chooseScenario(key) {
    const scenario = scenarios[key];
    if (!scenario) return;
    state.selectedScenario = key;
    $$("[data-scenario]").forEach((button) => {
      const selected = button.dataset.scenario === key;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $("#scenario-tag").textContent = scenario.tag;
    $("#scenario-title").textContent = scenario.title;
    $("#scenario-description").textContent = scenario.description;
    $("#scenario-response").textContent = scenario.response;
    $("#scenario-number").textContent = String(Object.keys(scenarios).indexOf(key) + 1).padStart(
      2,
      "0",
    );
    $("#try-scenario").dataset.prompt = scenario.prompt;
  }

  function setupScenarios() {
    $$("[data-topic]").forEach((button) =>
      button.addEventListener("click", () => showTrainingTopic(button.dataset.topic)),
    );
    $$("[data-scenario]").forEach((button) => {
      button.addEventListener("click", () => chooseScenario(button.dataset.scenario));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
        event.preventDefault();
        const items = $$("[data-scenario]");
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const next = (items.indexOf(button) + direction + items.length) % items.length;
        items[next].focus();
        items[next].click();
      });
    });
    $("#try-scenario").addEventListener("click", () => {
      const prompt = $("#try-scenario").dataset.prompt;
      $("#chat-input").value = prompt;
      $("#chat-form").requestSubmit();
      $("#agents").scrollIntoView({ behavior: state.preferences.motion ? "smooth" : "auto" });
    });
  }

  // Optional AI provider setup.
  function loadAiPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
      if (typeof saved.apiBase === "string" && saved.apiBase) state.apiBase = saved.apiBase;
      if (typeof saved.model === "string" && saved.model) state.model = saved.model;
    } catch (error) {
      toast(`AI provider preferences could not be loaded: ${error.message}`, true);
    }
  }

  function updateAiMode() {
    const connected = state.mode === "live" && Boolean(state.apiKey) && state.aiConsent;
    $("#api-status-text").textContent = connected ? "LIVE AI READY" : "SIM MODE";
    $("#api-settings").classList.toggle("connected", connected);
    $("#chat-mode-label").textContent = connected
      ? `LIVE AI · ${state.model.toUpperCase()} · PROVIDER CONFIGURED BY YOU`
      : "SIMULATION MODE · CLEARLY LABELED EXAMPLE RESPONSES";
    $("#provider-disclosure").textContent = connected
      ? "Messages you send go to your selected AI provider"
      : "Simulation only · messages not saved";
    $("#pilot-status").textContent = connected ? "PROVIDER CONFIGURED" : "SIMULATION ACTIVE";
    $("#chat-safety-banner").innerHTML = connected
      ? "<span>!</span> Live AI sends your message, recent chat context, and relevant NASA source summaries to your selected provider. Avoid identifying or confidential mission information."
      : "<span>◈</span> Simulation mode uses local demonstration responses. Don’t enter identifying, sensitive, or confidential mission information.";
  }

  function safeApiBase(value) {
    const url = new URL(value);
    if (
      url.protocol !== "https:" &&
      !(url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1")
    ) {
      throw new Error(
        "AI endpoints must use HTTPS. HTTP is allowed only for localhost development.",
      );
    }
    if (url.username || url.password)
      throw new Error("Do not put credentials in the endpoint URL.");
    if (url.search || url.hash)
      throw new Error("Remove query strings and fragments from the endpoint URL.");
    return url.toString().replace(/\/+$/, "");
  }

  function showAiSettings(errorMessage = "") {
    openDialog(
      "LIVE AI · OPTIONAL THIRD-PARTY CONNECTION",
      "Configure your AI provider",
      `
      <p>By default, ASTRA runs an explicitly labeled local simulation—no AI API is called. To enable actual AI replies, provide an OpenAI-compatible HTTPS endpoint, a model name, and a short-lived API key. Live AI is not a dedicated psychological-support model and is not clinically validated.</p>
      <form class="dialog-form" id="api-form">
        <label>OpenAI-compatible API base URL<input id="api-base-input" type="url" autocomplete="url" spellcheck="false" value="${escapeHtml(state.apiBase)}" required></label>
        <label>Model name<input id="api-model-input" type="text" maxlength="100" value="${escapeHtml(state.model)}" required></label>
        <label>API key <span class="mono">USED IN MEMORY ONLY · NEVER SAVED</span><input id="api-key-input" type="password" autocomplete="new-password" placeholder="${state.apiKey ? "A key is currently held in memory" : "Enter only if you choose to use live AI"}"></label>
        <label class="check-row"><input id="ai-consent" type="checkbox" ${state.aiConsent ? "checked" : ""}> I understand that when I enable live AI and send a message, the text, recent conversation context, and relevant curated NASA source summaries leave this device and are sent to the provider at this endpoint. I reviewed its privacy and data-retention terms. I will not send sensitive or confidential mission information.</label>
        ${errorMessage ? `<div class="dialog-error">${escapeHtml(errorMessage)}</div>` : ""}
        <div class="dialog-actions"><button class="button button-main" type="submit">ENABLE LIVE AI <span>↗</span></button><button class="button button-ghost" type="button" id="use-simulation">USE LOCAL SIMULATION</button></div>
      </form>
      <div class="dialog-note"><strong>Security:</strong> A browser-based API key is exposed to this browser and its network requests. Prefer a secure, mission-approved backend/proxy with access controls instead of a personal provider key. This public prototype cannot provide enterprise security, confidentiality, data residency, or clinical safeguards. A provider may retain messages under its own terms.</div>
      <div class="dialog-note">This AI is for conversational demonstration only. It must not diagnose, assess immediate safety, provide therapy, or replace a human professional or mission emergency procedure. Provider errors are shown explicitly; they never silently become “AI” simulation answers.</div>
    `,
    );
    $("#api-form").addEventListener("submit", (event) => {
      event.preventDefault();
      configureProvider();
    });
    $("#use-simulation").addEventListener("click", () => {
      state.mode = "simulation";
      state.aiConsent = false;
      state.apiKey = "";
      updateAiMode();
      $("#app-dialog").close();
      toast("Local AI simulation selected. No messages will be sent to a provider.");
    });
  }

  function configureProvider() {
    const endpoint = $("#api-base-input").value.trim();
    const model = $("#api-model-input").value.trim();
    const enteredKey = $("#api-key-input").value.trim();
    const consent = $("#ai-consent").checked;
    if (!consent) {
      showAiSettings(
        "Confirm you understand what is sent to the provider before enabling live AI.",
      );
      return;
    }
    let base;
    try {
      base = safeApiBase(endpoint);
    } catch (error) {
      showAiSettings(error.message);
      return;
    }
    const key = enteredKey || state.apiKey;
    if (!key) {
      showAiSettings("An API key is required. Or select local simulation instead.");
      return;
    }
    if (!model) {
      showAiSettings("Enter the model identifier supported by your provider.");
      return;
    }
    state.apiBase = base;
    state.model = model;
    state.apiKey = key;
    state.aiConsent = true;
    state.mode = "live";
    try {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ ...state.preferences, apiBase: base, model }),
      );
    } catch (error) {
      toast(`AI mode enabled, but provider preferences could not be saved: ${error.message}`, true);
    }
    updateAiMode();
    $("#app-dialog").close();
    toast("Live AI enabled. Messages you send are transmitted to your configured provider.", true);
  }

  // Conversation handling and safety routing.
  function isUrgent(text) {
    const english =
      /\b(kill myself|killing myself|end my life|end it all|suicid(?:e|al|al thoughts)|self[- ]?harm|hurt myself|cut myself|going to hurt (?:myself|someone)|can't keep (?:myself|me) safe|cannot keep (?:myself|me) safe|can't stay safe|cannot stay safe|don't feel safe|do not feel safe|feel unsafe|feel not safe|don't want to live|do not want to live|want to die|going to die|immediate danger|someone is (?:hurting|threatening) me)\b/i;
    const arabic =
      /انتح|اقتل نفسي|أقتل نفسي|قتل نفسي|أؤذي نفسي|اذي نفسي|إيذاء نفسي|إيذاء الذات|ما ابي اعيش|ما ابغى اعيش|مش عايز أعيش|مش عايزة أعيش|عايز أموت|عايزة أموت|نفسي أموت|مش قادرة اكون بأمان|مش قادر اكون بأمان|مش آمنة|مش آمن|في خطر فوري/u;
    return english.test(text) || arabic.test(text);
  }

  function isDistressed(text) {
    return (
      /\b(panic|panicking|terrified|overwhelmed|can't cope|cannot cope|falling apart|alone|isolated|lonely|loneliness|hopeless|exhausted|burned out|burnt out|can't sleep|cannot sleep|anxious|anxiety|stressed|stress|sad|scared|afraid|crying|conflict|disagree(?:ment)?)\b/i.test(
        text,
      ) ||
      /قلق|متوترة|متوتر|مضغوطة|مضغوط|وحدة|وحيد|وحيدة|عزلة|منعزلة|منعزل|مرهق|مرهقة|تعبان|تعبانة|حزين|حزينة|خايف|خايفة|مش قادرة|مش قادر|ما اقدر|ما أقدر|ضغط نفسي|نومي متقطع/u.test(
        text,
      )
    );
  }

  function urgentResponse(text = "") {
    if (/[\u0600-\u06ff]/u.test(text)) {
      return "أنا آسفة إنك بتمري/بتمرّ باللحظة دي، وشكرًا إنك قلتي/قلت لي. أنا ما أقدرش أقيّم سلامتك أو أطلب مساعدة عنك. من فضلك تواصلي/تواصل الآن مع شخص موثوق من الطاقم، واتّبعي/اتّبع إجراءات الطوارئ المعتمدة للمهمة للوصول إلى مختص بشري. لو أمكن، ابقي/ابقَ مع شخص تثقين/تثق به أثناء التواصل. ما تستنيش ردّ التطبيق أو الذكاء الاصطناعي.";
    }
    return "I’m really glad you said something. I can’t assess immediate safety or summon help. Please contact a trusted crewmember and use your established mission emergency procedures now to reach qualified human support. If possible, stay with someone you trust while you connect. Don’t wait for an app or an AI reply.";
  }

  function localSimulationReply(text) {
    const lower = text.toLowerCase();
    if (isUrgent(text)) return urgentResponse(text);
    if (/[\u0600-\u06ff]/u.test(text)) {
      if (/نفس|تنفس|تأريض|تهدئ|هدوء|أهدأ|تمرين/u.test(text)) {
        return "لو كان مناسبًا لك، خدي/خد وقفة صغيرة. لاحظي/لاحظ أين يسندك المكان. خدي/خد شهيقًا مريحًا، ثم أطلقي/أطلق الزفير بهدوء من غير حبس أو إجبار. اختاري/اختر شيئًا واحدًا ترينه/تراه الآن. ما الذي قد يساعدك أكثر في هذه اللحظة؟ وتوقفي/توقف لو التركيز على التنفس لم يكن مريحًا.";
      }
      if (/نوم|أنام|نام|راحة|ارتاح|مرهق|مرهقة|تعبان|تعبانة/u.test(text)) {
        return "تغيير البيئة والروتين ممكن يخلي الاسترخاء أصعب. لو كان مناسبًا لإرشادات مهمتك، قد يساعدك طقس هادئ ومألوف قبل النوم. ما الشيء البسيط الذي يساعدك على الانتقال من العمل إلى الراحة؟ ولو استمرت صعوبة النوم، فكّري/فكّر في التحدث مع مختص بشري.";
      }
      if (/وحدة|وحيد|وحيدة|عزلة|منعزلة|منعزل|بعيد|اشتياق/u.test(text)) {
        return "الإحساس بالبعد عن الناس ممكن يكون ثقيلًا، خصوصًا لما تكون اللقاءات مجدولة طول الوقت. مش لازم تحلي/تحل كل ده مرة واحدة. إيه الأقرب لك النهارده: رسالة قصيرة لشخص تثقين/تثق به، روتين مشترك، ولا مكالمة من غير موضوع محدد؟";
      }
      if (/ضغط|متوتر|متوترة|قلق|قلقة|مضغوط|مضغوطة|قلقان|خايف|خايفة/u.test(text)) {
        return "واضح إن اللحظة فيها ضغط، وشكرًا إنك شاركتني. لو كان مفيدًا، اختاري/اختر شيئًا واحدًا صغيرًا يقع ضمن سيطرتك الآن، وخدي/خد زفيرًا مريحًا. تحبي/تحب أن أسمعك فقط، ولا نفكر معًا في الخطوة الصغيرة التالية؟";
      }
      return "أنا بسمعك من غير حكم. أنا نموذج تجريبي، مش مختصًا نفسيًا ولا جهة اتصال بالمهمة، وما أقدرش أشخّص. تحبي/تحب تحكي لي إيه أكثر شيء يشغل بالك دلوقتي؟ أو نتواصل مع شخص موثوق لو ده أنسب.";
    }
    if (/\b(breath|breathing|ground|grounding|reset)\b/.test(lower)) {
      return "We can try a gentle reset if that feels okay. Notice where your body is supported. Take a comfortable breath in, then let it leave slowly—no holding or forcing. Look around and name one color you can see. What do you notice in your body right now? Stop if focusing on breath feels uncomfortable.";
    }
    if (/\b(sleep|rest|wind down|bed|insomnia)\b/.test(lower)) {
      return "Rest can be difficult when routines and surroundings change. If it fits your mission guidance, you might try one familiar, low-light wind-down cue and a short transition away from work. What has helped you settle before, even a little? For persistent sleep trouble, consider raising it with qualified human support.";
    }
    if (/\b(isolat|alone|lonely|miss people|far from everyone|connection)\b/.test(lower)) {
      return "Feeling far from people can be hard in a small, scheduled environment. You don't need to solve all of that at once. Would a brief check-in with someone you trust, a shared routine, or an unstructured conversation feel most approachable today?";
    }
    if (/\b(conflict|argument|tension|disagree|crewmember|team)\b/.test(lower)) {
      return "Team tension can feel especially close when there's little room to step away. If it feels safe and appropriate, consider a calm opening: describe one specific moment, how it affected you, then invite their perspective. Would you like to think through a first sentence? Your approved team support pathway is also there if you need it.";
    }
    if (
      /\b(stress|stressed|pressured|pressure|deadline|technical|emergency|racing|overwhelm|anxiety|anxious|panic|panicking)\b/.test(
        lower,
      )
    ) {
      return "A demanding moment can make everything feel urgent at once. You are the best judge of what is helpful. If useful, pause and identify one small thing within your control, then take a comfortable breath out. What is the single part you'd like help thinking through right now?";
    }
    if (/\b(fatigue|worn down|empty|exhausted|burn(?:ed|t) out|tired)\b/.test(lower)) {
      return "Feeling worn down is worth acknowledging, even when nothing is 'wrong.' What is taking the most energy today? We can look for one small thing to lighten, and you might consider letting a trusted crewmember or human support resource know how you're doing.";
    }
    if (/\b(what can you do|help|who are you|how do you work)\b/.test(lower)) {
      return "I can listen, reflect what I hear, and offer optional general grounding or coping ideas. Right now I’m in explicitly labeled local simulation mode, not a real AI model. I’m not a counselor or mission link, I don’t make diagnoses, and I don’t keep a record. If you like, tell me what feels most important right now.";
    }
    if (isDistressed(text)) {
      return "That sounds like a difficult moment, and I'm glad you reached out. You deserve care without needing to explain it perfectly. Would it help more if I listened, helped find a small grounding step, or thought with you about someone you trust?";
    }
    return "It sounds like there may be a lot to carry. I'm a prototype, not a clinician, but I can listen without judging. What feels most important about this for you today? If practical advice isn't what you need, we can simply slow down and talk it through.";
  }

  function conversationMessages(sources) {
    const history = state.chat
      .slice(-MAX_CONTEXT_MESSAGES)
      .map(({ role, content }) => ({ role, content }));
    return [
      {
        role: "system",
        content: [
          "You are ASTRA, an empathetic, calm conversational support prototype for astronauts dealing with isolated, confined, and extreme environments.",
          "Reply in the language and conversational register the user is using, including Arabic when appropriate.",
          "You are not a therapist, clinician, flight surgeon, mission control connection, or emergency dispatcher.",
          "Never diagnose a disorder, assess fitness for duty or immediate safety, claim NASA training/endorsement, or present yourself as an actual astronaut-support professional.",
          "Reflect feelings without assumptions, ask one gentle open-ended follow-up question, and offer at most one optional, low-risk, evidence-informed general coping idea.",
          "Do not prescribe medication, encourage isolation/secrecy, or provide mission/medical procedures.",
          "If the user mentions suicidal thoughts, self-harm, intent to die, inability to stay safe, or immediate danger: respond compassionately, state you cannot assess or summon help, clearly urge them to contact a trusted person now and follow established mission emergency procedures to reach qualified human support, and do not continue ordinary coaching.",
          "NASA research excerpts are general background only, not medical advice or a basis for diagnosing, assessing risk, or prescribing coping strategies.",
          "Do not claim NASA endorses ASTRA or cite NASA as validating your response. The interface displays relevant source links separately.",
          "Do not overpromise privacy: this message, recent conversation history, and the relevant NASA source excerpts below are sent to the explicitly configured provider.",
          "Responses are not clinically validated.",
        ].join(" "),
      },
      {
        role: "system",
        content: [
          "Relevant NASA public-source context selected for this message:",
          ...sources.map((source) => `${source.title}: ${source.summary} Source: ${source.url}`),
          "Treat these summaries as limited background; do not infer clinical guidance from them.",
        ].join("\n"),
      },
      ...history,
    ];
  }

  function chatAdd(role, content, metadata = "", sources = []) {
    state.chat.push({ role, content });
    state.chat = state.chat.slice(-MAX_CONTEXT_MESSAGES);
    const message = document.createElement("div");
    message.className = `chat-message ${role === "user" ? "user-message" : "assistant-message"}`;
    const avatar = role === "assistant" ? '<span class="message-avatar">✳</span>' : "";
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    bubble.append(paragraph);
    if (metadata) {
      const meta = document.createElement("span");
      meta.className = "message-meta";
      meta.textContent = metadata;
      bubble.append(meta);
    }
    if (role === "assistant") appendNasaSources(bubble, sources);
    message.innerHTML = avatar;
    message.append(bubble);
    $("#chat-messages").append(message);
    $("#chat-messages").scrollTop = $("#chat-messages").scrollHeight;
  }

  function setChatBusy(busy) {
    state.busy = busy;
    $("#chat-form .send-button").disabled = busy;
    $("#chat-input").disabled = busy;
    $("#pilot-status").textContent = busy
      ? "PROCESSING YOUR MESSAGE"
      : state.mode === "live"
        ? "PROVIDER CONNECTED"
        : "SIMULATION ACTIVE";
  }

  // Provider communication and chat controls.
  async function getProviderReply(text, sources) {
    const endpoint = `${state.apiBase}/chat/completions`;
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.apiKey}` },
        body: JSON.stringify({
          model: state.model,
          messages: conversationMessages(sources),
          temperature: 0.55,
          max_tokens: 300,
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(25000) : undefined,
      });
    } catch (error) {
      if (error.name === "AbortError" || error.name === "TimeoutError")
        throw new Error(
          "The AI provider took too long to respond. Check the provider connection, or switch to labeled simulation mode.",
        );
      if (error instanceof TypeError)
        throw new Error(
          "Could not reach the AI provider. Check the endpoint, internet connection, and provider CORS settings.",
        );
      throw new Error(`AI provider request failed: ${error.message}`);
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 220);
      if (response.status === 401 || response.status === 403)
        throw new Error(
          `The AI provider rejected authentication (HTTP ${response.status}). Verify your key and provider access. ${detail}`,
        );
      if (response.status === 429)
        throw new Error(
          "The AI provider is rate-limiting this request. Wait a moment or switch to simulation mode.",
        );
      throw new Error(
        `The AI provider returned HTTP ${response.status}. ${detail || "Review provider settings."}`,
      );
    }
    let result;
    try {
      result = await response.json();
    } catch (error) {
      throw new Error(`The AI provider response was not valid JSON: ${error.message}`);
    }
    const answer = result?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim())
      throw new Error(
        "The configured provider returned no chat-completion text. Check that the selected model supports chat completions.",
      );
    return answer.trim().slice(0, 6000);
  }

  async function submitChat(event) {
    event.preventDefault();
    if (state.busy) return;
    const input = $("#chat-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    chatAdd("user", text);
    if (isUrgent(text)) {
      chatAdd(
        "assistant",
        urgentResponse(text),
        "HUMAN SUPPORT PRIORITY · NOT AN EMERGENCY SERVICE",
      );
      toast(
        /[\u0600-\u06ff]/u.test(text)
          ? "تواصلي/تواصل الآن مع شخص موثوق وإجراءات الطوارئ المعتمدة."
          : "Please contact a trusted person and your established emergency support channel now.",
        true,
      );
      return;
    }
    const sources = getNasaSources(text);
    const typing = document.createElement("div");
    typing.className = "chat-message assistant-message typing-message";
    typing.innerHTML =
      '<span class="message-avatar">✳</span><div class="message-bubble"><span class="typing-dots" aria-label="Preparing a response"><i></i><i></i><i></i></span></div>';
    $("#chat-messages").append(typing);
    setChatBusy(true);
    try {
      if (state.mode === "live" && state.aiConsent && state.apiKey) {
        const answer = await getProviderReply(text, sources);
        typing.remove();
        chatAdd(
          "assistant",
          answer,
          `LIVE AI · ${state.model.toUpperCase()} · NOT CLINICALLY VALIDATED`,
          sources,
        );
      } else {
        await new Promise((resolve) =>
          window.setTimeout(resolve, state.preferences.motion ? 620 : 0),
        );
        typing.remove();
        chatAdd(
          "assistant",
          localSimulationReply(text),
          "LOCAL SIMULATION · NOT CLINICALLY VALIDATED",
          sources,
        );
      }
    } catch (error) {
      typing.remove();
      chatAdd(
        "assistant",
        `The configured AI provider did not return a response. ${error.message} Your message has not been silently answered by a simulation. You can explicitly switch to labeled local simulation from the provider settings.`,
        "PROVIDER ERROR · NO FALLBACK",
      );
      toast(error.message, true);
    } finally {
      setChatBusy(false);
    }
  }

  function resetChat() {
    state.chat = [];
    $("#chat-messages").innerHTML =
      '<div class="chat-time mono">NEW PRIVATE DEMO SESSION · NOT SAVED</div><div class="chat-message assistant-message"><span class="message-avatar">✳</span><div class="message-bubble"><p>Welcome back. I’m ASTRA, a psychological-wellness support prototype—not a counselor or mission link. What would feel helpful to talk about?</p><span class="message-meta">MESSAGES NOT SAVED · YOU CONTROL WHAT YOU SHARE</span></div></div>';
    toast("Visible conversation cleared. Messages were never saved.");
  }

  function setupChat() {
    $("#chat-form").addEventListener("submit", submitChat);
    $("#clear-chat").addEventListener("click", resetChat);
    $("#chat-support").addEventListener("click", showSupportDialog);
    $("#configure-ai").addEventListener("click", () => showAiSettings());
    $("#api-settings").addEventListener("click", () => showAiSettings());
    $$("[data-prompt]").forEach((button) =>
      button.addEventListener("click", () => {
        if (button.id === "try-scenario") return;
        $("#chat-input").value = button.dataset.prompt || "";
        $("#chat-form").requestSubmit();
      }),
    );
    $("#chat-input").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        $("#chat-form").requestSubmit();
      }
    });
  }

  // Media fallbacks, offline support, and startup.
  function attachMediaFallbacks() {
    $$("video").forEach((video) => {
      video.addEventListener("error", () => {
        video.hidden = true;
      });
      video.addEventListener("abort", () => {
        video.hidden = true;
      });
    });
    $$("img").forEach((image) =>
      image.addEventListener(
        "error",
        () => {
          image.style.visibility = "hidden";
          image.parentElement?.classList.add("media-fallback");
        },
        { once: true },
      ),
    );
    if (!("IntersectionObserver" in window) || reducedMotion.matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting)
            video.play().catch(() => {
              video.pause();
            });
          else video.pause();
        });
      },
      { threshold: 0.18 },
    );
    $$(".footer-bg-media").forEach((video) => observer.observe(video));
  }

  function registerOfflineShell() {
    if (!window.isSecureContext || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((error) => toast(`Offline app shell could not be cached: ${error.message}`, true));
  }

  function initialize() {
    loadPreferences();
    loadAiPreferences();
    updateAiMode();
    drawStarfield();
    setupNavigation();
    observeReveals();
    attachExercises();
    setupScenarios();
    setupChat();
    renderNasaLibrary();
    attachMediaFallbacks();
    registerOfflineShell();
  }

  reducedMotion.addEventListener?.("change", (event) => {
    if (event.matches && state.preferences.motion) {
      state.preferences.motion = false;
      document.documentElement.dataset.motion = "off";
      savePreferences();
      stopBreathing();
    }
  });

  document.addEventListener("DOMContentLoaded", initialize, { once: true });
})();
