(function () {
  "use strict";

  const STORAGE_KEY = "receipt-ledger-records-v1";

  const categories = [
    {
      id: "food",
      label: "食費",
      color: "#2d8a54",
      keywords: [
        "米",
        "パン",
        "牛乳",
        "卵",
        "肉",
        "魚",
        "野菜",
        "果物",
        "弁当",
        "惣菜",
        "飲料",
        "お茶",
        "コーヒー",
        "食品",
        "スーパー",
        "ランチ",
        "カフェ",
        "ビール",
        "酒",
        "菓子",
        "ヨーグルト",
        "麺",
        "カレー",
        "サラダ",
      ],
    },
    {
      id: "daily",
      label: "日用品",
      color: "#6b7f31",
      keywords: [
        "洗剤",
        "ティッシュ",
        "トイレット",
        "シャンプー",
        "石鹸",
        "歯磨",
        "歯ブラシ",
        "電池",
        "文具",
        "ゴミ袋",
        "掃除",
        "日用品",
        "マスク",
      ],
    },
    {
      id: "entertainment",
      label: "娯楽費",
      color: "#7c5ab5",
      keywords: [
        "映画",
        "ゲーム",
        "本",
        "書籍",
        "漫画",
        "まんが",
        "カラオケ",
        "チケット",
        "ライブ",
        "音楽",
        "配信",
        "玩具",
      ],
    },
    {
      id: "social",
      label: "交際費",
      color: "#d9604c",
      keywords: [
        "ギフト",
        "プレゼント",
        "花",
        "居酒屋",
        "飲み",
        "会食",
        "手土産",
        "贈答",
        "パーティ",
      ],
    },
    {
      id: "utilities",
      label: "光熱費",
      color: "#c9851f",
      keywords: [
        "電気",
        "ガス",
        "水道",
        "電力",
        "灯油",
        "通信",
        "携帯",
        "インターネット",
        "電話",
      ],
    },
    {
      id: "transport",
      label: "交通費",
      color: "#2878a8",
      keywords: [
        "電車",
        "バス",
        "タクシー",
        "交通",
        "運賃",
        "駐車",
        "高速",
        "ガソリン",
        "切符",
        "定期",
      ],
    },
    {
      id: "medical",
      label: "医療費",
      color: "#b44d82",
      keywords: [
        "薬",
        "病院",
        "クリニック",
        "処方",
        "医療",
        "診療",
        "歯科",
        "ドラッグ",
        "サプリ",
      ],
    },
    {
      id: "clothing",
      label: "衣服",
      color: "#8b6842",
      keywords: [
        "服",
        "シャツ",
        "靴",
        "衣料",
        "ユニクロ",
        "GU",
        "帽子",
        "バッグ",
        "下着",
      ],
    },
    {
      id: "other",
      label: "その他",
      color: "#707771",
      keywords: [],
    },
  ];

  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const state = {
    records: loadRecords(),
    pending: [],
    imageDataUrl: "",
    stream: null,
  };

  const dom = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    populateCategorySelects();
    dom.manualDate.value = todayString();
    bindEvents();
    renderPending();
    renderLedger();
    setStatus("待機中");
    renderIcons();
  }

  function cacheDom() {
    [
      "exportCsvButton",
      "importCsvInput",
      "ocrStatus",
      "cameraPreview",
      "receiptPreview",
      "emptyPreview",
      "startCameraButton",
      "captureButton",
      "receiptImageInput",
      "runOcrButton",
      "ocrMeterBar",
      "ocrText",
      "parseTextButton",
      "clearScanButton",
      "manualEntryForm",
      "manualDate",
      "manualName",
      "manualPrice",
      "manualCategory",
      "pendingTotal",
      "pendingList",
      "savePendingButton",
      "visibleTotal",
      "summaryStrip",
      "filterFrom",
      "filterTo",
      "filterCategory",
      "filterKeyword",
      "sortMode",
      "resetFiltersButton",
      "ledgerList",
    ].forEach((id) => {
      dom[id] = document.getElementById(id);
    });

    dom.cameraStage = document.querySelector(".camera-stage");
  }

  function bindEvents() {
    dom.startCameraButton.addEventListener("click", startCamera);
    dom.captureButton.addEventListener("click", captureFrame);
    dom.receiptImageInput.addEventListener("change", loadImageFile);
    dom.runOcrButton.addEventListener("click", runOcr);
    dom.parseTextButton.addEventListener("click", parseCurrentText);
    dom.clearScanButton.addEventListener("click", clearScan);
    dom.manualEntryForm.addEventListener("submit", addManualPending);
    dom.savePendingButton.addEventListener("click", savePending);
    dom.exportCsvButton.addEventListener("click", exportCsv);
    dom.importCsvInput.addEventListener("change", importCsv);
    dom.pendingList.addEventListener("input", updatePendingFromInput);
    dom.pendingList.addEventListener("change", updatePendingFromInput);
    dom.pendingList.addEventListener("click", removePendingFromButton);
    dom.ledgerList.addEventListener("change", updateRecordFromInput);
    dom.ledgerList.addEventListener("click", removeRecordFromButton);

    [
      dom.filterFrom,
      dom.filterTo,
      dom.filterCategory,
      dom.filterKeyword,
      dom.sortMode,
    ].forEach((control) => control.addEventListener("input", renderLedger));

    dom.resetFiltersButton.addEventListener("click", resetFilters);
  }

  function populateCategorySelects() {
    fillCategorySelect(dom.manualCategory);
    fillCategorySelect(dom.filterCategory, true);
  }

  function fillCategorySelect(select, includeAll) {
    select.replaceChildren();

    if (includeAll) {
      const option = document.createElement("option");
      option.value = "all";
      option.textContent = "すべて";
      select.appendChild(option);
    }

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.label;
      select.appendChild(option);
    });
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("カメラ不可");
      return;
    }

    try {
      stopCamera();
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
        audio: false,
      });
      dom.cameraPreview.srcObject = state.stream;
      dom.cameraPreview.classList.add("is-active");
      dom.receiptPreview.classList.remove("is-active");
      dom.cameraStage.classList.add("has-camera");
      dom.cameraStage.classList.remove("has-image");
      dom.captureButton.disabled = false;
      setStatus("カメラ中");
    } catch (error) {
      console.error(error);
      setStatus("許可が必要");
    }
  }

  function captureFrame() {
    if (!state.stream || !dom.cameraPreview.videoWidth) {
      setStatus("撮影不可");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = dom.cameraPreview.videoWidth;
    canvas.height = dom.cameraPreview.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(dom.cameraPreview, 0, 0, canvas.width, canvas.height);
    setReceiptImage(canvas.toDataURL("image/jpeg", 0.92));
    stopCamera();
    setStatus("撮影済み");
  }

  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }

    if (dom.cameraPreview) {
      dom.cameraPreview.srcObject = null;
      dom.cameraPreview.classList.remove("is-active");
    }

    if (dom.cameraStage) {
      dom.cameraStage.classList.remove("has-camera");
    }

    if (dom.captureButton) {
      dom.captureButton.disabled = true;
    }
  }

  function loadImageFile(event) {
    const [file] = event.target.files;
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setReceiptImage(String(reader.result));
      setStatus("画像あり");
    });
    reader.readAsDataURL(file);
  }

  function setReceiptImage(dataUrl) {
    state.imageDataUrl = dataUrl;
    dom.receiptPreview.src = dataUrl;
    dom.receiptPreview.classList.add("is-active");
    dom.cameraStage.classList.add("has-image");
    dom.cameraStage.classList.remove("has-camera");
    dom.runOcrButton.disabled = false;
    setMeter(0);
  }

  async function runOcr() {
    if (!state.imageDataUrl) {
      setStatus("画像なし");
      return;
    }

    if (!window.Tesseract || !window.Tesseract.recognize) {
      setStatus("OCR未読込");
      dom.ocrText.value = "OCRライブラリを読み込めませんでした。画像を見ながらここに購入日、品目名、値段を入力してください。";
      return;
    }

    try {
      dom.runOcrButton.disabled = true;
      setMeter(4);
      setStatus("読取中");

      const result = await window.Tesseract.recognize(state.imageDataUrl, "jpn+eng", {
        logger(message) {
          if (message.status === "recognizing text" && Number.isFinite(message.progress)) {
            setMeter(Math.round(message.progress * 100));
          } else if (message.status) {
            setStatus(shortOcrStatus(message.status));
          }
        },
      });

      const text = result && result.data && result.data.text ? result.data.text.trim() : "";
      dom.ocrText.value = text;
      setMeter(100);
      setStatus(text ? "読取完了" : "文字なし");
      if (text) {
        createPendingFromText(text);
      }
    } catch (error) {
      console.error(error);
      setStatus("読取失敗");
    } finally {
      dom.runOcrButton.disabled = !state.imageDataUrl;
    }
  }

  function shortOcrStatus(status) {
    const map = {
      "loading tesseract core": "準備中",
      "initializing tesseract": "初期化",
      "loading language traineddata": "辞書読込",
      "initializing api": "解析準備",
      "recognizing text": "読取中",
    };
    return map[status] || "処理中";
  }

  function parseCurrentText() {
    const text = dom.ocrText.value.trim();
    if (!text) {
      setStatus("文字なし");
      return;
    }
    createPendingFromText(text);
  }

  function createPendingFromText(text) {
    const parsed = parseReceiptText(text);
    if (parsed.length === 0) {
      setStatus("候補なし");
      return;
    }

    state.pending = parsed;
    renderPending();
    setStatus("候補作成");
  }

  function clearScan() {
    stopCamera();
    state.imageDataUrl = "";
    dom.receiptPreview.removeAttribute("src");
    dom.receiptPreview.classList.remove("is-active");
    dom.cameraStage.classList.remove("has-image");
    dom.ocrText.value = "";
    dom.receiptImageInput.value = "";
    dom.runOcrButton.disabled = true;
    setMeter(0);
    setStatus("待機中");
  }

  function addManualPending(event) {
    event.preventDefault();
    const name = dom.manualName.value.trim();
    const price = Number(dom.manualPrice.value);

    if (!name || !Number.isFinite(price) || price <= 0) {
      setStatus("入力確認");
      return;
    }

    state.pending.push({
      id: makeId(),
      date: dom.manualDate.value || todayString(),
      name,
      price: Math.round(price),
      category: dom.manualCategory.value || guessCategory(name),
    });

    dom.manualName.value = "";
    dom.manualPrice.value = "";
    dom.manualName.focus();
    renderPending();
    setStatus("候補追加");
  }

  function savePending() {
    if (state.pending.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const records = state.pending
      .filter((item) => item.name.trim() && Number(item.price) > 0)
      .map((item) => ({
        id: makeId(),
        date: item.date || todayString(),
        name: item.name.trim(),
        price: Math.round(Number(item.price)),
        category: categoryById.has(item.category) ? item.category : "other",
        createdAt: now,
      }));

    state.records = records.concat(state.records);
    state.pending = [];
    saveRecords();
    renderPending();
    renderLedger();
    setStatus("保存済み");
  }

  function parseReceiptText(text) {
    const normalized = normalizeText(text);
    const date = extractDate(normalized) || todayString();
    const seen = new Set();

    return normalized
      .split(/\r?\n/)
      .map((line) => parseItemLine(line, date))
      .filter(Boolean)
      .filter((item) => {
        const key = `${item.name}|${item.price}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .slice(0, 40);
  }

  function parseItemLine(rawLine, date) {
    const line = normalizeText(rawLine)
      .replace(/[|｜]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (line.length < 3 || looksLikeDateOrTime(line) || shouldSkipReceiptLine(line)) {
      return null;
    }

    const priceMatch = line.match(/(?:[¥￥]\s*)?([0-9][0-9,]{0,8})(?:\s*円)?\s*(?:税込|税抜|内)?\s*$/);
    if (!priceMatch || priceMatch.index === undefined) {
      return null;
    }

    const price = Number(priceMatch[1].replace(/,/g, ""));
    if (!Number.isFinite(price) || price <= 0 || price > 999999) {
      return null;
    }

    let name = line.slice(0, priceMatch.index).trim();
    name = cleanupItemName(name);

    if (!name || name.length < 2 || /^\d+$/.test(name) || shouldSkipReceiptLine(name)) {
      return null;
    }

    return {
      id: makeId(),
      date,
      name,
      price,
      category: guessCategory(name),
    };
  }

  function extractDate(text) {
    const normalized = normalizeText(text);
    const now = new Date();
    const currentYear = now.getFullYear();

    const eraMatch = normalized.match(/(?:令和|R)\s*(\d{1,2})\s*[年\/.\-]\s*(\d{1,2})\s*[月\/.\-]\s*(\d{1,2})/i);
    if (eraMatch) {
      return toDateInputValue(2018 + Number(eraMatch[1]), Number(eraMatch[2]), Number(eraMatch[3]));
    }

    const fullMatch = normalized.match(/((?:20)?\d{2})\s*[年\/.\-]\s*(\d{1,2})\s*[月\/.\-]\s*(\d{1,2})/);
    if (fullMatch) {
      const rawYear = Number(fullMatch[1]);
      const year = rawYear < 100 ? 2000 + rawYear : rawYear;
      return toDateInputValue(year, Number(fullMatch[2]), Number(fullMatch[3]));
    }

    const monthDayMatch = normalized.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (monthDayMatch) {
      let year = currentYear;
      const date = new Date(year, Number(monthDayMatch[1]) - 1, Number(monthDayMatch[2]));
      if (date.getTime() - now.getTime() > 1000 * 60 * 60 * 24 * 30) {
        year -= 1;
      }
      return toDateInputValue(year, Number(monthDayMatch[1]), Number(monthDayMatch[2]));
    }

    return "";
  }

  function toDateInputValue(year, month, day) {
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
      return "";
    }

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return "";
    }

    return [
      String(year).padStart(4, "0"),
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/[，、]/g, ",")
      .replace(/[−ー‐]/g, "-");
  }

  function cleanupItemName(name) {
    return normalizeText(name)
      .replace(/^[*＊・\-\s]+/, "")
      .replace(/\s*(x|X|×)\s*\d+.*$/, "")
      .replace(/\s+\d+\s*点$/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function looksLikeDateOrTime(line) {
    return (
      /\d{1,4}[\/.\-年]\d{1,2}[\/.\-月]\d{1,2}/.test(line) ||
      /\d{1,2}:\d{2}/.test(line) ||
      /^\d{2,4}[\/.\-]\d{1,2}$/.test(line)
    );
  }

  function shouldSkipReceiptLine(line) {
    return /合計|小計|総計|現計|お預|預り|預かり|釣|消費税|内税|外税|対象|レジ|領収|電話|TEL|クレジット|電子マネー|Suica|PayPay|WAON|nanaco|楽天|VISA|Master|現金|ポイント|クーポン|割引|残高|お買上|取引|承認|店舗|店番|担当|明細|単価/.test(
      line
    );
  }

  function guessCategory(name) {
    const normalized = normalizeText(name).toLowerCase();
    const match = categories.find((category) =>
      category.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
    );

    return match ? match.id : "other";
  }

  function renderPending() {
    dom.pendingTotal.textContent = formatYen(sumPrices(state.pending));
    dom.savePendingButton.disabled = state.pending.length === 0;
    dom.pendingList.replaceChildren();

    if (state.pending.length === 0) {
      dom.pendingList.appendChild(createEmptyState("OCRまたは手入力で登録候補を追加します。"));
      return;
    }

    state.pending.forEach((item) => {
      const row = document.createElement("div");
      row.className = "pending-row";
      row.dataset.id = item.id;

      row.appendChild(createInput("date", item.date, "date"));
      row.appendChild(createInput("name", item.name, "text"));
      row.appendChild(createInput("price", String(item.price), "number"));
      row.appendChild(createCategorySelect(item.category));
      row.appendChild(createRemoveButton("候補を削除"));

      dom.pendingList.appendChild(row);
    });

    renderIcons();
  }

  function renderLedger() {
    const visibleRecords = getVisibleRecords();
    const total = sumPrices(visibleRecords);
    dom.visibleTotal.textContent = formatYen(total);
    renderSummary(visibleRecords);
    renderLedgerRows(visibleRecords);
    renderIcons();
  }

  function renderSummary(records) {
    dom.summaryStrip.replaceChildren();

    const totals = new Map(categories.map((category) => [category.id, 0]));
    records.forEach((record) => {
      totals.set(record.category, (totals.get(record.category) || 0) + record.price);
    });

    categories
      .filter((category) => totals.get(category.id) > 0)
      .forEach((category) => {
        const item = document.createElement("div");
        item.className = "summary-item";
        item.style.setProperty("--category-color", category.color);

        const label = document.createElement("span");
        label.textContent = category.label;
        const value = document.createElement("strong");
        value.textContent = formatYen(totals.get(category.id));

        item.append(label, value);
        dom.summaryStrip.appendChild(item);
      });

    if (!dom.summaryStrip.children.length) {
      const item = document.createElement("div");
      item.className = "summary-item";
      item.style.setProperty("--category-color", "#707771");
      const label = document.createElement("span");
      label.textContent = "集計";
      const value = document.createElement("strong");
      value.textContent = "0円";
      item.append(label, value);
      dom.summaryStrip.appendChild(item);
    }
  }

  function renderLedgerRows(records) {
    dom.ledgerList.replaceChildren();

    if (records.length === 0) {
      dom.ledgerList.appendChild(createEmptyState("保存した支出がここに表示されます。"));
      return;
    }

    const shouldGroupByDate = dom.sortMode.value.startsWith("date");
    let lastDate = "";

    records.forEach((record) => {
      if (shouldGroupByDate && record.date !== lastDate) {
        lastDate = record.date;
        dom.ledgerList.appendChild(createDateGroup(record.date, records));
      }

      const row = document.createElement("div");
      row.className = "ledger-row";
      row.dataset.id = record.id;

      row.appendChild(createInput("date", record.date, "date"));
      row.appendChild(createInput("name", record.name, "text"));
      row.appendChild(createCategorySelect(record.category));
      row.appendChild(createInput("price", String(record.price), "number"));
      row.appendChild(createRemoveButton("明細を削除"));

      dom.ledgerList.appendChild(row);
    });
  }

  function createDateGroup(date, records) {
    const group = document.createElement("div");
    group.className = "date-group";

    const label = document.createElement("strong");
    label.textContent = formatDateLabel(date);

    const total = document.createElement("span");
    total.textContent = formatYen(
      records.filter((record) => record.date === date).reduce((sum, record) => sum + record.price, 0)
    );

    group.append(label, total);
    return group;
  }

  function createInput(field, value, type) {
    const input = document.createElement("input");
    input.dataset.field = field;
    input.value = value || "";
    input.type = type;

    if (type === "number") {
      input.min = "0";
      input.step = "1";
      input.inputMode = "numeric";
    }

    return input;
  }

  function createCategorySelect(value) {
    const select = document.createElement("select");
    select.dataset.field = "category";
    fillCategorySelect(select);
    select.value = categoryById.has(value) ? value : "other";
    return select;
  }

  function createRemoveButton(label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "row-remove";
    button.dataset.action = "remove";
    button.setAttribute("aria-label", label);
    button.title = label;

    const icon = document.createElement("i");
    icon.dataset.lucide = "trash-2";
    button.appendChild(icon);
    return button;
  }

  function createEmptyState(message) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = message;
    return empty;
  }

  function updatePendingFromInput(event) {
    const input = event.target.closest("[data-field]");
    const row = event.target.closest(".pending-row");
    if (!input || !row) {
      return;
    }

    const item = state.pending.find((pendingItem) => pendingItem.id === row.dataset.id);
    if (!item) {
      return;
    }

    item[input.dataset.field] = normalizeFieldValue(input.dataset.field, input.value);
    renderPendingTotalsOnly();
  }

  function renderPendingTotalsOnly() {
    dom.pendingTotal.textContent = formatYen(sumPrices(state.pending));
    dom.savePendingButton.disabled = state.pending.length === 0;
  }

  function removePendingFromButton(event) {
    const button = event.target.closest("[data-action='remove']");
    const row = event.target.closest(".pending-row");
    if (!button || !row) {
      return;
    }

    state.pending = state.pending.filter((item) => item.id !== row.dataset.id);
    renderPending();
  }

  function updateRecordFromInput(event) {
    const input = event.target.closest("[data-field]");
    const row = event.target.closest(".ledger-row");
    if (!input || !row) {
      return;
    }

    const record = state.records.find((item) => item.id === row.dataset.id);
    if (!record) {
      return;
    }

    record[input.dataset.field] = normalizeFieldValue(input.dataset.field, input.value);
    saveRecords();
    renderLedger();
  }

  function removeRecordFromButton(event) {
    const button = event.target.closest("[data-action='remove']");
    const row = event.target.closest(".ledger-row");
    if (!button || !row) {
      return;
    }

    state.records = state.records.filter((record) => record.id !== row.dataset.id);
    saveRecords();
    renderLedger();
    setStatus("削除済み");
  }

  function normalizeFieldValue(field, value) {
    if (field === "price") {
      const price = Number(value);
      return Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0;
    }

    if (field === "category") {
      return categoryById.has(value) ? value : "other";
    }

    return String(value || "").trim();
  }

  function getVisibleRecords() {
    const from = dom.filterFrom.value;
    const to = dom.filterTo.value;
    const category = dom.filterCategory.value;
    const keyword = normalizeText(dom.filterKeyword.value).toLowerCase();
    const sortMode = dom.sortMode.value;

    const filtered = state.records.filter((record) => {
      if (from && record.date < from) {
        return false;
      }
      if (to && record.date > to) {
        return false;
      }
      if (category !== "all" && record.category !== category) {
        return false;
      }
      if (keyword && !normalizeText(record.name).toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });

    return filtered.sort((a, b) => compareRecords(a, b, sortMode));
  }

  function compareRecords(a, b, sortMode) {
    const categoryA = categoryById.get(a.category)?.label || "";
    const categoryB = categoryById.get(b.category)?.label || "";

    switch (sortMode) {
      case "date-asc":
        return a.date.localeCompare(b.date) || a.name.localeCompare(b.name, "ja");
      case "category-asc":
        return (
          categoryA.localeCompare(categoryB, "ja") ||
          a.date.localeCompare(b.date) ||
          a.name.localeCompare(b.name, "ja")
        );
      case "price-desc":
        return b.price - a.price || b.date.localeCompare(a.date);
      case "price-asc":
        return a.price - b.price || b.date.localeCompare(a.date);
      case "name-asc":
        return a.name.localeCompare(b.name, "ja") || b.date.localeCompare(a.date);
      case "date-desc":
      default:
        return b.date.localeCompare(a.date) || a.name.localeCompare(b.name, "ja");
    }
  }

  function resetFilters() {
    dom.filterFrom.value = "";
    dom.filterTo.value = "";
    dom.filterCategory.value = "all";
    dom.filterKeyword.value = "";
    dom.sortMode.value = "date-desc";
    renderLedger();
  }

  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((record) => ({
          id: record.id || makeId(),
          date: record.date || todayString(),
          name: String(record.name || "").trim(),
          price: Math.max(0, Math.round(Number(record.price) || 0)),
          category: categoryById.has(record.category) ? record.category : "other",
          createdAt: record.createdAt || new Date().toISOString(),
        }))
        .filter((record) => record.name && record.price > 0);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function saveRecords() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
    } catch (error) {
      console.error(error);
      setStatus("保存失敗");
    }
  }

  function exportCsv() {
    if (state.records.length === 0) {
      setStatus("出力なし");
      return;
    }

    const rows = [
      ["購入日", "分類", "購入品目名", "値段", "登録日時"],
      ...state.records.map((record) => [
        record.date,
        categoryById.get(record.category)?.label || "その他",
        record.name,
        String(record.price),
        record.createdAt || "",
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `receipt-ledger-${todayString()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus("CSV出力");
  }

  function importCsv(event) {
    const [file] = event.target.files;
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imported = csvToRecords(String(reader.result || ""));
      if (imported.length) {
        state.records = imported.concat(state.records);
        saveRecords();
        renderLedger();
        setStatus("CSV取込");
      } else {
        setStatus("取込なし");
      }
      event.target.value = "";
    });
    reader.readAsText(file, "utf-8");
  }

  function csvToRecords(csv) {
    const rows = parseCsvRows(csv.replace(/^\uFEFF/, ""));
    if (rows.length < 2) {
      return [];
    }

    const headers = rows[0].map((header) => normalizeText(header).trim());
    const indexes = {
      date: findHeader(headers, ["購入日", "日付", "date"]),
      category: findHeader(headers, ["分類", "カテゴリ", "category"]),
      name: findHeader(headers, ["購入品目名", "品目", "商品名", "name"]),
      price: findHeader(headers, ["値段", "金額", "price"]),
      createdAt: findHeader(headers, ["登録日時", "createdAt"]),
    };

    return rows
      .slice(1)
      .map((row) => {
        const name = String(row[indexes.name] || "").trim();
        const price = Number(String(row[indexes.price] || "").replace(/[^\d]/g, ""));
        const category = categoryFromLabel(String(row[indexes.category] || ""));
        return {
          id: makeId(),
          date: row[indexes.date] || todayString(),
          name,
          price,
          category,
          createdAt: row[indexes.createdAt] || new Date().toISOString(),
        };
      })
      .filter((record) => record.name && Number.isFinite(record.price) && record.price > 0);
  }

  function parseCsvRows(csv) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let index = 0; index < csv.length; index += 1) {
      const char = csv[index];
      const next = csv[index + 1];

      if (char === '"' && inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") {
          index += 1;
        }
        row.push(cell);
        if (row.some((value) => value.trim())) {
          rows.push(row);
        }
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell);
    if (row.some((value) => value.trim())) {
      rows.push(row);
    }

    return rows;
  }

  function findHeader(headers, names) {
    const index = headers.findIndex((header) =>
      names.some((name) => header.toLowerCase() === String(name).toLowerCase())
    );
    return index >= 0 ? index : 0;
  }

  function categoryFromLabel(value) {
    const normalized = normalizeText(value).trim();
    const match = categories.find((category) => category.id === normalized || category.label === normalized);
    return match ? match.id : "other";
  }

  function escapeCsv(value) {
    const text = String(value ?? "");
    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function sumPrices(items) {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }

  function formatYen(value) {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function formatDateLabel(value) {
    if (!value) {
      return "日付未設定";
    }

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  }

  function todayString() {
    const now = new Date();
    return [
      String(now.getFullYear()).padStart(4, "0"),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function makeId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function setStatus(text) {
    dom.ocrStatus.textContent = text;
  }

  function setMeter(percent) {
    dom.ocrMeterBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  function renderIcons() {
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
      return;
    }

    document.querySelectorAll("[data-lucide]").forEach((icon) => {
      if (!icon.textContent) {
        icon.textContent = " ";
      }
    });
  }
})();
