/* ========================================
   Daily Overview - Application Logic
   ======================================== */

// ---- Utilities ----
function $(id) { return document.getElementById(id); }
function qs(sel) { return document.querySelector(sel); }

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---- Clock & Date ----
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  $('clock').textContent = `${h}:${m}:${s}`;

  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  $('dateDisplay').textContent =
    `${now.getFullYear()}年${months[now.getMonth()]}月${now.getDate()}日(${days[now.getDay()]})`;

  // Greeting
  const hour = now.getHours();
  let greeting = 'こんばんは';
  if (hour >= 5 && hour < 12) greeting = 'おはようございます';
  else if (hour >= 12 && hour < 17) greeting = 'こんにちは';
  $('greeting').textContent = greeting + '! 今日も素敵な一日を。';
}

// ---- Day Progress ----
function updateDayProgress() {
  const now = new Date();
  const startHour = 6;
  const endHour = 24;
  const totalMinutes = (endHour - startHour) * 60;
  const currentMinutes = (now.getHours() - startHour) * 60 + now.getMinutes();
  const percent = Math.max(0, Math.min(100, (currentMinutes / totalMinutes) * 100));

  $('dayProgressFill').style.width = percent + '%';
  $('dayProgressSun').style.left = percent + '%';
  $('dayPercent').textContent = Math.round(percent) + '%';
}

// ---- Weather (simulated) ----
function initWeather() {
  const conditions = [
    { icon: '\u2600\uFE0F', temp: 18, humidity: 45, wind: 3.2, feels: 17, label: '晴れ' },
    { icon: '\u26C5', temp: 15, humidity: 55, wind: 4.1, feels: 13, label: '曇り' },
    { icon: '\uD83C\uDF27\uFE0F', temp: 12, humidity: 80, wind: 5.5, feels: 9, label: '雨' },
    { icon: '\uD83C\uDF24\uFE0F', temp: 20, humidity: 40, wind: 2.8, feels: 19, label: '晴れ時々曇り' },
  ];

  // Use day of year as seed for consistent daily weather
  const now = new Date();
  const dayOfYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const weather = conditions[dayOfYear % conditions.length];

  $('weatherIcon').textContent = weather.icon;
  $('weatherTemp').textContent = weather.temp + '\u00B0C';
  $('humidity').textContent = weather.humidity + '%';
  $('wind').textContent = weather.wind + ' m/s';
  $('feelsLike').textContent = weather.feels + '\u00B0C';

  // Hourly forecast
  const hourlyEl = $('hourlyForecast');
  const baseTemp = weather.temp;
  const icons = ['\u2600\uFE0F', '\u26C5', '\uD83C\uDF24\uFE0F', '\u2601\uFE0F', '\uD83C\uDF27\uFE0F'];

  for (let i = 0; i < 8; i++) {
    const hour = (now.getHours() + i + 1) % 24;
    const tempVariation = Math.round(baseTemp + Math.sin(hour / 3) * 3);
    const icon = icons[(dayOfYear + i) % icons.length];
    const div = document.createElement('div');
    div.className = 'hourly-item';
    div.innerHTML = `
      <div>${hour}:00</div>
      <div class="hourly-icon">${icon}</div>
      <div class="hourly-temp">${tempVariation}\u00B0</div>
    `;
    hourlyEl.appendChild(div);
  }
}

// ---- Timeline ----
function initTimeline() {
  const defaultEvents = [
    { time: '07:00', title: '\uD83C\uDF05 起床 & モーニングルーティン', desc: 'ストレッチ、朝食' },
    { time: '08:00', title: '\uD83D\uDCDA 学習タイム', desc: '新しい技術の勉強' },
    { time: '09:30', title: '\uD83D\uDCBB 仕事開始', desc: 'メール確認、タスク整理' },
    { time: '10:00', title: '\uD83D\uDE80 メインタスク', desc: '集中作業' },
    { time: '12:00', title: '\uD83C\uDF5C ランチ', desc: 'しっかり休憩する' },
    { time: '13:00', title: '\uD83D\uDCAC ミーティング', desc: 'チーム定例会' },
    { time: '14:00', title: '\uD83D\uDD27 作業再開', desc: '午後のタスクに取り組む' },
    { time: '17:00', title: '\uD83C\uDFC3 運動', desc: 'ジョギング or ジム' },
    { time: '18:30', title: '\uD83C\uDF73 夕食 & リラックス', desc: '' },
    { time: '20:00', title: '\uD83D\uDCD6 自由時間', desc: '読書、趣味' },
    { time: '22:00', title: '\uD83C\uDF19 振り返り & 就寝準備', desc: '明日の計画' },
  ];

  const events = loadData('timeline_events', defaultEvents);
  const timelineEl = $('timeline');
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  timelineEl.innerHTML = '';

  events.forEach((event, i) => {
    const [h, m] = event.time.split(':').map(Number);
    const eventMinutes = h * 60 + m;
    const nextEvent = events[i + 1];
    const nextMinutes = nextEvent
      ? parseInt(nextEvent.time.split(':')[0]) * 60 + parseInt(nextEvent.time.split(':')[1])
      : 24 * 60;

    let status = '';
    if (currentMinutes >= nextMinutes) status = 'past';
    else if (currentMinutes >= eventMinutes) status = 'current';

    const div = document.createElement('div');
    div.className = `timeline-item ${status}`;
    div.innerHTML = `
      <div class="timeline-time">${event.time}</div>
      <div class="timeline-title">${event.title}</div>
      ${event.desc ? `<div class="timeline-desc">${event.desc}</div>` : ''}
    `;
    timelineEl.appendChild(div);
  });
}

// ---- Mood Tracker ----
function initMoodTracker() {
  const today = getToday();
  const moodData = loadData('mood_data', {});

  // Set up buttons
  document.querySelectorAll('.mood-btn').forEach(btn => {
    if (moodData[today] === btn.dataset.mood) {
      btn.classList.add('selected');
    }

    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      moodData[today] = btn.dataset.mood;
      saveData('mood_data', moodData);
      renderMoodWeek(moodData);
    });
  });

  renderMoodWeek(moodData);
}

function renderMoodWeek(moodData) {
  const container = $('moodWeek');
  const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
  const moodEmojis = {
    great: '\uD83D\uDE0D',
    good: '\uD83D\uDE0A',
    okay: '\uD83D\uDE10',
    bad: '\uD83D\uDE1F',
    terrible: '\uD83D\uDE2D',
  };

  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday = 0

  container.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - dayOfWeek + i);
    const dateStr = date.toISOString().slice(0, 10);
    const mood = moodData[dateStr];

    const div = document.createElement('div');
    div.className = 'mood-day';
    div.innerHTML = `
      <div class="mood-day-label">${dayLabels[i]}</div>
      <div class="mood-day-emoji">${mood ? moodEmojis[mood] : '\u2022'}</div>
    `;
    container.appendChild(div);
  }
}

// ---- Habit Tracker ----
function initHabits() {
  const today = getToday();
  const defaultHabits = [
    { id: 1, name: '\uD83D\uDCDA 読書 30分', streak: 5 },
    { id: 2, name: '\uD83C\uDFC3 運動', streak: 3 },
    { id: 3, name: '\uD83E\uDDD8 瞑想', streak: 7 },
    { id: 4, name: '\uD83D\uDCA7 水2L飲む', streak: 12 },
    { id: 5, name: '\uD83C\uDF4E 野菜を食べる', streak: 2 },
  ];

  const habits = loadData('habits', defaultHabits);
  const completedToday = loadData(`habits_done_${today}`, []);

  renderHabits(habits, completedToday, today);

  $('addHabitBtn').addEventListener('click', () => {
    const name = prompt('新しい習慣の名前を入力:');
    if (!name) return;
    habits.push({ id: Date.now(), name, streak: 0 });
    saveData('habits', habits);
    renderHabits(habits, loadData(`habits_done_${today}`, []), today);
  });
}

function renderHabits(habits, completedToday, today) {
  const container = $('habits');
  container.innerHTML = '';

  habits.forEach(habit => {
    const done = completedToday.includes(habit.id);
    const div = document.createElement('div');
    div.className = 'habit-item';
    div.innerHTML = `
      <div class="habit-checkbox ${done ? 'checked' : ''}" data-id="${habit.id}">
        ${done ? '\u2714' : ''}
      </div>
      <span class="habit-name ${done ? 'done' : ''}">${habit.name}</span>
      <span class="habit-streak">\uD83D\uDD25 ${habit.streak}日</span>
    `;

    div.querySelector('.habit-checkbox').addEventListener('click', () => {
      let completed = loadData(`habits_done_${today}`, []);
      if (completed.includes(habit.id)) {
        completed = completed.filter(id => id !== habit.id);
      } else {
        completed.push(habit.id);
      }
      saveData(`habits_done_${today}`, completed);
      renderHabits(habits, completed, today);
    });

    container.appendChild(div);
  });
}

// ---- Activity Chart ----
function initActivityChart() {
  const chartEl = $('activityChart');
  const legendEl = $('activityLegend');
  const days = ['月', '火', '水', '木', '金', '土', '日'];

  const categories = [
    { name: '集中', color: 'linear-gradient(to top, #4facfe, #00f2fe)', key: 'focus' },
    { name: '運動', color: 'linear-gradient(to top, #34d399, #6ee7b7)', key: 'exercise' },
    { name: '学習', color: 'linear-gradient(to top, #a855f7, #c084fc)', key: 'study' },
  ];

  // Generate sample data based on date for consistency
  const now = new Date();
  const dayOfYear = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );

  const data = days.map((_, i) => {
    const seed = dayOfYear + i;
    return {
      focus: 2 + Math.abs(Math.sin(seed * 1.3)) * 6,
      exercise: 0.5 + Math.abs(Math.cos(seed * 0.8)) * 2,
      study: 1 + Math.abs(Math.sin(seed * 2.1)) * 3,
    };
  });

  const maxVal = Math.max(...data.flatMap(d => [d.focus, d.exercise, d.study]));

  chartEl.innerHTML = '';
  days.forEach((day, i) => {
    const group = document.createElement('div');
    group.className = 'chart-bar-group';

    categories.forEach(cat => {
      const val = data[i][cat.key];
      const height = (val / maxVal) * 100;
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.background = cat.color;
      bar.style.height = '0px';
      bar.dataset.value = val.toFixed(1) + 'h';
      setTimeout(() => {
        bar.style.height = height + '%';
      }, 100 + i * 80);
      group.appendChild(bar);
    });

    const label = document.createElement('div');
    label.className = 'chart-label';
    label.textContent = day;
    group.appendChild(label);
    chartEl.appendChild(group);
  });

  // Legend
  legendEl.innerHTML = '';
  categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-dot" style="background: ${cat.color}"></span>${cat.name}`;
    legendEl.appendChild(item);
  });
}

// ---- Quick Notes ----
function initNotes() {
  const today = getToday();
  const notes = loadData(`notes_${today}`, []);
  const input = $('notesInput');

  renderNotes(notes, today);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      notes.unshift({ text, time, id: Date.now() });
      saveData(`notes_${today}`, notes);
      input.value = '';
      renderNotes(notes, today);
    }
  });
}

function renderNotes(notes, today) {
  const container = $('savedNotes');
  container.innerHTML = '';

  notes.forEach(note => {
    const div = document.createElement('div');
    div.className = 'note-item';
    div.innerHTML = `
      <span class="note-time">${note.time}</span>
      <span class="note-text">${escapeHtml(note.text)}</span>
      <button class="note-delete" data-id="${note.id}">\u00D7</button>
    `;

    div.querySelector('.note-delete').addEventListener('click', () => {
      const updated = notes.filter(n => n.id !== note.id);
      saveData(`notes_${today}`, updated);
      renderNotes(updated, today);
    });

    container.appendChild(div);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ---- Focus Timer ----
function initTimer() {
  const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
  let remaining = FOCUS_DURATION;
  let isRunning = false;
  let intervalId = null;
  const today = getToday();
  let focusSessions = loadData(`focus_${today}`, 0);

  const circumference = 2 * Math.PI * 54; // r=54 from SVG
  const circle = $('timerCircle');

  // Add gradient def to SVG
  const svg = document.querySelector('.timer-svg');
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.id = 'timerGradient';
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#fb923c');
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#fbbf24');
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.insertBefore(defs, svg.firstChild);

  circle.style.strokeDasharray = circumference;
  $('focusCount').textContent = focusSessions;

  function updateDisplay() {
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    $('timerDisplay').textContent = `${m}:${s}`;

    const progress = (FOCUS_DURATION - remaining) / FOCUS_DURATION;
    circle.style.strokeDashoffset = circumference * (1 - progress);
  }

  $('timerStart').addEventListener('click', () => {
    if (isRunning) {
      clearInterval(intervalId);
      isRunning = false;
      $('timerStart').innerHTML = '\u25B6 開始';
    } else {
      isRunning = true;
      $('timerStart').innerHTML = '\u23F8 一時停止';
      intervalId = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(intervalId);
          isRunning = false;
          remaining = FOCUS_DURATION;
          focusSessions++;
          saveData(`focus_${today}`, focusSessions);
          $('focusCount').textContent = focusSessions;
          $('timerStart').innerHTML = '\u25B6 開始';
          alert('\uD83C\uDF89 お疲れ様! 集中セッション完了!');
        }
        updateDisplay();
      }, 1000);
    }
  });

  $('timerReset').addEventListener('click', () => {
    clearInterval(intervalId);
    isRunning = false;
    remaining = FOCUS_DURATION;
    $('timerStart').innerHTML = '\u25B6 開始';
    updateDisplay();
  });

  updateDisplay();
}

// ---- Daily Quote ----
function initQuote() {
  const quotes = [
    { text: '千里の道も一歩から。', author: '老子' },
    { text: '継続は力なり。', author: '住岡夜晃' },
    { text: '今日という日は、残りの人生の最初の日である。', author: 'チャールズ・ディードリッヒ' },
    { text: '為せば成る、為さねば成らぬ何事も。', author: '上杉鷹山' },
    { text: '人生は近くで見ると悲劇だが、遠くから見れば喜劇である。', author: 'チャールズ・チャップリン' },
    { text: '自分自身を信じてみるだけでいい。きっと、生きる道が見えてくる。', author: 'ゲーテ' },
    { text: '行動は必ずしも幸福をもたらさないが、行動のないところに幸福はない。', author: 'ベンジャミン・ディズレーリ' },
    { text: '夢見ることができれば、それは実現できる。', author: 'ウォルト・ディズニー' },
    { text: '明日死ぬかのように生きよ。永遠に生きるかのように学べ。', author: 'マハトマ・ガンジー' },
    { text: '失敗したところでやめてしまうから失敗になる。成功するところまで続ければ成功になる。', author: '松下幸之助' },
    { text: '人の世に道は一つということはない。道は百も千も万もある。', author: '坂本龍馬' },
    { text: '小さいことを重ねることが、とんでもないところに行くただ一つの道。', author: 'イチロー' },
    { text: '努力した者が全て報われるとは限らん。しかし、成功した者は皆すべからく努力しておる。', author: '鴨川源二（はじめの一歩）' },
    { text: '世界を変える最も確実な方法は、自分自身を変えることである。', author: 'マハトマ・ガンジー' },
  ];

  function showQuote() {
    const index = Math.floor(Math.random() * quotes.length);
    const quote = quotes[index];
    $('quoteText').textContent = quote.text;
    $('quoteAuthor').textContent = '\u2014 ' + quote.author;
  }

  showQuote();
  $('quoteRefresh').addEventListener('click', showQuote);
}

// ---- Particles Background ----
function initParticles() {
  const container = $('particles');
  const colors = ['#4facfe', '#a855f7', '#f472b6', '#34d399', '#fbbf24'];

  for (let i = 0; i < 25; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = 4 + Math.random() * 12;
    const color = colors[Math.floor(Math.random() * colors.length)];
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.background = color;
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = 15 + Math.random() * 25 + 's';
    particle.style.animationDelay = -(Math.random() * 30) + 's';
    container.appendChild(particle);
  }
}

// ---- Init ----
function init() {
  updateClock();
  setInterval(updateClock, 1000);

  updateDayProgress();
  setInterval(updateDayProgress, 60000);

  initWeather();
  initTimeline();
  initMoodTracker();
  initHabits();
  initActivityChart();
  initNotes();
  initTimer();
  initQuote();
  initParticles();

  // Refresh timeline every minute to update current status
  setInterval(initTimeline, 60000);
}

document.addEventListener('DOMContentLoaded', init);
