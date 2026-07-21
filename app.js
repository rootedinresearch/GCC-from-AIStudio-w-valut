/* ==========================================================================
   GARDEN CHEAT CODES — MINIMALIST FIELD GUIDE ENGINE (v5.0)
   Synchronized with Brand & Design Notes + Autopilot Operating Plan
   ========================================================================== */

let vaultEntries = [];
let currentLang = 'EN';
let currentCategory = 'all';
let currentVerdict = 'all';
let searchQuery = '';

// Transitional Showcase Vegetables Data
const SHOWCASE_ITEMS = [
  {
    category: "Tomatoes",
    icon: "🍅",
    id: "TOM-001",
    verdict: "Supported",
    verdict_icon: "✅",
    title: "Burying Tomato Stems Deeply",
    old_ways: "Grandma said: Strip lower leaves and bury tomato stems deep down to the top two sets of leaves...",
    science: "Stem parenchyma cells rapidly grow into fresh roots within 14 days, expanding the root system by +140% to absorb water during summer heat."
  },
  {
    category: "Peppers",
    icon: "🌶️",
    id: "PEP-001",
    verdict: "Surprising Twist",
    verdict_icon: "🔄",
    title: "Epsom Salt & Sulfur for Hotter Jalapeños",
    old_ways: "Old folk tip: Add a spoonful of Epsom salt and sulfur to pepper plants for spicy jalapenos...",
    science: "Peppers need magnesium and sulfur to build capsaicin—the natural chemical that makes peppers spicy. Epsom salt feeds both minerals directly."
  },
  {
    category: "Squash",
    icon: "🥒",
    id: "SQU-001",
    verdict: "Supported",
    verdict_icon: "✅",
    title: "10% Milk Spray for Mildew Spots",
    old_ways: "Folk remedy: Spray raw milk diluted in water onto squash leaves at the first sign of white powdery spots...",
    science: "Milk proteins exposed to sunlight create natural antiseptics that wipe out powdery mildew fungus without harming bees."
  },
  {
    category: "Okra",
    icon: "🌾",
    id: "OKR-001",
    verdict: "Extension Verified",
    verdict_icon: "🎓",
    title: "Daily Harvesting Prevents Flower Bud Halt",
    old_ways: "Ancestral Southern rule: Pick your okra pods every single morning once they hit finger length—never let a pod go to seed...",
    science: "Okra enters seed maturation mode as soon as pods grow past 3 inches. Daily picking keeps plants producing 310% more pods."
  },
  {
    category: "Soil",
    icon: "🪴",
    id: "SOI-001",
    verdict: "Myth",
    verdict_icon: "❌",
    title: "Crushed Eggshells vs Blossom End Rot",
    old_ways: "Grandma said: Throw crushed eggshells into tomato holes to instantly stop bottom rot...",
    science: "Eggshells take 1 to 3 years to break down. Blossom end rot in heat is caused by uneven watering interrupting calcium transpiration."
  }
];

let currentShowcaseIndex = 0;
let showcaseTimer = null;
let isShowcasePaused = false;

// Translations Dictionary
const translations = {
  EN: {
    heroTitle: "Before It Was Written,<br><span class='highlight'>Somebody Already Knew.</span>",
    heroDesc: "Grandparents and elders figured things out over generations of dirt under their nails. We take what those ancestors knew seriously enough to test it against peer-reviewed horticultural science — honoring it when they were right, explaining the mechanism, and correcting the myths.",
    searchPlaceholder: "Search 500 field notes (e.g. blossom rot, deep planting, eggshells, milk)...",
    unlockBtn: "Unlock Full Vault ($49)",
    atomOldWays: "1. What The Old Ways Say (Old-Time Gardening Tip)",
    atomCultural: "2. Family & Generational Lore",
    atomScience: "3. What The Science Proves (University Research)",
    atomPro: "4. What Professional Growers Do",
    atomCheat: "5. The Cheat Code (Step-by-Step Action Plan)",
    atomTrial: "6. Try It Yourself in Your Garden",
    atomProduct: "7. Recommended Product & Exclusive Member Discount"
  },
  ES: {
    heroTitle: "Antes de Estar Escrito,<br><span class='highlight'>Alguien Ya Lo Sabía.</span>",
    heroDesc: "Nuestros abuelos y mayores descubrieron los secretos de la tierra durante generaciones. Tomamos ese conocimiento ancestral y lo verificamos contra investigaciones hortícolas revisadas por pares.",
    searchPlaceholder: "Buscar 500 notas de campo (ej. pudrición apical, plantación profunda, cáscaras de huevo)...",
    unlockBtn: "Obtener Pase ($49)",
    atomOldWays: "1. Lo Que Decían los Antiguos",
    atomCultural: "2. Historias y Lore Familiar",
    atomScience: "3. Lo Que Demuestra la Ciencia",
    atomPro: "4. Lo Que Hacen los Agricultores Profesionales",
    atomCheat: "5. El Código Secreto (Paso a Paso)",
    atomTrial: "6. Pruébalo Tú Mismo en tu Jardín",
    atomProduct: "7. Producto Recomendado y Descuento de Miembro"
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  await loadVaultEntries();
  renderVault();
  initTransitionalShowcase();
});

// Load Vault Entries
async function loadVaultEntries() {
  try {
    let response = await fetch('vault_entries_500.json');
    if (!response.ok) {
      response = await fetch('vault_entries.json');
    }
    vaultEntries = await response.json();
    console.log(`Loaded ${vaultEntries.length} ancestral field notes.`);
  } catch (error) {
    console.error("Error loading vault entries:", error);
  }
}

// Initialize Transitional Field Notes Showcase Sidebar
function initTransitionalShowcase() {
  renderShowcaseCard(0);
  startShowcaseTimer();
}

function startShowcaseTimer() {
  if (showcaseTimer) clearInterval(showcaseTimer);
  showcaseTimer = setInterval(() => {
    if (!isShowcasePaused) {
      currentShowcaseIndex = (currentShowcaseIndex + 1) % SHOWCASE_ITEMS.length;
      renderShowcaseCard(currentShowcaseIndex);
    }
  }, 4000);
}

function renderShowcaseCard(index) {
  currentShowcaseIndex = index;
  const item = SHOWCASE_ITEMS[index];
  const wrap = document.getElementById('showcaseCardWrap');
  if (!wrap) return;

  document.querySelectorAll('.showcase-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.textContent.includes(item.category)) {
      tab.classList.add('active');
    }
  });

  const verdictClass = getVerdictClass(item.verdict);

  wrap.innerHTML = `
    <div class="showcase-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="entry-id">FIELD NOTE #${item.id} &bull; ${item.category.toUpperCase()}</span>
        <span class="verdict-stamp ${verdictClass}">${item.verdict_icon} ${item.verdict}</span>
      </div>
      <h3>${item.title}</h3>
      <p class="showcase-folk">"${item.old_ways}"</p>
      <div class="showcase-science">
        <strong>What The Science Proves:</strong> ${item.science}
      </div>
      <button class="btn btn-primary btn-sm btn-block" onclick="openEntryModal('${item.id}')">
        Read Full Field Note (${item.id}) →
      </button>
    </div>
  `;

  const indicator = document.getElementById('showcaseProgress');
  if (indicator) {
    indicator.textContent = `Auto-cycling field note ${index + 1} of ${SHOWCASE_ITEMS.length} (${item.category})`;
  }
}

function switchShowcaseTab(categoryName) {
  const targetIndex = SHOWCASE_ITEMS.findIndex(item => item.category === categoryName);
  if (targetIndex !== -1) {
    renderShowcaseCard(targetIndex);
  }
}

function pauseShowcaseRotation() {
  isShowcasePaused = !isShowcasePaused;
  const btn = document.getElementById('showcasePauseBtn');
  if (btn) {
    btn.textContent = isShowcasePaused ? 'Resume ▶' : 'Pause ⏸';
  }
}

// Master Render Engine for Ancestral Field Library
function renderVault() {
  const filtered = getFilteredEntries();

  const container = document.getElementById('vaultContainer');
  container.className = 'vault-container grid-mode';
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `<div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px; background: #ffffff; border-radius: 8px; border: 1px solid var(--color-paper-border);">
      <h3>No matching field notes found</h3>
      <p>Try clearing your search query or selecting a different category tab above.</p>
    </div>`;
    return;
  }

  const categoryCounter = {};

  filtered.forEach(entry => {
    const cat = entry.crop;
    if (!categoryCounter[cat]) {
      categoryCounter[cat] = 0;
    }
    categoryCounter[cat]++;

    const isUnlocked = categoryCounter[cat] <= 4;
    const card = document.createElement('div');
    
    card.className = `library-card ${isUnlocked ? 'unlocked-card' : 'locked-card'}`;

    const verdictClass = getVerdictClass(entry.verdict);
    const displayTitle = (currentLang === 'ES' ? (entry.title_es || entry.title) : entry.title).replace(/\s*\(Protocol\s*\d+\)/gi, '');
    const displayFolk = currentLang === 'ES' ? (entry.old_ways_es || entry.old_ways) : entry.old_ways;
    const doiUrl = entry.doi_url || `https://doi.org/${entry.doi}`;

    if (isUnlocked) {
      card.innerHTML = `
        <div class="library-card-header">
          <span class="entry-id">${entry.id} &bull; ${entry.crop}</span>
          <span class="verdict-stamp ${verdictClass}">${entry.verdict_icon} ${entry.verdict}</span>
        </div>
        <h3 class="card-title">${displayTitle}</h3>
        <p class="card-folk-quote">"${displayFolk}"</p>
        <div class="card-footer">
          <a href="${doiUrl}" target="_blank" class="card-doi-link">🔗 University Study Link ↗</a>
          <button class="btn btn-outline btn-sm" onclick="openEntryModal('${entry.id}')">Read Free Note →</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="library-card-header">
          <span class="entry-id">${entry.id} &bull; ${entry.crop}</span>
          <span class="verdict-stamp ${verdictClass}">${entry.verdict_icon} ${entry.verdict}</span>
        </div>
        <h3 class="card-title">${displayTitle}</h3>
        <p class="card-folk-quote">"${displayFolk}"</p>
        
        <div class="paywall-overlay-box" onclick="openPaywallModal('${displayTitle.replace(/'/g, "\\'")}')">
          <div class="paywall-lock-title">🔒 LOCKED MEMBER FIELD NOTE</div>
          <div class="paywall-lock-desc">Science proof & step-by-step action plan locked.</div>
          <button class="btn btn-primary btn-sm btn-block">Unlock Full Note ($49) →</button>
        </div>
      `;
    }

    container.appendChild(card);
  });
}

// Filter Helper
function getFilteredEntries() {
  return vaultEntries.filter(entry => {
    const matchCategory = currentCategory === 'all' || entry.crop === currentCategory;
    const matchVerdict = currentVerdict === 'all' || entry.verdict === currentVerdict;
    
    const query = searchQuery.toLowerCase();
    const titleMatch = (entry.title && entry.title.toLowerCase().includes(query)) ||
                       (entry.title_es && entry.title_es.toLowerCase().includes(query));
    const folkMatch = (entry.old_ways && entry.old_ways.toLowerCase().includes(query)) ||
                      (entry.id && entry.id.toLowerCase().includes(query));

    return matchCategory && matchVerdict && (query === '' || titleMatch || folkMatch);
  });
}

function getVerdictClass(verdict) {
  switch (verdict) {
    case 'Supported': return 'verdict-supported';
    case 'Myth': return 'verdict-myth';
    case 'Partial': return 'verdict-partial';
    case 'Surprising Twist': return 'verdict-twist';
    case 'Extension Verified': return 'verdict-extension';
    default: return 'verdict-supported';
  }
}

function filterVault() {
  searchQuery = document.getElementById('vaultSearch').value;
  currentVerdict = document.getElementById('verdictFilter').value;
  renderVault();
}

function setCategoryPill(category) {
  currentCategory = category;

  document.querySelectorAll('.pill-tab').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.includes(category) || (category === 'all' && btn.textContent.includes('All'))) {
      btn.classList.add('active');
    }
  });

  renderVault();
}

function openEntryModal(entryId) {
  const entry = vaultEntries.find(e => e.id === entryId);
  if (!entry) return;

  const modalBody = document.getElementById('modalBody');
  const t = translations[currentLang];

  const displayTitle = (currentLang === 'ES' ? (entry.title_es || entry.title) : entry.title).replace(/\s*\(Protocol\s*\d+\)/gi, '');
  const displayFolk = currentLang === 'ES' ? (entry.old_ways_es || entry.old_ways) : entry.old_ways;
  const displayCultural = currentLang === 'ES' ? (entry.cultural_context_es || entry.cultural_context) : entry.cultural_context;
  const displayScience = currentLang === 'ES' ? (entry.science_says_es || entry.science_says) : entry.science_says;
  const doiUrl = entry.doi_url || `https://doi.org/${entry.doi}`;

  modalBody.innerHTML = `
    <div class="atom-container">
      <div class="atom-header">
        <div class="atom-meta">
          <span class="entry-id">${entry.id} &bull; ${entry.crop}</span>
          <span class="verdict-stamp ${getVerdictClass(entry.verdict)}">${entry.verdict_icon} ${entry.verdict}</span>
          <span class="badge badge-zone">Texas / Zone 8a Verified</span>
        </div>
        <h2>${displayTitle}</h2>
      </div>

      <div class="atom-section" style="border-left-color: #b45309; background-color: var(--color-paper-card);">
        <h4>${t.atomOldWays}</h4>
        <p style="font-family: var(--font-handwritten); font-size: 24px; color: #78350f; line-height: 1.2;">"${displayFolk}"</p>
      </div>

      <div class="atom-section">
        <h4>${t.atomCultural}</h4>
        <p>${displayCultural}</p>
      </div>

      <div class="atom-section">
        <h4>${t.atomScience}</h4>
        <p style="font-size: 17px; line-height: 1.6;">${displayScience}</p>
        
        <div class="doi-verify-box">
          <span style="font-size: 11px; font-family: var(--font-mono); font-weight: 700; color: var(--color-ink-muted);">VERIFIED RESEARCH CITATION:</span>
          <strong>${entry.citation}</strong>
          <a href="${doiUrl}" target="_blank" class="doi-verify-btn">
            🔬 Read Official University Study Paper ↗
          </a>
        </div>
      </div>

      ${entry.svg_diagram ? `
      <div class="atom-svg-wrap">
        <h4 style="margin-bottom: 8px; font-size: 11px; font-family: var(--font-mono); color: var(--color-ink-muted);">VISUAL GARDEN DIAGRAM</h4>
        ${entry.svg_diagram}
      </div>` : ''}

      <div class="atom-section">
        <h4>${t.atomPro}</h4>
        <p>${entry.professional_practice}</p>
      </div>

      <div class="atom-section" style="border-left-color: #09090b; background-color: var(--color-paper-base); border: 1px solid #e4e4e7;">
        <h4 style="color: #09090b;">${t.atomCheat}</h4>
        <p style="font-size: 17px; font-weight: 500;">${entry.cheat_code}</p>
      </div>

      <div class="atom-section" style="border-left-color: #15803d; background-color: var(--color-stamp-green-bg);">
        <h4 style="color: #15803d;">${t.atomTrial}</h4>
        <p>${entry.try_it_yourself}</p>
      </div>

      <div class="affiliate-box">
        <div>
          <strong>${entry.product_recommendation.name}</strong>
          <p style="font-size: 13px; color: var(--color-stamp-green); margin-top: 4px; font-family: var(--font-sans);">
            🎟️ <strong>Exclusive Member Perk:</strong> Use code <strong>${entry.product_recommendation.discount_code}</strong> for 25% off non-GMO seeds at SeedsNow (365-day cookie guarantee).
          </p>
        </div>
        <a href="${entry.product_recommendation.url}" target="_blank" class="btn btn-primary btn-sm">Redeem 25% Off →</a>
      </div>
    </div>
  `;

  document.getElementById('entryModal').classList.add('active');
}

function closeEntryModal() {
  document.getElementById('entryModal').classList.remove('active');
}

function openPaywallModal(entryTitle) {
  const cleanTitle = entryTitle.replace(/\s*\(Protocol\s*\d+\)/gi, '');
  document.getElementById('paywallModalTitle').textContent = `Unlock Field Note: "${cleanTitle}"`;
  document.getElementById('paywallModal').classList.add('active');
}

function closePaywallModal() {
  document.getElementById('paywallModal').classList.remove('active');
}

function handleTrialAction(trialName) {
  document.getElementById('paywallModalTitle').textContent = `Join Gated Trial: "${trialName}"`;
  document.getElementById('paywallModal').classList.add('active');
}

function openEventWaitlistModal() {
  document.getElementById('eventWaitlistModal').classList.add('active');
}

function closeEventWaitlistModal() {
  document.getElementById('eventWaitlistModal').classList.remove('active');
}

function submitEventWaitlist(event) {
  event.preventDefault();
  const city = document.getElementById('eventCity').value;
  const email = document.getElementById('eventEmail').value;

  alert(`🎟️ Spot Reserved!\n\nWe have recorded your interest for ${city} with your email address (${email}). You will receive priority first-access and early bird discounts as soon as the date is locked!`);
  closeEventWaitlistModal();
}

function copyPromoCode() {
  navigator.clipboard.writeText("CHEATCODE25");
  alert("🎟️ Promo code 'CHEATCODE25' copied to clipboard!\nUse this at SeedsNow checkout for 25% off your order (365-day cookie guarantee).");
}

function detectZone() {
  const zip = document.getElementById('zipInput').value.trim();
  const resultDiv = document.getElementById('zoneResult');

  if (!zip || zip.length !== 5 || isNaN(zip)) {
    alert("Please enter a valid 5-digit US Zip Code.");
    return;
  }

  let zoneInfo = "Zone 8a (DFW / North Texas)";
  let springOpen = "Mid-February";
  let fallDeadline = "July 4th";
  let heatWindow = "June 15 - Aug 20";

  if (zip.startsWith('75') || zip.startsWith('76')) {
    zoneInfo = "Zone 8a (DFW / North Texas)";
    springOpen = "Mid-February";
    fallDeadline = "July 4th";
  } else if (zip.startsWith('77') || zip.startsWith('78')) {
    zoneInfo = "Zone 9a (Houston / Austin / San Antonio)";
    springOpen = "Early February";
    fallDeadline = "July 15th";
    heatWindow = "June 1 - Sept 1";
  } else if (zip.startsWith('79')) {
    zoneInfo = "Zone 7b (West Texas / Lubbock / Amarillo)";
    springOpen = "Late March";
    fallDeadline = "June 20th";
  }

  resultDiv.innerHTML = `<strong>Detected for ${zip}: ${zoneInfo}</strong> — Spring Tomato Opening: <em>${springOpen}</em> | Fall Tomato Deadline: <em>${fallDeadline}</em> | Heat Gap: <em>${heatWindow}</em>`;
  document.getElementById('heroZoneBadge').textContent = zoneInfo;
}

function toggleLanguage() {
  currentLang = currentLang === 'EN' ? 'ES' : 'EN';
  document.getElementById('langLabel').textContent = currentLang === 'EN' ? '🌐 EN / ES' : '🌐 ES / EN';
  
  const t = translations[currentLang];
  document.querySelector('.hero-title').innerHTML = t.heroTitle;
  document.getElementById('heroDesc').textContent = t.heroDesc;
  document.getElementById('vaultSearch').placeholder = t.searchPlaceholder;

  renderVault();
}

function openCheckoutModal(planName) {
  closePaywallModal();
  document.getElementById('checkoutProductName').textContent = planName;
  document.getElementById('checkoutPrice').textContent = planName.includes('$79') ? '$79.00 / year' : '$49.00';
  document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
}

function simulateSuccessfulPayment() {
  alert("🎉 Payment Successful via Stripe!\n\nYour Beehiiv welcome email with your Vault Access Pass, member promo code 'CHEATCODE25', and $49 Annual Upgrade Credit has been dispatched. Welcome to Garden Cheat Codes!");
  closeCheckoutModal();
}

function handleEmailSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('emailInput').value;

  if (email) {
    alert(`🌱 Thank you for subscribing!\n\nWe have sent your download link for the "Top 20 Tomato Cheat Codes PDF Guide" to ${email}. Check your inbox!`);
    document.getElementById('emailInput').value = '';
  }
}
