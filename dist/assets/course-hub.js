(() => {
  const rawExamples = {
    tide: {
      title: '潮汐分潮振幅比较',
      description: '比较不同站点的主要分潮，适合用分组条形图或多集条形图。相位是圆周量，不应和振幅共用同一线性轴。',
      mappings: [['图形', 'Multi-set bar chart'], ['横轴', 'constituent'], ['数值 / 颜色', 'amplitude_m / station']],
      file: 'assets/data/rawgraphs-tidal-constituents.csv',
      headers: ['station', 'constituent', 'amplitude_m'],
      rows: [['Honolulu', 'M2', '0.17'], ['Honolulu', 'K1', '0.20'], ['San Francisco', 'M2', '0.58']]
    },
    eof: {
      title: 'EOF 方差贡献率',
      description: '用条形图展示各模态贡献率，并检查累计贡献率；模态编号是有序类别，不应被当作连续物理坐标。',
      mappings: [['图形', 'Bar chart'], ['横轴', 'mode'], ['数值 / 颜色', 'variance_percent / dataset']],
      file: 'assets/data/rawgraphs-eof-variance.csv',
      headers: ['dataset', 'mode', 'variance_percent'],
      rows: [['ERSSTv5', 'EOF1', '31.8'], ['ERSSTv5', 'EOF2', '12.6'], ['ERSSTv5', 'EOF3', '7.4']]
    },
    watermass: {
      title: '水团温盐关系',
      description: 'T–S 点适合散点图：盐度映射到横轴、温度映射到纵轴、水团或深度映射到颜色。正式分析还应叠加等密度线。',
      mappings: [['图形', 'Scatterplot'], ['横轴 / 纵轴', 'salinity / temperature_c'], ['颜色 / 大小', 'water_mass / depth_m']],
      file: 'assets/data/rawgraphs-water-masses.csv',
      headers: ['water_mass', 'temperature_c', 'salinity', 'depth_m'],
      rows: [['Surface', '24.5', '34.2', '10'], ['Central', '12.0', '35.1', '500'], ['Deep', '2.2', '34.7', '3000']]
    }
  };

  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const rawPreview = document.getElementById('rawPreview');
  const rawDownload = document.getElementById('rawDownload');
  const rawTabs = [...document.querySelectorAll('[data-raw-example]')];

  function renderRawExample(key) {
    const item = rawExamples[key];
    if (!item || !rawPreview) return;
    rawPreview.innerHTML = `<h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><div class="mapping-grid">${item.mappings.map(([label, value]) => `<div><b>${escape(label)}</b><span>${escape(value)}</span></div>`).join('')}</div><table class="mini-table"><thead><tr>${item.headers.map(header => `<th>${escape(header)}</th>`).join('')}</tr></thead><tbody>${item.rows.map(row => `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    rawDownload.href = item.file;
    rawTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.rawExample === key));
  }

  rawTabs.forEach(tab => tab.addEventListener('click', () => renderRawExample(tab.dataset.rawExample)));
  renderRawExample('tide');

  const progressInputs = [...document.querySelectorAll('#rawSteps input')];
  const progressText = document.getElementById('rawProgressText');
  const progressBar = document.getElementById('rawProgressBar');
  let rawState = {};
  try { rawState = JSON.parse(localStorage.getItem('dpo-rawgraphs-progress') || '{}'); } catch (_) {}
  progressInputs.forEach(input => {
    input.checked = Boolean(rawState[input.value]);
    input.addEventListener('change', () => {
      rawState[input.value] = input.checked;
      try { localStorage.setItem('dpo-rawgraphs-progress', JSON.stringify(rawState)); } catch (_) {}
      updateRawProgress();
    });
  });
  function updateRawProgress() {
    const completed = progressInputs.filter(input => input.checked).length;
    if (progressText) progressText.textContent = `${completed} / ${progressInputs.length}`;
    if (progressBar) progressBar.style.width = `${completed / progressInputs.length * 100}%`;
  }
  updateRawProgress();

  const tickets = [
    {topic:'海水物性', question:'为什么比较不同深度水团时，原位温度往往不如位温合适？', key:['水团升降会发生绝热压缩或膨胀，原位温度因此随压力改变。','位温把水团绝热移到统一参考压力，便于比较热力状态。','深层水团分析仍需写明参考压力，并注意非线性状态方程。']},
    {topic:'层结', question:'稳定层结中的密度为什么必须总体随深度增加？N² 又表达什么？', key:['较重海水位于较轻海水下方，微小垂向位移会产生回复力。','N² 是层结稳定度的量度；N² > 0 表示稳定，数值越大回复振荡越快。','真实剖面计算前需处理噪声与静力不稳定翻转。']},
    {topic:'T_TIDE', question:'为什么一年的逐小时水位记录通常比一个月记录更适合分离相近分潮？', key:['记录长度决定频率分辨率，近似为 1/T。','更长记录更容易区分频率接近的分潮，并更可靠地估计振幅和相位。','缺测、非平稳性和气象残差仍会影响结果，不能只看记录长度。']},
    {topic:'EOF', question:'EOF1 方差贡献率最高，为什么仍不能直接说它就是某个确定的动力过程？', key:['EOF 是在给定变量、区域、时段和预处理下最大化方差的统计模态。','正交约束是数学约束，不保证对应独立物理过程。','解释需要结合风场、海表高度、时间系数、敏感性试验和独立证据。']},
    {topic:'专题 Story', question:'沿岸俘获波与普通风浪最关键的尺度和约束差异是什么？', key:['沿岸俘获波通常是数天至数月的低频过程，风浪多为秒级。','前者受海岸、地球自转、层结和陆架地形约束，沿岸传播并向外海衰减。','两者研究变量和采样策略不同，不能仅凭海面起伏混为一谈。']}
  ];
  let ticketIndex = 0;
  let ticketAnswers = {};
  try { ticketAnswers = JSON.parse(localStorage.getItem('dpo-exit-ticket') || '{}'); } catch (_) {}
  const ticketTopic = document.getElementById('ticketTopic');
  const ticketQuestion = document.getElementById('ticketQuestion');
  const ticketAnswer = document.getElementById('ticketAnswer');
  const ticketKey = document.getElementById('ticketKey');
  const ticketKeyText = document.getElementById('ticketKeyText');
  const ticketCount = document.getElementById('ticketCount');
  const ticketDots = document.getElementById('ticketDots');
  const ticketState = document.getElementById('ticketSaveState');

  function renderTicket() {
    if (!ticketQuestion) return;
    const item = tickets[ticketIndex];
    ticketTopic.textContent = item.topic;
    ticketQuestion.textContent = item.question;
    ticketAnswer.value = ticketAnswers[ticketIndex] || '';
    ticketKey.open = false;
    ticketKeyText.innerHTML = `<ul>${item.key.map(point => `<li>${escape(point)}</li>`).join('')}</ul>`;
    ticketCount.textContent = `${String(ticketIndex + 1).padStart(2, '0')} / ${String(tickets.length).padStart(2, '0')}`;
    ticketDots.innerHTML = tickets.map((_, index) => `<button type="button" data-ticket-index="${index}" class="${index === ticketIndex ? 'active' : ''} ${ticketAnswers[index] ? 'done' : ''}" aria-label="第${index + 1}题"></button>`).join('');
    ticketDots.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      saveCurrentTicket(false);
      ticketIndex = Number(button.dataset.ticketIndex);
      renderTicket();
    }));
    ticketState.textContent = ticketAnswers[ticketIndex] ? '已恢复这道题的本机记录。' : '';
  }

  function saveCurrentTicket(showMessage = true) {
    if (!ticketAnswer) return;
    const value = ticketAnswer.value.trim();
    if (value) ticketAnswers[ticketIndex] = value;
    else delete ticketAnswers[ticketIndex];
    try { localStorage.setItem('dpo-exit-ticket', JSON.stringify(ticketAnswers)); } catch (_) {}
    if (showMessage) ticketState.textContent = value ? '已保存在当前浏览器。' : '本题为空，未保存。';
  }

  document.getElementById('ticketSave')?.addEventListener('click', () => {
    saveCurrentTicket();
    ticketIndex = (ticketIndex + 1) % tickets.length;
    window.setTimeout(renderTicket, 350);
  });
  document.getElementById('ticketPrev')?.addEventListener('click', () => {
    saveCurrentTicket(false);
    ticketIndex = (ticketIndex - 1 + tickets.length) % tickets.length;
    renderTicket();
  });
  document.getElementById('ticketReset')?.addEventListener('click', () => {
    ticketAnswers = {};
    ticketIndex = 0;
    try { localStorage.removeItem('dpo-exit-ticket'); } catch (_) {}
    renderTicket();
    ticketState.textContent = '已清空本机出门票记录。';
  });
  renderTicket();
})();

