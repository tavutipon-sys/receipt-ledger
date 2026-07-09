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
  const recordTypes = [
    { id: "expense", label: "支出", color: "#d9604c" },
    { id: "income", label: "収入", color: "#16756f" },
  ];
  const recordTypeById = new Map(recordTypes.map((type) => [type.id, type]));
  const chartPalette = [
    "#16756f",
    "#d9604c",
    "#2878a8",
    "#c9851f",
    "#7c5ab5",
    "#6b7f31",
    "#b44d82",
    "#8b6842",
    "#707771",
  ];

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
      "manualType",
      "manualDate",
      "manualStore",
      "manualName",
      "manualPrice",
      "manualCategory",
      "pendingTotal",
      "pendingList",
      "savePendingButton",
      "visibleTotal",
      "summaryStrip",
      "filterType",
      "filterFrom",
      "filterTo",
      "filterCategory",
      "filterKeyword",
      "sortMode",
      "resetFiltersButton",
      "ledgerList",
      "trendMode",
      "trendYear",
      "pieMode",
      "trendChart",
      "trendChartTotal",
      "pieChart",
      "pieLegend",
      "itemRanking",
      "analyticsTab",
      "ledgerTab",
      "analyticsPanel",
      "ledgerPanel",
    ].forEach((id) => {
      dom[id] = document.getElementById(id);
    });

    dom.cameraStage = document.querySelector(".camera-stage");
    dom.viewTabs = Array.from(document.querySelectorAll("[data-view-tab]"));
    dom.viewPanels = Array.from(document.querySelectorAll("[data-view-panel]"));
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
      dom.filterType,
      dom.filterFrom,
      dom.filterTo,
      dom.filterCategory,
      dom.filterKeyword,
      dom.sortMode,
    ].forEach((control) => control.addEventListener("input", renderLedger));

    dom.resetFiltersButton.addEventListener("click", resetFilters);
    dom.trendMode.addEventListener("input", renderLedger);
    dom.trendYear.addEventListener("input", renderLedger);
    dom.pieMode.addEventListener("input", renderLedger);
    dom.viewTabs.forEach((tab) => {
      tab.addEventListener("click", () => setActiveView(tab.dataset.viewTab));
    });
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

  function setActiveView(view) {
    const activeView = view === "ledger" ? "ledger" : "analytics";

    dom.viewTabs.forEach((tab) => {
      const isActive = tab.dataset.viewTab === activeView;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    dom.viewPanels.forEach((panel) => {
      const isActive = panel.dataset.viewPanel === activeView;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
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
    const type = dom.manualType.value === "income" ? "income" : "expense";
    const store = dom.manualStore.value.trim();
    const name = dom.manualName.value.trim();
    const price = Number(dom.manualPrice.value);

    if (!name || !Number.isFinite(price) || price <= 0) {
      setStatus("入力確認");
      return;
    }

    state.pending.push({
      id: makeId(),
      type,
      date: dom.manualDate.value || todayString(),
      store,
      name,
      price: Math.round(price),
      category: dom.manualCategory.value || guessCategory(name),
    });

    dom.manualStore.value = "";
    dom.manualName.value = "";
    dom.manualPrice.value = "";
    dom.manualStore.focus();
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
        type: item.type === "income" ? "income" : "expense",
        date: item.date || todayString(),
        store: String(item.store || "").trim(),
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
    const store = extractStoreName(normalized);
    const seen = new Set();

    return normalized
      .split(/\r?\n/)
      .map((line) => parseItemLine(line, date, store))
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

  function parseItemLine(rawLine, date, store) {
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

    if (!name || /^\d+$/.test(name) || shouldSkipReceiptLine(name)) {
      return null;
    }

    return {
      id: makeId(),
      type: "expense",
      date,
      store,
      name,
      price,
      category: guessCategory(name),
    };
  }

  function extractStoreName(text) {
    const lines = normalizeText(text)
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    for (const line of lines.slice(0, 10)) {
      const labeled = line.match(/(?:店名|店舗名|利用店舗|ご利用店|販売店)\s*[:：]?\s*(.+)$/);
      if (labeled) {
        const store = cleanupStoreName(labeled[1]);
        if (store) {
          return store;
        }
      }

      if (
        line.length < 2 ||
        line.length > 32 ||
        looksLikeDateOrTime(line) ||
        /(?:[¥￥]\s*)?[0-9][0-9,]{0,8}(?:\s*円)?\s*$/.test(line) ||
        shouldSkipReceiptLine(line) ||
        /住所|所在地|〒|http|www\.|@|No\.|NO\.|レシート/i.test(line)
      ) {
        continue;
      }

      return cleanupStoreName(line);
    }

    return "";
  }

  function cleanupStoreName(value) {
    return normalizeText(value)
      .replace(/^[*＊・\-\s]+/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 32);
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
      .replace(/[−‐‑‒–—―]/g, "-");
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
    dom.pendingTotal.textContent = formatYen(sumSigned(state.pending));
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

      row.appendChild(createTypeSelect(item.type));
      row.appendChild(createInput("date", item.date, "date"));
      row.appendChild(createInput("store", item.store || "", "text"));
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
    dom.visibleTotal.textContent = formatYen(sumSigned(visibleRecords));
    renderSummary(visibleRecords);
    renderAnalytics(visibleRecords);
    renderLedgerRows(visibleRecords);
    renderIcons();
  }

  function renderSummary(records) {
    dom.summaryStrip.replaceChildren();

    const incomeTotal = sumPrices(records.filter(isIncome));
    const expenseRecords = records.filter(isExpense);
    const expenseTotal = sumPrices(expenseRecords);
    const balance = incomeTotal - expenseTotal;

    appendSummaryItem("収入", incomeTotal, "#16756f");
    appendSummaryItem("支出", expenseTotal, "#d9604c");
    appendSummaryItem("収支", balance, balance >= 0 ? "#2878a8" : "#c9851f");

    const totals = new Map(categories.map((category) => [category.id, 0]));
    expenseRecords.forEach((record) => {
      totals.set(record.category, (totals.get(record.category) || 0) + record.price);
    });

    categories
      .filter((category) => totals.get(category.id) > 0)
      .forEach((category) => {
        appendSummaryItem(category.label, totals.get(category.id), category.color);
      });
  }

  function appendSummaryItem(labelText, amount, color) {
    const item = document.createElement("div");
    item.className = "summary-item";
    item.style.setProperty("--category-color", color);

    const label = document.createElement("span");
    label.textContent = labelText;
    const value = document.createElement("strong");
    value.textContent = formatYen(amount);

    item.append(label, value);
    dom.summaryStrip.appendChild(item);
  }

  function renderAnalytics(records) {
    syncTrendYearOptions(records);
    renderTrendChart(records);
    renderPieChart(records);
    renderItemRanking(records);
  }

  function syncTrendYearOptions(records) {
    const selected = dom.trendYear.value;
    const currentYear = String(new Date().getFullYear());
    const years = Array.from(
      new Set(
        records
          .map((record) => String(record.date || "").slice(0, 4))
          .filter((year) => /^\d{4}$/.test(year))
          .concat(currentYear)
      )
    ).sort((a, b) => b.localeCompare(a));

    dom.trendYear.replaceChildren();
    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = `${year}年`;
      dom.trendYear.appendChild(option);
    });

    dom.trendYear.value = years.includes(selected) ? selected : currentYear;
    if (!dom.trendYear.value && years.length) {
      dom.trendYear.value = years[0];
    }
    dom.trendYear.disabled = dom.trendMode.value === "yearly";
  }

  function renderTrendChart(records) {
    const mode = dom.trendMode.value;
    const buckets = mode === "yearly" ? buildYearlyBuckets(records) : buildMonthlyBuckets(records);
    const balance = buckets.reduce((sum, bucket) => sum + bucket.income - bucket.expense, 0);
    const incomeTotal = buckets.reduce((sum, bucket) => sum + bucket.income, 0);
    const expenseTotal = buckets.reduce((sum, bucket) => sum + bucket.expense, 0);
    const cumulative = [];

    buckets.reduce((sum, bucket, index) => {
      const next = sum + bucket.income - bucket.expense;
      cumulative[index] = next;
      return next;
    }, 0);

    dom.trendChartTotal.textContent = `収支 ${formatYen(balance)}`;

    if (!incomeTotal && !expenseTotal) {
      setEmptyChart(dom.trendChart, "表示できる収入・支出がありません。");
      return;
    }

    dom.trendChart.innerHTML = buildTrendSvg(
      buckets.map((bucket) => bucket.label),
      buckets.map((bucket) => bucket.income),
      buckets.map((bucket) => bucket.expense),
      cumulative
    );
  }

  function buildMonthlyBuckets(records) {
    const year = dom.trendYear.value || String(new Date().getFullYear());
    const values = Array.from({ length: 12 }, (_, index) => ({
      key: `${year}-${String(index + 1).padStart(2, "0")}`,
      label: `${index + 1}月`,
      income: 0,
      expense: 0,
    }));

    records.forEach((record) => {
      const month = String(record.date || "").slice(0, 7);
      const bucket = values.find((item) => item.key === month);
      if (bucket) {
        if (isIncome(record)) {
          bucket.income += Number(record.price) || 0;
        } else {
          bucket.expense += Number(record.price) || 0;
        }
      }
    });

    return values;
  }

  function buildYearlyBuckets(records) {
    const currentYear = new Date().getFullYear();
    const years = Array.from(
      new Set(
        records
          .map((record) => Number(String(record.date || "").slice(0, 4)))
          .filter((year) => Number.isInteger(year))
          .concat(currentYear)
      )
    ).sort((a, b) => a - b);

    const start = Math.min(...years);
    const end = Math.max(...years);
    const buckets = [];
    for (let year = start; year <= end; year += 1) {
      buckets.push({
        key: String(year),
        label: `${year}`,
        income: 0,
        expense: 0,
      });
    }

    records.forEach((record) => {
      const year = String(record.date || "").slice(0, 4);
      const bucket = buckets.find((item) => item.key === year);
      if (bucket) {
        if (isIncome(record)) {
          bucket.income += Number(record.price) || 0;
        } else {
          bucket.expense += Number(record.price) || 0;
        }
      }
    });

    return buckets;
  }

  function buildTrendSvg(labels, incomeValues, expenseValues, cumulativeValues) {
    const width = 760;
    const height = 320;
    const left = 58;
    const right = 26;
    const top = 28;
    const bottom = 46;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const maxPositive = Math.max(...incomeValues, ...expenseValues, ...cumulativeValues, 1);
    const minValue = Math.min(0, ...cumulativeValues);
    const range = Math.max(1, maxPositive - minValue);
    const slot = chartWidth / incomeValues.length;
    const barWidth = Math.max(7, Math.min(18, slot * 0.24));
    const zeroY = valueToY(0);

    function valueToY(value) {
      return top + ((maxPositive - value) / range) * chartHeight;
    }

    const grid = [0, 0.25, 0.5, 0.75, 1]
      .map((ratio) => {
        const value = minValue + range * ratio;
        const y = valueToY(value);
        const label = formatCompactYen(value);
        return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="#ded8ce" stroke-width="1"/><text x="${left - 8}" y="${y + 4}" text-anchor="end" fill="#646a60" font-size="12">${label}</text>`;
      })
      .join("");

    const bars = incomeValues
      .map((income, index) => {
        const expense = expenseValues[index];
        const center = left + index * slot + slot / 2;
        const incomeY = valueToY(income);
        const expenseY = valueToY(expense);
        const incomeRect = `<rect x="${center - barWidth - 2}" y="${incomeY}" width="${barWidth}" height="${Math.max(1, zeroY - incomeY)}" rx="4" fill="#16756f"><title>${labels[index]} 収入 ${formatYen(income)}</title></rect>`;
        const expenseRect = `<rect x="${center + 2}" y="${expenseY}" width="${barWidth}" height="${Math.max(1, zeroY - expenseY)}" rx="4" fill="#d9604c"><title>${labels[index]} 支出 ${formatYen(expense)}</title></rect>`;
        return incomeRect + expenseRect;
      })
      .join("");

    const points = cumulativeValues.map((value, index) => {
      const x = left + index * slot + slot / 2;
      const y = valueToY(value);
      return { x, y, value };
    });
    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const line = `<path d="${linePath}" fill="none" stroke="#2878a8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    const dots = points
      .map(
        (point, index) =>
          `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="#fffdf8" stroke="#2878a8" stroke-width="3"><title>${labels[index]} 収支累計 ${formatYen(point.value)}</title></circle>`
      )
      .join("");

    const xLabels = labels
      .map((label, index) => {
        const x = left + index * slot + slot / 2;
        return `<text x="${x}" y="${height - 18}" text-anchor="middle" fill="#646a60" font-size="12">${escapeHtml(label)}</text>`;
      })
      .join("");

    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="収支推移グラフ">
      <rect width="${width}" height="${height}" fill="transparent"/>
      ${grid}
      ${bars}
      ${line}
      ${dots}
      <line x1="${left}" y1="${zeroY}" x2="${width - right}" y2="${zeroY}" stroke="#c9c0b4" stroke-width="1.5"/>
      ${xLabels}
    </svg>`;
  }

  function renderPieChart(records) {
    const mode = dom.pieMode.value;
    const expenseRecords = records.filter(isExpense);
    const aggregate = aggregateForPie(expenseRecords, mode);

    dom.pieLegend.replaceChildren();
    if (!aggregate.length) {
      setEmptyChart(dom.pieChart, "表示できる内訳がありません。");
      return;
    }

    const total = aggregate.reduce((sum, item) => sum + item.value, 0);
    const topItems = aggregate.slice(0, 6);
    const otherTotal = aggregate.slice(6).reduce((sum, item) => sum + item.value, 0);
    const items = otherTotal
      ? topItems.concat([{ key: "other-group", label: "その他", value: otherTotal, color: "#707771" }])
      : topItems;

    dom.pieChart.innerHTML = buildPieSvg(items, total);

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "legend-row";

      const label = document.createElement("span");
      label.className = "legend-label";
      const swatch = document.createElement("i");
      swatch.className = "legend-swatch";
      swatch.style.backgroundColor = item.color;
      const name = document.createElement("span");
      name.textContent = item.label;
      label.append(swatch, name);

      const value = document.createElement("span");
      value.className = "legend-value";
      value.textContent = `${formatYen(item.value)} / ${Math.round((item.value / total) * 100)}%`;

      row.append(label, value);
      dom.pieLegend.appendChild(row);
    });
  }

  function aggregateForPie(records, mode) {
    if (mode === "category") {
      return categories
        .map((category) => ({
          key: category.id,
          label: category.label,
          color: category.color,
          value: records
            .filter((record) => record.category === category.id)
            .reduce((sum, record) => sum + (Number(record.price) || 0), 0),
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);
    }

    const keyName = mode === "store" ? "store" : "name";
    return aggregateBy(records, (record) => {
      const label = String(record[keyName] || "").trim();
      return label || (mode === "store" ? "店名なし" : "品目名なし");
    }).map((item, index) => ({
      ...item,
      color: chartPalette[index % chartPalette.length],
    }));
  }

  function buildPieSvg(items, total) {
    const size = 260;
    const center = size / 2;
    const radius = 104;
    let start = -Math.PI / 2;
    const slices = items
      .map((item) => {
        const angle = (item.value / total) * Math.PI * 2;
        const end = start + angle;
        const path = angle >= Math.PI * 2 - 0.0001
          ? `<circle cx="${center}" cy="${center}" r="${radius}" fill="${item.color}"><title>${escapeHtml(item.label)} ${formatYen(item.value)}</title></circle>`
          : `<path d="${describeArcSlice(center, center, radius, start, end)}" fill="${item.color}"><title>${escapeHtml(item.label)} ${formatYen(item.value)}</title></path>`;
        start = end;
        return path;
      })
      .join("");

    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="支出内訳円グラフ">
      ${slices}
      <circle cx="${center}" cy="${center}" r="54" fill="#fffdf8"/>
      <text x="${center}" y="${center - 5}" text-anchor="middle" fill="#646a60" font-size="13" font-weight="700">合計</text>
      <text x="${center}" y="${center + 18}" text-anchor="middle" fill="#20231f" font-size="18" font-weight="800">${formatCompactYen(total)}</text>
    </svg>`;
  }

  function describeArcSlice(cx, cy, radius, start, end) {
    const startPoint = polarToCartesian(cx, cy, radius, start);
    const endPoint = polarToCartesian(cx, cy, radius, end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return [
      `M ${cx} ${cy}`,
      `L ${startPoint.x} ${startPoint.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`,
      "Z",
    ].join(" ");
  }

  function polarToCartesian(cx, cy, radius, angle) {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  function renderItemRanking(records) {
    dom.itemRanking.replaceChildren();
    const items = aggregateBy(records.filter(isExpense), (record) => String(record.name || "").trim()).slice(0, 8);
    if (!items.length) {
      dom.itemRanking.appendChild(createEmptyState("表示できる品目がありません。"));
      return;
    }

    const max = Math.max(...items.map((item) => item.value), 1);
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "ranking-row";

      const line = document.createElement("div");
      line.className = "ranking-line";
      const name = document.createElement("span");
      name.className = "ranking-name";
      name.textContent = item.label;
      const value = document.createElement("span");
      value.className = "ranking-value";
      value.textContent = formatYen(item.value);
      line.append(name, value);

      const bar = document.createElement("div");
      bar.className = "ranking-bar";
      const fill = document.createElement("span");
      fill.style.width = `${Math.max(4, Math.round((item.value / max) * 100))}%`;
      bar.appendChild(fill);

      row.append(line, bar);
      dom.itemRanking.appendChild(row);
    });
  }

  function aggregateBy(records, getLabel) {
    const totals = new Map();
    records.forEach((record) => {
      const label = getLabel(record);
      if (!label) {
        return;
      }
      totals.set(label, (totals.get(label) || 0) + (Number(record.price) || 0));
    });

    return Array.from(totals, ([label, value]) => ({
      key: label,
      label,
      value,
    })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "ja"));
  }

  function setEmptyChart(target, message) {
    target.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "chart-empty";
    empty.textContent = message;
    target.appendChild(empty);
  }

  function renderLedgerRows(records) {
    dom.ledgerList.replaceChildren();

    if (records.length === 0) {
      dom.ledgerList.appendChild(createEmptyState("保存した収入・支出がここに表示されます。"));
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

      row.appendChild(createTypeSelect(record.type));
      row.appendChild(createInput("date", record.date, "date"));
      row.appendChild(createInput("store", record.store || "", "text"));
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
      records.filter((record) => record.date === date).reduce((sum, record) => sum + signedPrice(record), 0)
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

  function createTypeSelect(value) {
    const select = document.createElement("select");
    select.dataset.field = "type";
    recordTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type.id;
      option.textContent = type.label;
      select.appendChild(option);
    });
    select.value = value === "income" ? "income" : "expense";
    return select;
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
    dom.pendingTotal.textContent = formatYen(sumSigned(state.pending));
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

    if (field === "type") {
      return value === "income" ? "income" : "expense";
    }

    return String(value || "").trim();
  }

  function getVisibleRecords() {
    const type = dom.filterType.value;
    const from = dom.filterFrom.value;
    const to = dom.filterTo.value;
    const category = dom.filterCategory.value;
    const keyword = normalizeText(dom.filterKeyword.value).toLowerCase();
    const sortMode = dom.sortMode.value;

    const filtered = state.records.filter((record) => {
      if (type !== "all" && record.type !== type) {
        return false;
      }
      if (from && record.date < from) {
        return false;
      }
      if (to && record.date > to) {
        return false;
      }
      if (category !== "all" && record.category !== category) {
        return false;
      }
      const searchable = `${record.name || ""} ${record.store || ""}`.toLowerCase();
      if (keyword && !normalizeText(searchable).includes(keyword)) {
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
      case "store-asc":
        return (
          (a.store || "").localeCompare(b.store || "", "ja") ||
          b.date.localeCompare(a.date) ||
          a.name.localeCompare(b.name, "ja")
        );
      case "date-desc":
      default:
        return b.date.localeCompare(a.date) || a.name.localeCompare(b.name, "ja");
    }
  }

  function resetFilters() {
    dom.filterType.value = "all";
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
          type: record.type === "income" ? "income" : "expense",
          date: record.date || todayString(),
          store: String(record.store || "").trim(),
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
      ["種別", "日付", "お店・相手", "分類", "内容", "金額", "登録日時"],
      ...state.records.map((record) => [
        recordTypeById.get(record.type)?.label || "支出",
        record.date,
        record.store || "",
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
      type: findHeader(headers, ["種別", "収支", "type"]),
      date: findHeader(headers, ["購入日", "日付", "date"]),
      store: findHeader(headers, ["お店", "お店・相手", "店名", "店舗", "相手", "store"]),
      category: findHeader(headers, ["分類", "カテゴリ", "category"]),
      name: findHeader(headers, ["購入品目名", "内容", "品目", "商品名", "name"]),
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
          type: typeFromLabel(String(row[indexes.type] || "")),
          date: row[indexes.date] || todayString(),
          store: String(row[indexes.store] || "").trim(),
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
    return index >= 0 ? index : -1;
  }

  function categoryFromLabel(value) {
    const normalized = normalizeText(value).trim();
    const match = categories.find((category) => category.id === normalized || category.label === normalized);
    return match ? match.id : "other";
  }

  function typeFromLabel(value) {
    const normalized = normalizeText(value).trim().toLowerCase();
    if (normalized === "income" || normalized === "収入" || normalized === "入金") {
      return "income";
    }
    return "expense";
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

  function isIncome(item) {
    return item.type === "income";
  }

  function isExpense(item) {
    return !isIncome(item);
  }

  function signedPrice(item) {
    const price = Number(item.price) || 0;
    return isIncome(item) ? price : -price;
  }

  function sumSigned(items) {
    return items.reduce((sum, item) => sum + signedPrice(item), 0);
  }

  function formatYen(value) {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function formatCompactYen(value) {
    const amount = Number(value) || 0;
    if (amount >= 10000) {
      const compact = Math.round((amount / 10000) * 10) / 10;
      return `${compact}万円`;
    }
    return `${Math.round(amount).toLocaleString("ja-JP")}円`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
