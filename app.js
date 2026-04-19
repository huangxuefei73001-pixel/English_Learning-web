const STORAGE_KEYS = {
  weeklyPlan: "ai-learning-platform-weekly-plan",
  dailyLogs: "ai-learning-platform-daily-logs",
  weeklyReview: "ai-learning-platform-weekly-review",
};

const API_ENDPOINT = "/api/sync";

const roadmap = [
  {
    week: 1,
    title: "服务器与运行环境",
    goal: "理解服务器、Python、目录、脚本执行、crontab。",
    output: "能手动运行脚本，识别正式任务。",
  },
  {
    week: 2,
    title: "定时任务与测试闭环",
    goal: "独立建立测试 cron 任务。",
    output: "自动执行测试脚本并写入日志。",
  },
  {
    week: 3,
    title: "新闻抓取基础",
    goal: "跑通新闻源获取。",
    output: "能稳定抓取一类新闻数据。",
  },
  {
    week: 4,
    title: "AI 摘要生成",
    goal: "将新闻文本送入模型并生成摘要。",
    output: "第一版 AI 新闻摘要脚本。",
  },
  {
    week: 5,
    title: "写入 Notion / 数据存储",
    goal: "自动把结果写入固定位置。",
    output: "Notion 或数据库自动入库。",
  },
  {
    week: 6,
    title: "推送与通知",
    goal: "接入企业微信、邮件等推送方式。",
    output: "可自动推送日报。",
  },
  {
    week: 7,
    title: "优化与容错",
    goal: "处理日志、报错、重复、空数据。",
    output: "稳定版自动化流程。",
  },
  {
    week: 8,
    title: "方法沉淀与内部表达",
    goal: "总结方法并形成可分享材料。",
    output: "内部分享提纲与方法框架。",
  },
];

const exampleWeeklyPlan = {
  theme: "第 2 周 - 定时任务与测试闭环",
  goal: "建立一个独立于正式项目的测试 cron 任务，并确认它能按时执行。",
  skill: "真正理解 cron 的基本语法，以及日志如何帮助判断任务是否执行成功。",
  definition: "能创建测试任务、查看执行日志、区分测试与正式环境。",
  risk: "容易误改正式任务；可能记不住 cron 时间格式；日志路径容易写错。",
};

const exampleDailyLog = {
  date: "2026-03-26",
  task: "在腾讯云服务器上跑通 Python，并确认新闻正式定时任务配置",
  status: "已完成",
  result:
    "成功运行 Python 测试文件；查看并识别 crontab；确认只保留 8:45 的正式新闻推送任务；删除冗余旧任务。",
  learned:
    "服务器是执行脚本的运行环境；pwd、ls 用于确认路径与文件；Python 文件需要用 python3 文件名.py 执行；正式环境与测试环境必须分开；crontab 中的定时任务需要先识别再修改。",
  blocker:
    "nano 编辑器不熟；容易把测试文件和正式项目目录混淆；一开始不清楚 ls 与“运行文件”的区别。",
  nextStep: "建立独立测试 cron 任务，并验证日志输出。",
};

const weeklyPlanForm = document.getElementById("weeklyPlanForm");
const dailyLogForm = document.getElementById("dailyLogForm");
const weeklyReviewForm = document.getElementById("weeklyReviewForm");
const roadmapList = document.getElementById("roadmapList");
const roadmapDetail = document.getElementById("roadmapDetail");
const journalEntries = document.getElementById("journalEntries");
const journalTemplate = document.getElementById("journalEntryTemplate");
const focusTask = document.getElementById("focusTask");
const focusHint = document.getElementById("focusHint");
const todayDate = document.getElementById("todayDate");
const journalCount = document.getElementById("journalCount");
const currentWeekLabel = document.getElementById("currentWeek");
const syncStatus = document.getElementById("syncStatus");
const syncUploadButton = document.getElementById("syncUpload");
const syncDownloadButton = document.getElementById("syncDownload");

let activeWeek = 1;

function safeRead(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function safeWrite(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function collectState() {
  return {
    weeklyPlan: safeRead(STORAGE_KEYS.weeklyPlan, exampleWeeklyPlan),
    dailyLogs: safeRead(STORAGE_KEYS.dailyLogs, []),
    weeklyReview: safeRead(STORAGE_KEYS.weeklyReview, {}),
  };
}

function applyState(payload) {
  const weeklyPlan = payload.weeklyPlan || exampleWeeklyPlan;
  const dailyLogs = Array.isArray(payload.dailyLogs) ? payload.dailyLogs : [];
  const weeklyReview = payload.weeklyReview || {};

  safeWrite(STORAGE_KEYS.weeklyPlan, weeklyPlan);
  safeWrite(STORAGE_KEYS.dailyLogs, dailyLogs);
  safeWrite(STORAGE_KEYS.weeklyReview, weeklyReview);

  inferWeekFromTheme(weeklyPlan.theme);
  fillForm(weeklyPlanForm, weeklyPlan);
  fillForm(weeklyReviewForm, weeklyReview);
  renderRoadmap();
  renderLogs(dailyLogs);
  updateDashboard(dailyLogs);
}

function setSyncMessage(message) {
  syncStatus.textContent = message;
}

function setSyncButtons(disabled) {
  syncUploadButton.disabled = disabled;
  syncDownloadButton.disabled = disabled;
}

function formatDisplayDate(input) {
  if (!input) {
    return "未设置日期";
  }

  const date = new Date(`${input}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function inferWeekFromTheme(theme = "") {
  const matched = theme.match(/第\s*(\d+)\s*周/);
  const value = matched ? Number.parseInt(matched[1], 10) : null;

  if (value && value >= 1 && value <= roadmap.length) {
    activeWeek = value;
  }
}

function updateDashboard(logs) {
  const latest = logs[0];
  journalCount.textContent = String(logs.length);
  currentWeekLabel.textContent = `第 ${activeWeek} 周`;

  if (latest) {
    focusTask.textContent = latest.task || "今天只做一件核心事";
    focusHint.textContent = latest.nextStep
      ? `下一步：${latest.nextStep}`
      : "继续保持记录，让平台帮你聚焦下一步。";
  } else {
    focusTask.textContent = "今天只做一件核心事";
    focusHint.textContent = "先在下方写下“今日唯一任务”，平台会自动把它显示到这里。";
  }
}

function renderRoadmap() {
  roadmapList.innerHTML = "";

  roadmap.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `roadmap-item ${item.week === activeWeek ? "active" : ""}`;
    button.innerHTML = `
      <span class="detail-week">第 ${item.week} 周</span>
      <strong>${item.title}</strong>
      <p>${item.output}</p>
    `;

    button.addEventListener("click", () => {
      activeWeek = item.week;
      renderRoadmap();
      const logs = safeRead(STORAGE_KEYS.dailyLogs, []);
      updateDashboard(logs);
    });

    roadmapList.appendChild(button);
  });

  const current = roadmap.find((item) => item.week === activeWeek) || roadmap[0];
  roadmapDetail.innerHTML = `
    <p class="detail-week">第 ${current.week} 周</p>
    <h3>${current.title}</h3>
    <p class="detail-goal">本周目标：${current.goal}</p>
    <p class="detail-output">核心产出：${current.output}</p>
  `;
}

function fillForm(form, data) {
  Object.entries(data).forEach(([name, value]) => {
    if (form.elements[name]) {
      form.elements[name].value = value;
    }
  });
}

function readForm(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function renderLogs(logs) {
  journalEntries.innerHTML = "";

  if (!logs.length) {
    journalEntries.innerHTML =
      '<div class="empty-state">这里会展示你的最近记录。建议先从“今日唯一任务”开始，不需要写很多，只写最关键的一件事。</div>';
    return;
  }

  logs.forEach((entry) => {
    const fragment = journalTemplate.content.cloneNode(true);
    fragment.querySelector(".entry-date").textContent = formatDisplayDate(entry.date);
    fragment.querySelector(".entry-status").textContent = entry.status;
    fragment.querySelector(".entry-task").textContent = entry.task;
    fragment.querySelector(".entry-result").textContent = entry.result;
    fragment.querySelector(".entry-learned").textContent = entry.learned || "暂无";
    fragment.querySelector(".entry-blocker").textContent = entry.blocker || "暂无";
    fragment.querySelector(".entry-next").textContent = entry.nextStep || "暂无";
    journalEntries.appendChild(fragment);
  });
}

function loadWeeklyPlan() {
  const plan = safeRead(STORAGE_KEYS.weeklyPlan, exampleWeeklyPlan);
  inferWeekFromTheme(plan.theme);
  fillForm(weeklyPlanForm, plan);
}

function loadWeeklyReview() {
  const review = safeRead(STORAGE_KEYS.weeklyReview, {});
  fillForm(weeklyReviewForm, review);
}

function loadLogs() {
  const logs = safeRead(STORAGE_KEYS.dailyLogs, []);
  renderLogs(logs);
  updateDashboard(logs);
}

function saveWeeklyPlan(event) {
  event.preventDefault();
  const data = readForm(weeklyPlanForm);
  inferWeekFromTheme(data.theme);
  safeWrite(STORAGE_KEYS.weeklyPlan, data);
  renderRoadmap();
  updateDashboard(safeRead(STORAGE_KEYS.dailyLogs, []));
}

function saveWeeklyReview(event) {
  event.preventDefault();
  const data = readForm(weeklyReviewForm);
  safeWrite(STORAGE_KEYS.weeklyReview, data);
}

function saveDailyLog(event) {
  event.preventDefault();
  const data = readForm(dailyLogForm);
  const logs = safeRead(STORAGE_KEYS.dailyLogs, []);

  const merged = [
    data,
    ...logs.filter((item) => item.date !== data.date),
  ].sort((a, b) => b.date.localeCompare(a.date));

  safeWrite(STORAGE_KEYS.dailyLogs, merged);
  renderLogs(merged);
  updateDashboard(merged);
  dailyLogForm.reset();
  dailyLogForm.elements.date.value = getLocalDateInputValue();
}

function exportLogs() {
  const logs = safeRead(STORAGE_KEYS.dailyLogs, []);
  const blob = new Blob([JSON.stringify(logs, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ai-learning-daily-logs.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function syncToServer() {
  setSyncButtons(true);
  setSyncMessage("正在把周计划、日记录和复盘保存到服务器...");

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(collectState()),
    });

    if (!response.ok) {
      throw new Error(`服务器返回 ${response.status}`);
    }

    const payload = await response.json();
    const syncedAt = payload.updated_at
      ? new Intl.DateTimeFormat("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(payload.updated_at))
      : "刚刚";

    setSyncMessage(`已保存到服务器，最近同步时间：${syncedAt}。`);
  } catch (error) {
    setSyncMessage(`保存失败：${error.message}。请确认服务器同步服务已经启动。`);
  } finally {
    setSyncButtons(false);
  }
}

async function loadFromServer() {
  setSyncButtons(true);
  setSyncMessage("正在从服务器读取你的最新学习记录...");

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "GET",
    });

    if (response.status === 404) {
      setSyncMessage("服务器上还没有同步记录。你可以先填写内容，再点击“保存到服务器”。");
      return;
    }

    if (!response.ok) {
      throw new Error(`服务器返回 ${response.status}`);
    }

    const payload = await response.json();
    applyState(payload);

    const syncedAt = payload.updated_at
      ? new Intl.DateTimeFormat("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(payload.updated_at))
      : "刚刚";

    setSyncMessage(`已从服务器读取完成，最近同步时间：${syncedAt}。`);
  } catch (error) {
    setSyncMessage(`读取失败：${error.message}。请确认 Nginx 和同步服务都已经启动。`);
  } finally {
    setSyncButtons(false);
  }
}

function preloadExampleLog() {
  fillForm(dailyLogForm, exampleDailyLog);
}

function resetWeeklyPlan() {
  inferWeekFromTheme(exampleWeeklyPlan.theme);
  fillForm(weeklyPlanForm, exampleWeeklyPlan);
  safeWrite(STORAGE_KEYS.weeklyPlan, exampleWeeklyPlan);
  renderRoadmap();
  updateDashboard(safeRead(STORAGE_KEYS.dailyLogs, []));
}

function setToday() {
  const now = new Date();
  todayDate.textContent = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);

  dailyLogForm.elements.date.value = getLocalDateInputValue(now);
}

weeklyPlanForm.addEventListener("submit", saveWeeklyPlan);
weeklyReviewForm.addEventListener("submit", saveWeeklyReview);
dailyLogForm.addEventListener("submit", saveDailyLog);
document.getElementById("exportLogs").addEventListener("click", exportLogs);
document.getElementById("loadExample").addEventListener("click", preloadExampleLog);
document.getElementById("resetWeeklyPlan").addEventListener("click", resetWeeklyPlan);
syncUploadButton.addEventListener("click", syncToServer);
syncDownloadButton.addEventListener("click", loadFromServer);

setToday();
renderRoadmap();
loadWeeklyPlan();
loadWeeklyReview();
loadLogs();
