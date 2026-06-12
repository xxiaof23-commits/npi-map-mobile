const BRAND_LABELS = ["曼牌 MF", "维克斯 WIX", "璞牌 PUROLATOR", "曼牌金标 MFPRO", "电商 MFB2B2C"];

let data = [];
const state = {
  selected: null,
  results: [],
  unlocked: false,
};

const familyCount = document.querySelector("#familyCount");
const searchInput = document.querySelector("#searchInput");
const clearButton = document.querySelector("#clearButton");
const resultList = document.querySelector("#resultList");
const emptyState = document.querySelector("#emptyState");
const detailView = document.querySelector("#detailView");
const detailTitle = document.querySelector("#detailTitle");
const matchBadge = document.querySelector("#matchBadge");
const summaryTr = document.querySelector("#summaryTr");
const summaryOe = document.querySelector("#summaryOe");
const summaryType = document.querySelector("#summaryType");
const summaryVehicle = document.querySelector("#summaryVehicle");
const brandGroups = document.querySelector("#brandGroups");
const unlockPanel = document.querySelector("#unlockPanel");
const passwordInput = document.querySelector("#passwordInput");
const unlockButton = document.querySelector("#unlockButton");
const unlockMessage = document.querySelector("#unlockMessage");

familyCount.textContent = "已加密";
searchInput.disabled = true;
clearButton.disabled = true;

function normalizeQuery(value) {
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function fallback(value) {
  return value || "空白";
}

async function unlockData() {
  const password = passwordInput.value;
  if (!password) {
    unlockMessage.textContent = "请输入访问密码。";
    return;
  }
  unlockButton.disabled = true;
  unlockMessage.textContent = "正在解锁...";
  try {
    const decrypted = await decryptEncryptedData(window.NPI_MAP_ENCRYPTED_DATA, password);
    data = JSON.parse(decrypted);
    state.unlocked = true;
    unlockPanel.classList.add("hidden");
    searchInput.disabled = false;
    clearButton.disabled = false;
    familyCount.textContent = `${data.length.toLocaleString("zh-CN")} 个产品族`;
    renderEmpty("输入任意产品号开始查询", "支持 TR、OE、品牌销售号、十位号关键词。");
    const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
    if (initialQuery) {
      searchInput.value = initialQuery;
      runSearch(initialQuery);
    } else {
      searchInput.focus();
    }
  } catch (error) {
    unlockMessage.textContent = "密码不正确，或加密数据文件无效。";
  } finally {
    unlockButton.disabled = false;
  }
}

async function decryptEncryptedData(payload, password) {
  if (!payload || !payload.ciphertext) {
    throw new Error("missing encrypted payload");
  }
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);
  const expectedMac = base64ToBytes(payload.mac);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: payload.iterations || 210000,
      hash: "SHA-256",
    },
    keyMaterial,
    512
  );
  const keyBytes = new Uint8Array(bits);
  const aesKey = await crypto.subtle.importKey("raw", keyBytes.slice(0, 32), "AES-CBC", false, ["decrypt"]);
  const macKey = await crypto.subtle.importKey("raw", keyBytes.slice(32), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", macKey, concatBytes(salt, iv, ciphertext)));
  if (!constantTimeEqual(mac, expectedMac)) {
    throw new Error("invalid password");
  }
  const plain = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, aesKey, ciphertext);
  return new TextDecoder().decode(plain);
}

function runSearch(query) {
  if (!state.unlocked) {
    return;
  }
  const normalized = normalizeQuery(query);
  if (!normalized) {
    state.results = [];
    state.selected = null;
    renderResults();
    renderEmpty("输入任意产品号开始查询", "支持 TR、OE、品牌销售号、十位号关键词。");
    return;
  }

  state.results = data
    .filter((record) => normalizeQuery(record.searchText).includes(normalized))
    .slice(0, 50);
  state.selected = state.results[0] || null;
  renderResults();

  if (state.selected) {
    renderDetail(state.selected, query);
  } else {
    renderEmpty("没有找到匹配产品族", `当前查询：${query}`);
  }
}

function renderResults() {
  resultList.innerHTML = "";
  if (!state.results.length) {
    return;
  }

  state.results.forEach((record, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `result-chip${record === state.selected ? " active" : ""}`;
    button.innerHTML = `
      <span class="result-id">${escapeHtml(record.id || "产品族")}</span>
      <span class="result-meta">${escapeHtml(compactSummary(record))}</span>
    `;
    button.addEventListener("click", () => {
      state.selected = state.results[index];
      renderResults();
      renderDetail(state.selected, searchInput.value);
    });
    resultList.appendChild(button);
  });
}

function renderEmpty(title, text) {
  emptyState.classList.remove("hidden");
  detailView.classList.add("hidden");
  emptyState.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(text)}</span>
  `;
}

function renderDetail(record, query) {
  emptyState.classList.add("hidden");
  detailView.classList.remove("hidden");
  const summary = record.summary || {};
  detailTitle.textContent = record.id || "产品族";
  matchBadge.textContent = query ? `匹配：${query}` : "已匹配";
  summaryTr.textContent = [summary.tr1, summary.tr2].filter(Boolean).join(" / ") || "空白";
  summaryOe.textContent = fallback(summary.oe);
  summaryType.textContent = fallback(summary.productType);
  summaryVehicle.textContent = fallback(summary.vehicle);
  renderGroups(record.groups || []);
}

function renderGroups(groups) {
  brandGroups.innerHTML = "";
  BRAND_LABELS
    .map((label) => groups.find((group) => group.label === label))
    .filter(Boolean)
    .forEach((group) => {
      const section = document.createElement("section");
      section.className = "brand-group";
      const items = group.items || [];
      section.innerHTML = `
        <div class="brand-title">
          <span>${escapeHtml(group.label)}</span>
          <small>${items.length} 个销售号</small>
        </div>
      `;

      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "product-row";
        row.innerHTML = `
          <div class="product-main">
            <span class="slot">${escapeHtml(item.slot || "位置")}</span>
            <strong>${escapeHtml(item.salesNo || "空白")}</strong>
          </div>
          <div class="product-meta">
            <span>状态 / 十位号：${escapeHtml(fallback(item.status))} / ${escapeHtml(fallback(item.tenDigit))}</span>
            <span>建议图纸名：${escapeHtml(item.drawingName || "空白")}</span>
          </div>
          ${item.drawingName ? `<button class="copy-button" type="button" data-copy="${escapeHtml(item.drawingName)}">复制图纸名</button>` : ""}
        `;
        section.appendChild(row);
      });

      brandGroups.appendChild(section);
    });
}

function compactSummary(record) {
  const summary = record.summary || {};
  return [summary.tr1, summary.tr2, summary.oe, summary.productType].filter(Boolean).join(" | ") || "无概要信息";
}

function copyValue(value, button) {
  const oldText = button.textContent;
  const done = () => {
    button.textContent = "已复制";
    window.setTimeout(() => {
      button.textContent = oldText;
    }, 1200);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(value).then(done).catch(() => fallbackCopy(value, done));
    return;
  }
  fallbackCopy(value, done);
}

function fallbackCopy(value, done) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  done();
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value || ""), (char) => char.charCodeAt(0));
}

function concatBytes(...chunks) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

unlockButton.addEventListener("click", unlockData);
passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    unlockData();
  }
});
searchInput.addEventListener("input", (event) => runSearch(event.target.value));
clearButton.addEventListener("click", () => {
  searchInput.value = "";
  runSearch("");
  searchInput.focus();
});

document.querySelectorAll("[data-query]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!state.unlocked) {
      passwordInput.focus();
      unlockMessage.textContent = "请先输入访问密码。";
      return;
    }
    searchInput.value = button.dataset.query || "";
    runSearch(searchInput.value);
  });
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".copy-button");
  if (button) {
    copyValue(button.dataset.copy || "", button);
  }
});
