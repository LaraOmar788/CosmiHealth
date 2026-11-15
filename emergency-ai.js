(() => {
  "use strict";

  const state = {
    riskScore: 0,
    riskLevel: "LOW RISK",
    aiConnected: false,
    baseline: {
      heartRate: null,
      systolic: null,
      oxygen: null,
    },
  };

  const dangerWords = [
    "chest pain",
    "shortness of breath",
    "difficulty breathing",
    "trouble breathing",
    "faint",
    "fainted",
    "unconscious",
    "confused",
    "seizure",
    "bleeding",
    "severe pain",
    "syncope",
    "cyanosis",
    "blue lips",
    "loss of consciousness",
    "blackout",
    "severe dizziness",
    "vomiting blood",
    "stroke",
    "heart attack",
    "major trauma",
    "severe abdominal pain",
    "severe weakness",
  ];

  const cautionWords = [
    "dizziness",
    "nausea",
    "vomiting",
    "fatigue",
    "weakness",
    "headache",
    "palpitations",
    "lightheaded",
    "anxiety",
    "chills",
    "pain",
    "sore throat",
    "cough",
    "fever",
    "sweating",
  ];

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function addChatMessage(role, text) {
    const chatWindow = qs("#chatWindow");
    if (!chatWindow) return;
    const item = document.createElement("div");
    item.className = `chat-message ${role}`;
    item.textContent = text;
    chatWindow.appendChild(item);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function setStatusText(text) {
    const status = qs("#statusText");
    if (status) status.textContent = text;
  }

  function updateSummaryAndRisk(meta) {
    const score = Number(meta.score) || 0;
    const banner = qs("#riskBanner");
    const levelEl = qs("#riskLevel");
    const scoreEl = qs("#riskScore");
    const summaryEl = qs("#riskSummary");
    const actionsEl = qs("#recommendedActions");
    const reasonList = qs("#riskReasons");

    let levelKey = "low";
    let levelLabel = "LOW RISK";

    if (score >= 75) {
      levelKey = "high";
      levelLabel = "HIGH RISK";
    } else if (score >= 35) {
      levelKey = "moderate";
      levelLabel = "MODERATE RISK";
    }

    state.riskLevel = levelLabel;
    state.riskScore = score;

    if (banner) {
      banner.classList.remove("high", "moderate", "low");
      banner.classList.add(levelKey);
    }

    if (levelEl) levelEl.textContent = levelLabel;
    if (scoreEl) scoreEl.textContent = `${score}`;
    if (summaryEl) summaryEl.textContent = meta.summary;
    if (actionsEl) {
      actionsEl.innerHTML = meta.actions.map((item) => `<li>${item}</li>`).join("");
    }
    if (reasonList) {
      reasonList.innerHTML = meta.reasons.map((item) => `<li>${item}</li>`).join("");
    }
  }

  function riskFromMeasurement(name, value, compareValue = null) {
    let points = 0;
    const reasons = [];

    if (name === "heartRate") {
      if (value < 40 || value > 130) {
        points += 30;
        reasons.push("Heart rate is outside the usual emergency-response range.");
      } else if (value < 50 || value > 110) {
        points += 12;
        reasons.push("Heart rate is elevated or depressed relative to a stable baseline.");
      }
      if (compareValue !== null && Math.abs(value - compareValue) >= 25) {
        points += 10;
        reasons.push("Heart rate differs substantially from the astronaut baseline.");
      }
    }

    if (name === "systolic") {
      if (value < 90 || value > 160) {
        points += 24;
        reasons.push("Blood pressure is outside the expected safe range.");
      } else if (value < 100 || value > 140) {
        points += 8;
        reasons.push("Blood pressure is trending away from the usual stable range.");
      }
      if (compareValue !== null && Math.abs(value - compareValue) >= 20) {
        points += 8;
        reasons.push("Blood pressure deviates notably from the documented baseline.");
      }
    }

    if (name === "oxygen") {
      if (value < 90) {
        points += 35;
        reasons.push("Oxygen saturation is critically low and may indicate respiratory compromise.");
      } else if (value < 94) {
        points += 18;
        reasons.push("Oxygen saturation is reduced and should be monitored closely.");
      }
      if (compareValue !== null && compareValue > 96 && value < 94) {
        points += 8;
        reasons.push("Oxygen saturation has dropped compared with the astronaut's normal range.");
      }
    }

    if (name === "temperature") {
      if (value > 39.5 || value < 35.0) {
        points += 18;
        reasons.push("Temperature suggests a significant physiologic stress response or fever/low-grade instability.");
      } else if (value > 38.3 || value < 35.8) {
        points += 8;
        reasons.push("Temperature is outside the normal comfort range and may warrant closer monitoring.");
      }
    }

    if (name === "glucose") {
      if (value < 70 || value > 300) {
        points += 25;
        reasons.push("Blood glucose is outside safe limits and could be medically significant.");
      } else if (value < 80 || value > 220) {
        points += 10;
        reasons.push("Blood glucose is elevated or low compared with the expected range.");
      }
    }

    return { points, reasons };
  }

  function assessMedicalData(data) {
    let score = 0;
    const reasons = [];
    const actions = [];

    const hr = Number.parseFloat(data.heartRate);
    const systolic = Number.parseFloat(data.systolic);
    const oxygen = Number.parseFloat(data.oxygen);
    const temp = Number.parseFloat(data.temperature);
    const glucose = Number.parseFloat(data.glucose);
    const symptomText = (data.symptoms || "").toLowerCase();
    const durationHours = Number.parseFloat(data.durationValue || 0);

    const hrMeta = riskFromMeasurement("heartRate", hr, Number.parseFloat(data.baselineHeartRate || NaN));
    const bpMeta = riskFromMeasurement("systolic", systolic, Number.parseFloat(data.baselineSystolic || NaN));
    const oxygenMeta = riskFromMeasurement("oxygen", oxygen, Number.parseFloat(data.baselineOxygen || NaN));
    const tempMeta = riskFromMeasurement("temperature", temp, null);
    const glucoseMeta = riskFromMeasurement("glucose", glucose, null);

    score += hrMeta.points + bpMeta.points + oxygenMeta.points + tempMeta.points + glucoseMeta.points;
    reasons.push(...hrMeta.reasons, ...bpMeta.reasons, ...oxygenMeta.reasons, ...tempMeta.reasons, ...glucoseMeta.reasons);

    let severeMatch = false;
    dangerWords.forEach((word) => {
      if (symptomText.includes(word)) {
        severeMatch = true;
      }
    });

    if (severeMatch) {
      score += 28;
      reasons.push("The reported symptoms include warning signs that may represent a medical emergency.");
    } else {
      const cautionMatch = cautionWords.filter((word) => symptomText.includes(word));
      if (cautionMatch.length) {
        score += Math.min(16, cautionMatch.length * 4);
        reasons.push("The symptom pattern suggests possible physiologic stress but is not yet clearly catastrophic.");
      }
    }

    if (data.durationUnit && data.durationValue) {
      const hours = data.durationUnit === "hours" ? Number(data.durationValue) : data.durationUnit === "days" ? Number(data.durationValue) * 24 : Number(data.durationValue) / 60;
      if (hours >= 12) {
        score += 10;
        reasons.push("Symptoms have persisted for a prolonged period and warrant urgent medical review.");
      }
    }

    if (!symptomText.trim()) {
      score -= 5;
    }

    score = Math.max(0, Math.min(100, score));

    let summary = "At this time the reported data suggests a stable condition that still deserves close monitoring.";
    if (score >= 75) {
      summary = "The combination of symptoms and measurements suggests an immediate, potentially life-threatening situation requiring emergency response.";
      actions.push("Contact the ground medical team immediately and report the current measurements and symptoms.");
      actions.push("Activate emergency response procedures and move to the nearest available medical support point.");
      actions.push("Maintain continuous monitoring, keep the astronaut with a trusted crew member, and avoid delaying intervention.");
    } else if (score >= 35) {
      summary = "This pattern may require prompt medical assessment, especially if symptoms are worsening or new warning signs appear.";
      actions.push("Notify the crew medical lead or flight surgeon without delay and document all measurements.");
      actions.push("Repeat the monitoring cycle in a short interval and do not ignore any worsening symptoms.");
      actions.push("If the astronaut develops chest pain, breathing difficulty, confusion, fainting, or collapse, escalate immediately.");
    } else {
      summary = "The current data are not showing an immediate emergency pattern, but close observation remains important.";
      actions.push("Continue monitoring at regular intervals and reassess if symptoms worsen.");
      actions.push("Rest, hydrate, and avoid strenuous activity until a medical professional reviews the information.");
      actions.push("Record any new symptoms, worsening pain, or changes in observed baseline for comparison.");
    }

    if (data.notes && data.notes.trim()) {
      reasons.push("The additional notes may support a more detailed review of the clinical picture.");
    }

    if (!reasons.length) {
      reasons.push("No major warning signs were identified from the initial description.");
    }

    const uniqueReasons = [...new Set(reasons)].slice(0, 6);
    const uniqueActions = [...new Set(actions)].slice(0, 4);

    return {
      score,
      summary,
      reasons: uniqueReasons,
      actions: uniqueActions,
    };
  }

  function resetForm() {
    const form = qs("#medicalForm");
    if (form) form.reset();
    updateSummaryAndRisk({
      score: 12,
      summary: "No emergency data entered yet. Begin with heart rate, oxygen, blood pressure, and symptoms to assess the situation.",
      reasons: ["Awaiting clinical input.", "The astronaut should continue routine monitoring until the data are collected."],
      actions: ["Enter the current health measurements.", "Add symptoms and duration.", "Review for warning signs before the next action."],
    });
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const assessment = assessMedicalData(data);
    updateSummaryAndRisk(assessment);

    const userSummary = [
      `Current assessment: ${state.riskLevel}.`,
      `Score: ${assessment.score}/100.`,
      assessment.summary,
    ].join(" ");

    addChatMessage("assistant", `Emergency review complete. ${userSummary}`);
    addChatMessage("assistant", `Recommended actions: ${assessment.actions.join(" ")}`);
  }

  function handleChatSubmit(event) {
    event.preventDefault();
    const input = qs("#chatInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    addChatMessage("user", text);
    input.value = "";

    const lowered = text.toLowerCase();
    const response =
      lowered.includes("risk") || lowered.includes("urgent") || lowered.includes("what should i do")
        ? `Current risk level is ${state.riskLevel}. The current assessment score is ${state.riskScore}/100. Please review the critical symptoms and follow the recommended actions panel.`
        : lowered.includes("symptom") || lowered.includes("chest") || lowered.includes("breath")
          ? "Please document the exact symptom, when it started, and whether it is worsening. If there is chest pain, severe shortness of breath, confusion, fainting, or loss of consciousness, escalate immediately to emergency support."
          : "I can help interpret the current medical data and guide the next step. Please enter the most recent vital signs and symptoms so the triage review is accurate.";

    addChatMessage("assistant", response);
  }

  function renderNasaResults(results) {
    const container = qs("#nasaResearchResults");
    if (!container) return;

    container.replaceChildren();
    results.forEach((result) => {
      const card = document.createElement("article");
      card.className = "nasa-research-result";

      const title = document.createElement("a");
      title.href = result.url;
      title.target = "_blank";
      title.rel = "noopener noreferrer";
      title.textContent = result.title;

      const summary = document.createElement("p");
      summary.textContent = result.summary;

      card.append(title, summary);
      container.appendChild(card);
    });
  }

  async function handleNasaResearchSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const topic = new FormData(form).get("topic");
    const submitButton = qs("#nasaResearchSubmit");
    const status = qs("#nasaResearchStatus");
    const resultsContainer = qs("#nasaResearchResults");
    if (!topic || !submitButton || !status || !resultsContainer) return;

    submitButton.disabled = true;
    status.textContent = "Searching NASA NTRS…";
    resultsContainer.replaceChildren();

    try {
      const response = await fetch(`/api/nasa/search?topic=${encodeURIComponent(topic)}`, {
        headers: { Accept: "application/json" },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || `NASA search failed (HTTP ${response.status}).`);
      }

      renderNasaResults(payload.results || []);
      status.textContent = payload.results && payload.results.length
        ? `${payload.results.length} public result${payload.results.length === 1 ? "" : "s"} retrieved from NASA NTRS.`
        : "No public NASA NTRS results were found for this topic.";
    } catch (error) {
      status.textContent = `NASA research search unavailable: ${error.message}. Run node server.js and open the site at http://127.0.0.1:8765 to use this API.`;
    } finally {
      submitButton.disabled = false;
    }
  }

  function initializeStarfield() {
    const canvas = qs("#starfield");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const stars = [];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      const count = Math.min(120, Math.max(55, Math.round(width / 18)));
      stars.length = 0;
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.8 + 0.5,
          a: Math.random() * 0.8 + 0.2,
          drift: Math.random() * 0.4 + 0.1,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${star.a})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.drift;
        if (star.y > height) star.y = -10;
      });
      requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize, { passive: true });
  }

  function setup() {
    initializeStarfield();

    const form = qs("#medicalForm");
    if (form) {
      form.addEventListener("submit", handleFormSubmit);
    }

    const chatForm = qs("#chatForm");
    if (chatForm) {
      chatForm.addEventListener("submit", handleChatSubmit);
    }

    const nasaResearchForm = qs("#nasaResearchForm");
    if (nasaResearchForm) {
      nasaResearchForm.addEventListener("submit", handleNasaResearchSubmit);
    }

    const resetButton = qs("#resetAssessment");
    if (resetButton) {
      resetButton.addEventListener("click", resetForm);
    }

    const exampleButtons = document.querySelectorAll("[data-template]");
    exampleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const template = button.dataset.template;
        const templates = {
          chestPain: {
            heartRate: "124",
            systolic: "94",
            oxygen: "88",
            temperature: "38.9",
            glucose: "126",
            symptoms: "Severe chest pain, shortness of breath, dizziness",
            durationValue: "20",
            durationUnit: "minutes",
            notes: "Pain started suddenly while moving in the module. The astronaut is pale and sweating.",
          },
          stable: {
            heartRate: "68",
            systolic: "118",
            oxygen: "97",
            temperature: "36.9",
            glucose: "94",
            symptoms: "Mild fatigue and brief dizziness after exercise",
            durationValue: "45",
            durationUnit: "minutes",
            notes: "Symptoms improved after resting and hydration.",
          },
          moderate: {
            heartRate: "102",
            systolic: "108",
            oxygen: "94",
            temperature: "37.8",
            glucose: "160",
            symptoms: "Persistent nausea and mild shortness of breath",
            durationValue: "2",
            durationUnit: "hours",
            notes: "Symptoms continue and increasing in intensity.",
          },
        };

        const selected = templates[template];
        if (!selected) return;

        Object.entries(selected).forEach(([key, value]) => {
          const field = qs(`[name="${key}"]`);
          if (field) field.value = value;
        });
      });
    });

    resetForm();
    addChatMessage(
      "assistant",
      "Emergency AI Pilot online. I can triage symptoms, compare vital signs with the astronaut baseline, and help evaluate urgency. I am a decision-support tool, not a substitute for a flight surgeon or emergency medical protocol.",
    );
    addChatMessage(
      "assistant",
      "Start with current vital measurements and symptoms. If the situation includes severe chest pain, breathing difficulty, confusion, fainting, or loss of consciousness, escalate immediately to emergency procedures.",
    );
  }

  document.addEventListener("DOMContentLoaded", setup, { once: true });
})();
