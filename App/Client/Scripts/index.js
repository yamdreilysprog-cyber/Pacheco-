const tabButtons = document.querySelectorAll(".tab-btn");
const panels = {
  disponibles: document.getElementById("tab-disponibles"),
  taller: document.getElementById("tab-taller"),
};
const WHATSAPP_NUMBER = "584120000000";
const API_URL = window.PACHECO_API_URL ||
  (window.location.port === "3000" ? "" : "http://localhost:3000");
const availableCars = document.getElementById("available-cars");
const workshopCars = document.getElementById("workshop-cars");

function setWhatsAppLinks(root = document) {
  root.querySelectorAll(".whatsapp-link").forEach((link) => {
    const message = link.dataset.msg || "Hola, vengo de la landing page y quiero más información.";
    link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    link.target = "_blank";
    link.rel = "noopener";
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[character]));
}

function showCatalogMessage(container, message) {
  container.innerHTML = `<p class="catalog-message">${escapeHtml(message)}</p>`;
}

function vehicleCard(vehicle) {
  const title = `${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)} · ${vehicle.year}`;
  const status = vehicle.status === "available" ? "CERTIFICADO" : "EN TALLER";
  const photo = vehicle.photo_url
    ? `<img src="${escapeHtml(`${API_URL}${encodeURI(vehicle.photo_url)}`)}" alt="${title}" loading="lazy">`
    : "FOTO DEL VEHÍCULO";
  const message = `Hola, buenas. Vi el ${vehicle.make} ${vehicle.model} ${vehicle.year} en su catálogo web. ¿Sigue disponible? Me interesa el informe de revisión mecánica.`;

  return `<div class="car-card${vehicle.status === "workshop" ? " workshop-card" : ""}">
    <div class="car-photo">${photo}<span class="badge-mini">${status}</span></div>
    <div class="car-body">
      <h3>${title}</h3>
      <div class="spec-grid">
        <div><span class="k">Año</span><span class="v">${vehicle.year}</span></div>
        <div><span class="k">KM</span><span class="v">${Number(vehicle.mileage).toLocaleString("es-VE")}</span></div>
        <div><span class="k">Estado</span><span class="v">${escapeHtml(vehicle.condition)}</span></div>
      </div>
      <div class="price">$${Number(vehicle.price_usd).toLocaleString("en-US")}</div>
      <a href="#" class="car-cta whatsapp-link" data-msg="${escapeHtml(message)}">${vehicle.status === "available" ? "Consultar por WhatsApp" : "Avísenme cuando esté listo"}</a>
    </div>
  </div>`;
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    Object.values(panels).forEach((panel) => panel.classList.remove("active"));
    panels[button.dataset.tab].classList.add("active");
  });
});

setWhatsAppLinks();

const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("cf-name").value.trim();
    const phone = document.getElementById("cf-phone").value.trim();
    const message = document.getElementById("cf-msg").value.trim();
    const text = `Hola, soy ${name} (tel: ${phone}). ${message || "Vengo de la landing page y quiero más información."}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });
}

async function loadCatalog() {
  try {
    const response = await fetch(`${API_URL}/api/vehicles`);
    if (!response.ok) throw new Error("No se pudo cargar el catálogo.");
    const result = await response.json();
    if (!Array.isArray(result.data)) throw new Error("La respuesta del catálogo no tiene el formato esperado.");

    const available = result.data.filter((vehicle) => vehicle.status === "available");
    const workshop = result.data.filter((vehicle) => vehicle.status === "workshop");
    availableCars.innerHTML = available.length
      ? available.map(vehicleCard).join("")
      : '<p class="catalog-message">No hay vehículos disponibles en este momento. Escríbenos y te avisamos apenas ingrese uno.</p>';
    workshopCars.innerHTML = workshop.length
      ? workshop.map(vehicleCard).join("")
      : '<p class="catalog-message">No hay vehículos en preparación en este momento.</p>';
    setWhatsAppLinks(availableCars);
    setWhatsAppLinks(workshopCars);
  } catch (error) {
    showCatalogMessage(availableCars, "El catálogo estará disponible próximamente. Escríbenos por WhatsApp para conocer los vehículos actuales.");
    showCatalogMessage(workshopCars, "El catálogo estará disponible próximamente.");
    console.error(error);
  }
}

loadCatalog();

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("in-view"));
}