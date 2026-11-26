
const STORAGE_KEY = "wasuremonoAppData";

const defaultData = {
  categories: ["学校", "通学", "外出", "旅行", "部活", "その他"],
  necessary: [],
  forget: [],
  checked: [],
  schedule: "",
  city: "",
  weather: null
};

let data;

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

  data = {
    ...defaultData,
    ...(saved || {})
  };

  if (!Array.isArray(data.categories)) {
    data.categories = [...defaultData.categories];
  }

  if (!Array.isArray(data.necessary)) {
    data.necessary = [];
  }

  if (!Array.isArray(data.forget)) {
    data.forget = [];
  }

  if (!Array.isArray(data.checked)) {
    data.checked = [];
  }

} catch {
  data = { ...defaultData };
}

const $ = id => document.getElementById(id);


// ========================
// 保存
// ========================

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}


// ========================
// 画面切り替え
// ========================

function showScreen(screenId) {
  const screens = [
    "homeScreen",
    "registerScreen",
    "checkScreen",
    "predictionScreen"
  ];

  screens.forEach(id => {
    $(id).classList.add("hidden");
  });

  $(screenId).classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// 登録画面を開く
$("openRegister").addEventListener("click", () => {
  renderCategories();
  renderItems();

  showScreen("registerScreen");
});

// メイン画面に戻る
$("backFromRegister").addEventListener("click", () => {
  showScreen("homeScreen");
});

// 持ち物確認画面
$("openCheck").addEventListener("click", () => {
  renderCheckList();
  showScreen("checkScreen");
});

// 持ち物確認から戻る
$("backFromCheck").addEventListener("click", () => {
  showScreen("homeScreen");
});

// 予測詳細画面
$("openPrediction").addEventListener("click", () => {
  renderPredictionDetail();
  showScreen("predictionScreen");
});

// 予測詳細から戻る
$("backFromPrediction").addEventListener("click", () => {
  showScreen("homeScreen");
});


// ========================
// カテゴリー
// ========================

function renderCategories() {

  // セレクト欄
  ["necessaryCategory", "forgetCategory"].forEach(id => {

    const select = $(id);
    const previous = select.value;

    select.innerHTML = "";

    data.categories.forEach(category => {
      const option = document.createElement("option");

      option.value = category;
      option.textContent = category;

      select.appendChild(option);
    });

    if (data.categories.includes(previous)) {
      select.value = previous;
    }
  });

  // 登録カテゴリー一覧
  const area = $("categoryList");
  area.innerHTML = "";

  data.categories.forEach(category => {

    const row = document.createElement("div");
    row.className = "item-row";

    const name = document.createElement("span");
    name.textContent = category;

    const button = document.createElement("button");
    button.className = "delete-button";
    button.textContent = "削除";

    button.addEventListener("click", () => {

      if (defaultData.categories.includes(category)) {
        alert("最初からあるカテゴリーは削除できません。");
        return;
      }

      const used = [...data.necessary, ...data.forget]
        .some(item => item.category === category);

      if (used) {
        alert("このカテゴリーに登録された持ち物があるため削除できません。先に持ち物を削除してください。");
        return;
      }

      data.categories = data.categories.filter(c => c !== category);

      saveData();
      renderCategories();
    });

    row.append(name, button);
    area.appendChild(row);
  });
}


// カテゴリーを追加
$("addCategory").addEventListener("click", () => {

  const value = $("categoryInput").value.trim();

  if (!value) {
    alert("カテゴリー名を入力してください。");
    return;
  }

  if (data.categories.includes(value)) {
    alert("すでに登録されています。");
    return;
  }

  data.categories.push(value);
  $("categoryInput").value = "";

  saveData();
  renderCategories();
});


// ========================
// 持ち物登録
// ========================

function addItem(type, categoryId, inputId) {

  const name = $(inputId).value.trim();
  const category = $(categoryId).value;

  if (!name) {
    alert("持ち物を入力してください。");
    return;
  }

  const exists = data[type].some(item =>
    item.name === name && item.category === category
  );

  if (exists) {
    alert("すでに登録されています。");
    return;
  }

  const item = {
    id: Date.now() + Math.random(),
    name: name,
    category: category
  };

  data[type].push(item);

  $(inputId).value = "";

  saveData();

  renderItems();
  renderCheckList();
  renderPrediction();
}


// 必要なもの登録
$("addNecessary").addEventListener("click", () => {
  addItem(
    "necessary",
    "necessaryCategory",
    "necessaryInput"
  );
});

// 忘れやすいもの登録
$("addForget").addEventListener("click", () => {
  addItem(
    "forget",
    "forgetCategory",
    "forgetInput"
  );
});


// ========================
// 登録済み持ち物表示
// ========================

function renderItems() {

  const types = [
    ["necessary", "necessaryList"],
    ["forget", "forgetList"]
  ];

  types.forEach(([type, elementId]) => {

    const area = $(elementId);
    area.innerHTML = "";

    data[type].forEach(item => {

      const row = document.createElement("div");
      row.className = "item-row";

      const name = document.createElement("span");
      name.textContent = `${item.category}：${item.name}`;

      const button = document.createElement("button");
      button.className = "delete-button";
      button.textContent = "削除";

      button.addEventListener("click", () => {

        data[type] = data[type].filter(target =>
          target.id !== item.id
        );

        data.checked = data.checked.filter(id =>
          id !== item.id
        );

        saveData();

        renderItems();
        renderCheckList();
        renderPrediction();
      });

      row.append(name, button);
      area.appendChild(row);
    });
  });
}


// ========================
// 持ち物チェック
// ========================

function renderCheckList() {

  const area = $("checkList");
  area.innerHTML = "";

  const allItems = [...data.necessary, ...data.forget];

  if (allItems.length === 0) {
    area.textContent = "まだ持ち物が登録されていません。";
    return;
  }

  allItems.forEach(item => {

    const row = document.createElement("div");
    row.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = data.checked.includes(item.id);

    const label = document.createElement("label");
    label.textContent = `${item.category}：${item.name}`;

    checkbox.addEventListener("change", () => {

      if (checkbox.checked) {

        if (!data.checked.includes(item.id)) {
          data.checked.push(item.id);
        }

      } else {

        data.checked = data.checked.filter(id =>
          id !== item.id
        );
      }

      saveData();
    });

    row.append(checkbox, label);
    area.appendChild(row);
  });
}


// チェックをリセット
$("resetCheck").addEventListener("click", () => {

  data.checked = [];

  saveData();
  renderCheckList();
});


// ========================
// 忘れ物予測
// ========================

function getPredictions() {

  const suggestions = [];

  // 忘れやすいもの
  data.forget.forEach(item => {
    suggestions.push(item.name);
  });

  // 天気による提案
  if (data.weather && data.weather.suggestions) {
    suggestions.push(...data.weather.suggestions);
  }

  // 重複削除
  return [...new Set(suggestions)];
}


function renderPrediction() {

  const items = getPredictions();

  if (items.length === 0) {

    $("prediction").textContent =
      "持ち物や天気を確認して、忘れ物を防ぎましょう。";

    return;
  }

  $("prediction").textContent =
    "今日、忘れずに確認したいもの：" + items.join("・");
}


function renderPredictionDetail() {

  const area = $("predictionDetail");
  area.innerHTML = "";

  const items = getPredictions();

  if (items.length === 0) {

    area.textContent =
      "まだ予測がありません。登録画面から忘れやすいものを登録したり、天気を確認したりしましょう。";

    return;
  }

  items.forEach(name => {

    const row = document.createElement("div");
    row.className = "item-row";

    row.textContent = "⚠ " + name;

    area.appendChild(row);
  });
}


// ========================
// 今日の予定
// ========================

$("saveSchedule").addEventListener("click", () => {

  data.schedule = $("scheduleInput").value;

  saveData();

  $("saveMessage").textContent = "予定を保存しました！";

  setTimeout(() => {
    $("saveMessage").textContent = "";
  }, 2500);
});


// ========================
// 天気
// ========================

async function getWeather() {

  const city = $("cityInput").value.trim();

  if (!city) {
    alert("地域名を入力してください。");
    return;
  }

  $("weatherResult").textContent =
    "天気を確認しています...";

  try {

    // 地域検索
    const geoURL =
      "https://geocoding-api.open-meteo.com/v1/search" +
      `?name=${encodeURIComponent(city)}` +
      "&count=1&language=ja&format=json";

    const geoResponse = await fetch(geoURL);

    if (!geoResponse.ok) {
      throw new Error("地域を検索できませんでした。");
    }

    const geo = await geoResponse.json();

    if (!geo.results || geo.results.length === 0) {
      throw new Error("地域が見つかりませんでした。");
    }

    const place = geo.results[0];

    // 天気取得
    const weatherURL =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${place.latitude}` +
      `&longitude=${place.longitude}` +
      "&current=temperature_2m,weather_code" +
      "&daily=precipitation_probability_max" +
      "&timezone=auto";

    const response = await fetch(weatherURL);

    if (!response.ok) {
      throw new Error("天気を取得できませんでした。");
    }

    const weather = await response.json();

    const temp = weather.current.temperature_2m;
    const code = weather.current.weather_code;

    const rain =
      weather.daily.precipitation_probability_max[0] ?? 0;

    // 天気の名前
    let description = "晴れ";

    const rainyCodes = [
      51, 53, 55, 61, 63, 65, 80, 81, 82
    ];

    const snowyCodes = [
      71, 73, 75, 77, 85, 86
    ];

    if (rainyCodes.includes(code)) {
      description = "雨";
    } else if (snowyCodes.includes(code)) {
      description = "雪";
    } else if ([1, 2, 3].includes(code)) {
      description = "くもり";
    } else if ([45, 48].includes(code)) {
      description = "霧";
    }

    // 持ち物提案
    const suggestions = [];

    if (rain >= 50 || rainyCodes.includes(code)) {
      suggestions.push("傘");
    }

    if (temp <= 12) {
      suggestions.push("上着・防寒具");
    }

    if (temp >= 28) {
      suggestions.push("飲み物・帽子");
    }

    if (snowyCodes.includes(code)) {
      suggestions.push("防寒具");
    }

    // 保存
    data.city = city;

    data.weather = {
      temp,
      description,
      rain,
      suggestions
    };

    saveData();

    // 表示
    $("weatherResult").textContent =
      `${place.name}：${description} / 気温 ${temp}℃ / 降水確率 ${rain}%`;

    renderPrediction();

  } catch (error) {

    $("weatherResult").textContent =
      error.message || "天気を取得できませんでした。";
  }
}

$("weatherButton").addEventListener("click", getWeather);


// ========================
// 初期表示
// ========================

function initialize() {

  renderCategories();
  renderItems();
  renderCheckList();
  renderPrediction();

  $("scheduleInput").value = data.schedule || "";
  $("cityInput").value = data.city || "";

  if (data.weather) {

    $("weatherResult").textContent =
      `${data.city}：${data.weather.description} / 気温 ${data.weather.temp}℃ / 降水確率 ${data.weather.rain}%`;
  }
}

initialize();
