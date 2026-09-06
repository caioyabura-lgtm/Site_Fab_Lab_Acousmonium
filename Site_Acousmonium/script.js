"use strict";

// CONFIG
const APP_CONFIG = Object.freeze({
  version: "1.0",
  isAdmin: true,
  // O arquivo institucional ainda não foi fornecido. Ative ao adicioná-lo.
  logoPath: "",
  storageKey: "fablab-acousmonium-machines"
});

// DATA
const DEMO_MACHINES = [
  { id: "demo-laser", name: "Cortadora Laser CO₂", manufacturer: "Equipamento demonstrativo", model: "CO₂ 100W", category: "Corte e gravação", status: "Exemplo", description: "Exemplo de equipamento destinado a corte e gravação de materiais por laser.", specs: ["Potência: 100 W"], materials: "Acrílico, MDF, papel, cartão e compensado", workArea: "900 × 600 mm", image: "", isDemo: true },
  { id: "demo-fdm", name: "Impressora 3D FDM", manufacturer: "Equipamento demonstrativo", model: "FDM", category: "Fabricação aditiva", status: "Exemplo", description: "Exemplo de equipamento para prototipagem e fabricação aditiva.", specs: ["Tecnologia: FDM"], materials: "PLA, PETG e materiais compatíveis", workArea: "250 × 250 × 250 mm", image: "", isDemo: true },
  { id: "demo-cnc", name: "CNC Router", manufacturer: "Equipamento demonstrativo", model: "CNC 3 eixos", category: "Usinagem digital", status: "Exemplo", description: "Exemplo de equipamento destinado à fabricação subtrativa e prototipagem.", specs: ["Eixos: 3"], materials: "Madeira, MDF, polímeros e materiais compatíveis", workArea: "1200 × 800 mm", image: "", isDemo: true },
  { id: "demo-electronics", name: "Bancada de Eletrônica", manufacturer: "Configuração demonstrativa", model: "Estação de prototipagem", category: "Eletrônica", status: "Exemplo", description: "Exemplo de estação destinada à montagem, teste e desenvolvimento de sistemas eletrônicos.", specs: [], materials: "Componentes eletrônicos e circuitos", workArea: "Não aplicável", image: "", isDemo: true },
  { id: "demo-audio", name: "Estação de Áudio e Prototipagem", manufacturer: "Configuração demonstrativa", model: "Estação experimental", category: "Áudio e interação", status: "Exemplo", description: "Exemplo de estação dedicada à experimentação sonora e desenvolvimento de interfaces.", specs: [], materials: "Áudio digital, sensores, interfaces e sistemas interativos", workArea: "Não aplicável", image: "", isDemo: true }
];
const COPY = {
  demo: "EQUIPAMENTO DE DEMONSTRAÇÃO",
  demoNote: "Este é um equipamento demonstrativo utilizado para visualizar a futura estrutura do catálogo.",
  emptyTitle: "Nenhum equipamento cadastrado.",
  emptyDescription: "O parque de máquinas do Fab Lab Acousmonium está sendo construído.",
  added: "Máquina adicionada.", updated: "Alterações salvas.", deleted: "Máquina excluída.",
  contact: "Formulário demonstrativo. O envio será habilitado em uma versão futura.",
  storageError: "Não foi possível salvar no navegador. Verifique o espaço disponível e a permissão de armazenamento.",
  loadError: "Não foi possível ler o catálogo salvo. Os dados existentes foram preservados. Verifique o armazenamento do navegador.",
  missing: "Não informado"
};
let machines = [];
let editingId = null;
let deletingId = null;
let lastFocus = null;
let toastTimer;

// STORAGE — único ponto de acesso ao armazenamento; substituível por API na V2.
function validMachine(machine) {
  const fields = ["id", "name", "manufacturer", "model", "category", "status", "description", "materials", "workArea", "image"];
  return machine && fields.every(key => typeof machine[key] === "string") &&
    typeof machine.isDemo === "boolean" && Array.isArray(machine.specs) && machine.specs.every(spec => typeof spec === "string");
}
function getMachines() {
  const raw = localStorage.getItem(APP_CONFIG.storageKey);
  if (raw === null) {
    const initial = DEMO_MACHINES.map(machine => ({ ...machine, specs: [...machine.specs] }));
    saveMachines(initial);
    return initial;
  }
  const saved = JSON.parse(raw);
  if (!Array.isArray(saved) || !saved.every(validMachine) || new Set(saved.map(machine => machine.id)).size !== saved.length) {
    throw new Error("Catálogo inválido");
  }
  return saved;
}
function saveMachines(nextMachines) {
  localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(nextMachines));
}

// MACHINE CRUD — persistir antes de atualizar a interface.
function addMachine(machine) {
  if (!APP_CONFIG.isAdmin) return;
  const next = [...machines, { ...machine, id: crypto.randomUUID() }];
  saveMachines(next);
  machines = next;
}
function updateMachine(id, machine) {
  if (!APP_CONFIG.isAdmin) return;
  const next = machines.map(item => item.id === id ? { ...machine, id } : item);
  saveMachines(next);
  machines = next;
}
function deleteMachine(id) {
  if (!APP_CONFIG.isAdmin) return;
  const next = machines.filter(machine => machine.id !== id);
  saveMachines(next);
  machines = next;
}

// RENDER — textos cadastrados são inseridos como texto, nunca como HTML.
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function safeImageUrl(value) {
  if (!value.trim()) return "";
  try {
    const url = new URL(value, document.baseURI);
    return ["https:", "http:", "file:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}
function machineVisual(machine) {
  const visual = element("div", "machine-visual");
  const placeholder = element("div", "image-placeholder");
  placeholder.append(element("span", "", "IMAGEM DO EQUIPAMENTO"), element("strong", "", machine.name));
  visual.append(placeholder);
  const source = safeImageUrl(machine.image);
  if (source) {
    const image = element("img");
    image.alt = machine.name;
    image.loading = "lazy";
    image.hidden = true;
    image.addEventListener("load", () => { image.hidden = false; placeholder.hidden = true; });
    image.addEventListener("error", () => { image.remove(); placeholder.hidden = false; });
    image.src = source;
    visual.append(image);
  }
  return visual;
}
function actionButton(label, className, callback) {
  const button = element("button", className, label);
  button.type = "button";
  button.addEventListener("click", callback);
  return button;
}
function renderMachines() {
  const grid = document.querySelector("#machine-grid");
  grid.replaceChildren();
  document.querySelector("#machine-count").textContent = `${String(machines.length).padStart(2, "0")} EQUIPAMENTO${machines.length === 1 ? "" : "S"} / CATÁLOGO`;
  document.querySelector("#add-machine").hidden = !APP_CONFIG.isAdmin;
  if (!machines.length) {
    const empty = element("div", "empty-state");
    empty.append(element("h3", "", COPY.emptyTitle), element("p", "", COPY.emptyDescription));
    if (APP_CONFIG.isAdmin) empty.append(actionButton("+ Adicionar primeira máquina", "button button-outline", () => openMachineForm()));
    grid.append(empty);
    return;
  }
  machines.forEach(machine => {
    const card = element("article", "machine-card");
    const body = element("div", "machine-body");
    const meta = element("div", "machine-meta");
    meta.append(element("span", "", machine.category), element("span", "", machine.status || COPY.missing));
    body.append(meta, element("h3", "", machine.name), element("p", "machine-maker", [machine.manufacturer, machine.model].filter(Boolean).join(" / ") || COPY.missing));
    if (machine.isDemo) body.append(element("p", "demo-label", COPY.demo));
    body.append(element("p", "machine-description", machine.description));
    const area = element("div", "machine-spec");
    area.append(element("span", "", "Área de trabalho"), element("span", "", machine.workArea || COPY.missing));
    body.append(area);
    machine.specs.slice(0, 2).forEach(spec => body.append(element("div", "machine-spec", spec)));
    const actions = element("div", "machine-actions");
    actions.append(actionButton("Ver detalhes ↗", "plain-button details-button", () => openDetails(machine.id)));
    if (APP_CONFIG.isAdmin) {
      const edit = actionButton("Editar", "plain-button", () => openMachineForm(machine.id));
      edit.setAttribute("aria-label", `Editar ${machine.name}`);
      const remove = actionButton("", "icon-button", () => openDelete(machine.id));
      remove.setAttribute("aria-label", `Excluir ${machine.name}`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg>';
      actions.append(edit, remove);
    }
    body.append(actions);
    card.append(machineVisual(machine), body);
    grid.append(card);
  });
}
function showToast(message) {
  const toast = document.querySelector("#toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}

// MODALS — dialog nativo: foco contido, Escape e restauração de foco.
function openDialog(id) {
  lastFocus = document.activeElement;
  document.querySelector(id).showModal();
  document.body.classList.add("modal-open");
}
function openMachineForm(id = null) {
  if (!APP_CONFIG.isAdmin) return;
  const form = document.querySelector("#machine-form");
  form.reset();
  editingId = id;
  document.querySelector("#machine-error").textContent = "";
  document.querySelector("#machine-dialog-title").textContent = id ? "Editar máquina" : "Adicionar máquina";
  document.querySelector("#save-machine").textContent = id ? "Salvar alterações" : "Salvar máquina";
  if (id) {
    const machine = machines.find(item => item.id === id);
    if (!machine) return;
    ["name", "manufacturer", "model", "category", "status", "description", "workArea", "materials", "image"].forEach(key => { form.elements.namedItem(key).value = machine[key]; });
    form.elements.namedItem("specs").value = machine.specs.join("\n");
    form.elements.namedItem("isDemo").checked = machine.isDemo;
  }
  openDialog("#machine-dialog");
  form.elements.namedItem("name").focus();
}
function openDelete(id) {
  if (!APP_CONFIG.isAdmin) return;
  const machine = machines.find(item => item.id === id);
  if (!machine) return;
  deletingId = id;
  document.querySelector("#delete-name").textContent = machine.name;
  document.querySelector("#delete-error").textContent = "";
  openDialog("#delete-dialog");
  document.querySelector("#delete-dialog [data-close]").focus();
}
function openDetails(id) {
  const machine = machines.find(item => item.id === id);
  if (!machine) return;
  document.querySelector("#details-title").textContent = machine.name;
  const content = document.querySelector("#details-content");
  content.replaceChildren(machineVisual(machine));
  if (machine.isDemo) content.append(element("p", "demo-label", COPY.demo), element("p", "detail-note", COPY.demoNote));
  content.append(element("p", "", machine.description));
  const list = element("dl");
  [["Categoria", machine.category], ["Fabricante", machine.manufacturer], ["Modelo", machine.model], ["Status", machine.status], ["Área de trabalho", machine.workArea], ["Materiais", machine.materials]].forEach(([label, value]) => list.append(element("dt", "", label), element("dd", "", value || COPY.missing)));
  const specs = element("dd");
  if (machine.specs.length) {
    const items = element("ul");
    machine.specs.forEach(spec => items.append(element("li", "", spec)));
    specs.append(items);
  } else specs.textContent = COPY.missing;
  list.append(element("dt", "", "Especificações"), specs);
  content.append(list);
  openDialog("#details-dialog");
}
function initModals() {
  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      if (lastFocus?.isConnected) lastFocus.focus();
      else if (APP_CONFIG.isAdmin) document.querySelector("#add-machine").focus();
    });
  });
  if (!APP_CONFIG.isAdmin) return;
  document.querySelector("#add-machine").addEventListener("click", () => openMachineForm());
  document.querySelector("#machine-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!APP_CONFIG.isAdmin) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const machine = {};
    ["name", "manufacturer", "model", "category", "status", "description", "workArea", "materials", "image"].forEach(key => { machine[key] = String(data.get(key) || "").trim(); });
    if (![machine.name, machine.category, machine.description].every(Boolean)) {
      document.querySelector("#machine-error").textContent = "Preencha nome, categoria e descrição.";
      return;
    }
    if (machine.image && !safeImageUrl(machine.image)) {
      document.querySelector("#machine-error").textContent = "Informe uma URL HTTP/HTTPS ou um caminho de imagem válido.";
      return;
    }
    machine.specs = String(data.get("specs") || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    machine.isDemo = data.has("isDemo");
    try {
      const isEditing = editingId !== null;
      if (isEditing) updateMachine(editingId, machine); else addMachine(machine);
      renderMachines();
      document.querySelector("#machine-dialog").close();
      showToast(isEditing ? COPY.updated : COPY.added);
    } catch { document.querySelector("#machine-error").textContent = COPY.storageError; }
  });
  document.querySelector("#confirm-delete").addEventListener("click", () => {
    if (!APP_CONFIG.isAdmin || !deletingId) return;
    try {
      deleteMachine(deletingId);
      deletingId = null;
      renderMachines();
      document.querySelector("#delete-dialog").close();
      showToast(COPY.deleted);
    } catch { document.querySelector("#delete-error").textContent = COPY.storageError; }
  });
}

// NAVIGATION
function initNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#main-nav");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    nav.classList.toggle("is-open", open);
  }
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setMenu(false); toggle.focus(); }
  });
  matchMedia("(min-width: 901px)").addEventListener("change", () => setMenu(false));
}

// CONTACT FORM
function initContactForm() {
  document.querySelector("#contact-form").addEventListener("submit", event => {
    event.preventDefault();
    document.querySelector("#contact-feedback").textContent = COPY.contact;
  });
}

// INIT
function initLogo() {
  const path = APP_CONFIG.logoPath;
  if (!path) return;
  const logo = document.querySelector("#brand-logo");
  logo.addEventListener("load", () => { logo.hidden = false; document.querySelector("#brand-text").hidden = true; });
  logo.addEventListener("error", () => { logo.hidden = true; document.querySelector("#brand-text").hidden = false; });
  logo.src = path;
}
function init() {
  initNavigation();
  initModals();
  initContactForm();
  initLogo();
  try { machines = getMachines(); renderMachines(); }
  catch {
    const message = element("p", "empty-state", COPY.loadError);
    message.setAttribute("role", "alert");
    document.querySelector("#machine-grid").replaceChildren(message);
    document.querySelector("#machine-count").textContent = "CATÁLOGO INDISPONÍVEL";
  }
}
init();
