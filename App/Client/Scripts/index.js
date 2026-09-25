 // ---- Tabs: Catálogo disponible / En taller ----
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = { disponibles: document.getElementById('tab-disponibles'), taller: document.getElementById('tab-taller') };
  tabButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabButtons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      Object.values(panels).forEach(p=>p.classList.remove('active'));
      panels[btn.dataset.tab].classList.add('active');
    });
  });

  // ---- WhatsApp routing ----
  // Reemplaza este número por el número real del negocio, formato internacional sin '+' ni espacios (ej: 584121234567)
  const WHATSAPP_NUMBER = "584120000000";

  document.querySelectorAll('.whatsapp-link').forEach(link=>{
    const msg = link.dataset.msg || "Hola, vengo de la landing page y quiero más información.";
    link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    link.target = "_blank";
    link.rel = "noopener";
  });