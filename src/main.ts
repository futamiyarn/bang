import { bangs } from "./bang";
import "./global.css";

interface SearchEngine {
  name: string;
  bang: string;
  alias: string[];
}

const SEARCH_ENGINES: SearchEngine[] = [
  { name: "DuckDuckGo", bang: "ddg", alias: ["duckduckgo", "ddg", "d"] },
  { name: "Brave", bang: "brave", alias: ["brave", "b"] },
  { name: "Startpage", bang: "sp", alias: ["startpage", "startsearch", "sp"] },
  { name: "Kagi", bang: "kagi", alias: ["kagi", "k"] },
  { name: "Google", bang: "g", alias: ["google", "g"] },
  { name: "Bing", bang: "bing", alias: ["bing", "bi"] },
  { name: "Yahoo", bang: "y", alias: ["yahoo", "y", "dst"] },
];

const kagiBang = {
  c: "Search",
  d: "kagi.com",
  r: 0,
  s: "Kagi",
  sc: "Search",
  t: "kagi",
  u: "https://kagi.com/search?q={{{s}}}"
};

const urlToBangsMap = new Map<string, typeof bangs>();
for (let i = 0; i < bangs.length; i++) {
  const b = bangs[i];
  if (!urlToBangsMap.has(b.u)) {
    urlToBangsMap.set(b.u, []);
  }
  urlToBangsMap.get(b.u)!.push(b);
}

function getFallbackBang(): string {
  const url = new URL(window.location.href);
  const sParam = url.searchParams.get("s")?.toLowerCase().trim();
  
  if (sParam) {
    const found = SEARCH_ENGINES.find(
      (e) => e.alias.includes(sParam) || e.bang === sParam
    );
    if (found) {
      return found.bang;
    }
    const foundBang = bangs.find((b) => b.t === sParam);
    if (foundBang) {
      return foundBang.t;
    }
    if (sParam === "kagi") {
      return "kagi";
    }
  }
  
  return localStorage.getItem("default-bang") ?? "bang";
}

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const currentBang = localStorage.getItem("default-bang") ?? "ddg";
  
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;">
      <div class="content-container">
        <h1>b@ng</h1>
        <p>Fix <a href="https://duckduckgo.com/bang.html" target="_blank">duckduckgo</a> and <a href="https://unduck.link/" target="_blank">theo unduck</a> bangs because <a href="https://project-imas.wiki/" target="_blank">imas wiki</a> using worng one + add additional search fallback. Search bangs via <a href="/?q=!help">b@ng Directory</a>.</p>
        
        <div class="engine-select-container">
          <label for="engine-select" class="engine-select-label">Default Search Engine</label>
          <div class="engine-select-wrapper">
            <select id="engine-select" class="engine-select">
              <optgroup label="Private Search (Recommended)">
                <option value="ddg" ${currentBang === "ddg" ? "selected" : ""}>DuckDuckGo</option>
                <option value="brave" ${currentBang === "brave" ? "selected" : ""}>Brave</option>
                <option value="sp" ${currentBang === "sp" ? "selected" : ""}>Startpage</option>
                <option value="kagi" ${currentBang === "kagi" ? "selected" : ""}>Kagi</option>
              </optgroup>
              <optgroup label="Other Search Engines">
                <option value="g" ${currentBang === "g" ? "selected" : ""}>Google</option>
                <option value="bing" ${currentBang === "bing" ? "selected" : ""}>Bing</option>
                <option value="y" ${currentBang === "y" ? "selected" : ""}>Yahoo</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="https://unduck.link?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
      </div>
      <footer class="footer">
        <a href="https://link.futami.my.id" target="_blank">futami link</a>
        •
        <a href="https://youtube.com/@futamiid" target="_blank">youtube</a>
        •
        <a href="https://tiktok.com/@futamiid" target="_blank">tiktok</a>
        •
        <a href="https://link.futami.my.id/donate" target="_blank">donate</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  const engineSelect = app.querySelector<HTMLSelectElement>("#engine-select")!;

  const updateUrlInput = () => {
    const selectedBang = engineSelect.value;
    const selectedEngine = SEARCH_ENGINES.find(e => e.bang === selectedBang);
    const alias = selectedEngine ? selectedEngine.alias[0] : "duckduckgo";
    const host = window.location.origin;
    
    if (alias === "duckduckgo") {
      urlInput.value = `${host}?q=%s`;
    } else {
      urlInput.value = `${host}?q=%s&s=${alias}`;
    }
  };

  // Set initial value
  updateUrlInput();

  engineSelect.addEventListener("change", () => {
    localStorage.setItem("default-bang", engineSelect.value);
    updateUrlInput();
  });

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });
}

function renderHelpPage(initialSearchTerm: string) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; min-height: 100vh; width: 100%; padding: 40px 20px 80px 20px; box-sizing: border-box;">
      <div class="help-container">
        <div class="help-header">
          <h1 class="help-title">b@ng Directory</h1>
          <p class="help-subtitle">Search and find shortcuts from 122,000+ available bangs.</p>
        </div>
        
        <div class="help-search-wrapper">
          <input 
            type="text" 
            class="help-search-input" 
            placeholder="Search bangs (e.g., maps, gweb, gpt, youtube)..." 
            value="${escapeHtml(initialSearchTerm)}"
            autofocus
          />
        </div>
        
        <div class="help-results-info"></div>
        
        <div class="help-results-list"></div>
        
        <a href="/" class="help-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Home
        </a>
        
        <footer class="help-footer">
          <a href="https://link.futami.my.id" target="_blank">futami link</a>
          •
          <a href="https://youtube.com/@futamiid" target="_blank">youtube</a>
          •
          <a href="https://tiktok.com/@futamiid" target="_blank">tiktok</a>
          •
          <a href="https://link.futami.my.id/donate" target="_blank">donate</a>
        </footer>
      </div>
    </div>
  `;

  const searchInput = app.querySelector<HTMLInputElement>(".help-search-input")!;
  const resultsInfo = app.querySelector<HTMLDivElement>(".help-results-info")!;
  const resultsList = app.querySelector<HTMLDivElement>(".help-results-list")!;

  let currentResults: typeof bangs = [];
  let itemPositions: { top: number; height: number }[] = [];
  let totalHeight = 0;

  const searchBangs = (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return bangs;
    }
    
    const matched = [];
    const exactTagMatch = bangs.find(b => b.t.toLowerCase() === q);
    if (exactTagMatch) {
      matched.push(exactTagMatch);
    }
    
    for (let i = 0; i < bangs.length; i++) {
      const b = bangs[i];
      if (exactTagMatch && b.t === exactTagMatch.t) continue;
      
      if (b.t.toLowerCase().includes(q) || b.s.toLowerCase().includes(q) || b.d.toLowerCase().includes(q)) {
        matched.push(b);
      }
    }
    return matched;
  };

  const calculatePositions = () => {
    itemPositions = [];
    let currentTop = 8;
    for (let i = 0; i < currentResults.length; i++) {
      const b = currentResults[i];
      const allWithSameUrl = urlToBangsMap.get(b.u) || [];
      const alternatives = allWithSameUrl.filter(alt => alt.t !== b.t);
      
      const height = alternatives.length > 0 ? 82 : 58;
      itemPositions.push({ top: currentTop, height: height });
      currentTop += height + 8;
    }
    totalHeight = currentTop;
  };

  const renderVisibleItems = () => {
    const scrollTop = resultsList.scrollTop;
    const containerHeight = resultsList.clientHeight || 500;
    
    let startIndex = 0;
    let endIndex = currentResults.length;
    
    for (let i = 0; i < itemPositions.length; i++) {
      const pos = itemPositions[i];
      if (pos.top + pos.height >= scrollTop) {
        startIndex = Math.max(0, i - 2);
        break;
      }
    }
    
    for (let i = startIndex; i < itemPositions.length; i++) {
      const pos = itemPositions[i];
      if (pos.top > scrollTop + containerHeight) {
        endIndex = Math.min(currentResults.length, i + 2);
        break;
      }
    }
    
    let html = `<div style="height: ${totalHeight}px; position: relative; width: 100%;">`;
    
    for (let i = startIndex; i < endIndex; i++) {
      const b = currentResults[i];
      const pos = itemPositions[i];
      const allWithSameUrl = urlToBangsMap.get(b.u) || [];
      const alternatives = allWithSameUrl.filter(alt => alt.t !== b.t);
      
      const alternativesHtml = alternatives.length > 0
        ? `<div class="help-result-alternatives">
             <span>Alternatives:</span>
             ${alternatives.slice(0, 10).map(alt => `<a href="/?q=!${encodeURIComponent(alt.t)}" class="help-result-alternative-badge">!${escapeHtml(alt.t)}</a>`).join("")}
             ${alternatives.length > 10 ? `<span style="font-size: 11px; color: #6b7280; font-weight: 500;">+${alternatives.length - 10} more</span>` : ""}
           </div>`
        : "";

      html += `
        <div class="help-result-item" style="position: absolute; top: ${pos.top}px; left: 8px; right: 8px; height: ${pos.height}px; display: flex; flex-direction: column; justify-content: center; gap: 4px; box-sizing: border-box; margin: 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div class="help-result-left">
              <div class="help-result-header-row">
                <span class="help-result-tag">!${escapeHtml(b.t)}</span>
                <span class="help-result-name">${escapeHtml(b.s)}</span>
              </div>
              <span class="help-result-domain">${escapeHtml(b.d)}</span>
            </div>
            <div class="help-result-right">
              <span class="help-result-category">${escapeHtml(b.c || 'General')}</span>
              <a href="/?q=!${encodeURIComponent(b.t)}" class="help-result-action">Go to site →</a>
            </div>
          </div>
          ${alternativesHtml}
        </div>
      `;
    }
    
    html += `</div>`;
    resultsList.innerHTML = html;
  };

  const updateResults = () => {
    const query = searchInput.value;
    const rawResults = searchBangs(query);
    
    // De-duplicate by URL to prevent showing the same redirect multiple times as main results
    const renderedUrls = new Set<string>();
    currentResults = [];
    
    for (let i = 0; i < rawResults.length; i++) {
      const b = rawResults[i];
      if (!renderedUrls.has(b.u)) {
        renderedUrls.add(b.u);
        currentResults.push(b);
      }
    }
    
    // Reset scroll top when query changes
    resultsList.scrollTop = 0;
    
    if (currentResults.length === 0) {
      resultsInfo.textContent = "No bangs found";
      resultsList.innerHTML = `
        <div class="help-no-results">
          No bangs match "<strong>${escapeHtml(query)}</strong>". Try searching for something else.
        </div>
      `;
      return;
    }
    
    resultsInfo.textContent = query.trim() 
      ? `Showing ${currentResults.length} results for "${query}"`
      : `Showing all ${currentResults.length} available bangs`;

    calculatePositions();
    renderVisibleItems();
  };

  // Move cursor to the end of the text in input
  const val = searchInput.value;
  searchInput.value = '';
  searchInput.value = val;
  
  // Initial update
  updateResults();

  // Add event listeners
  searchInput.addEventListener("input", updateResults);
  resultsList.addEventListener("scroll", renderVisibleItems);
}

// Helper to escape HTML to prevent XSS
function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function render404Page(bangToken: string, query: string) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  
  const fallbackBang = getFallbackBang();
  const fallbackEngine = SEARCH_ENGINES.find(e => e.bang === fallbackBang) ?? SEARCH_ENGINES[0];
  const selectedBang = bangs.find(b => b.t === fallbackBang) || (fallbackBang === "kagi" ? kagiBang : undefined) || bangs.find(b => b.t === "ddg")!;
  
  const cleanQuery = query.trim();
  const searchUrl = selectedBang.u.replace(
    "{{{s}}}",
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
      <div class="content-container error-container">
        <div class="error-badge">404</div>
        <h1 class="error-title">Bang Not Found</h1>
        <p class="error-desc">We couldn't find the bang <code class="missing-bang">!${bangToken}</code> you were looking for.</p>
        
        <div class="error-actions">
          <a href="${searchUrl}" class="action-btn primary-btn">
            Search for "${cleanQuery}" on ${fallbackEngine.name}
          </a>
          <a href="/" class="action-btn secondary-btn">
            Back to homepage
          </a>
        </div>
        
        <p class="error-help">
          Want to find the right bang? Search the 
          <a href="/?q=!help">b@ng Search Directory</a>.
        </p>
      </div>
      <footer class="footer">
        <a href="https://link.futami.my.id" target="_blank">futami link</a>
        •
        <a href="https://youtube.com/@futamiid" target="_blank">youtube</a>
        •
        <a href="https://tiktok.com/@futamiid" target="_blank">tiktok</a>
        •
        <a href="https://link.futami.my.id/donate" target="_blank">donate</a>
      </footer>
    </div>
  `;
}

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    if (url.pathname === "/help" || url.pathname === "/bang") {
      renderHelpPage("");
      return null;
    }
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  
  if (bangCandidate === "help" || bangCandidate === "bang") {
    const cleanSearch = query.replace(/!(help|bang)\s*/i, "").replace(/\s*!(help|bang)/i, "").trim();
    renderHelpPage(cleanSearch);
    return null;
  }
  
  let selectedBang;
  if (bangCandidate) {
    selectedBang = bangs.find((b) => b.t === bangCandidate);
    if (!selectedBang) {
      render404Page(bangCandidate, query);
      return null;
    }
  } else {
    const fallbackBangToken = getFallbackBang();
    if (fallbackBangToken === "bang" || fallbackBangToken === "help") {
      renderHelpPage(query);
      return null;
    }
    selectedBang = bangs.find((b) => b.t === fallbackBangToken) || (fallbackBangToken === "kagi" ? kagiBang : undefined);
  }

  if (!selectedBang) return null;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "")
    return `https://${selectedBang.d}`;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  
  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
