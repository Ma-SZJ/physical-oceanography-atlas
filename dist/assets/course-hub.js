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

  const eofModes = [
    {
      zhTitle: 'EOF1 · 盆地尺度同号模态',
      enTitle: 'EOF1 · Basin-scale in-phase mode',
      zhDescription: '第一模态强调赤道中东太平洋的盆地尺度变化，可用于建立 ENSO 型空间结构的直觉。',
      enDescription: 'The first mode emphasizes basin-scale variability in the central-eastern equatorial Pacific, building intuition for an ENSO-like spatial pattern.',
      field: (lon, lat) => 1.18 * Math.exp(-Math.pow((lon - 222) / 47, 2) - Math.pow(lat / 9, 2)) - .28 * Math.exp(-Math.pow((lon - 145) / 25, 2) - Math.pow(lat / 13, 2))
    },
    {
      zhTitle: 'EOF2 · 东西偶极模态',
      enTitle: 'EOF2 · East-west dipole mode',
      zhDescription: '第二模态用东西反号结构说明 EOF 的正交约束；它可能反映传播、位相差或多个过程的混合。',
      enDescription: 'The second mode uses an east-west sign reversal to illustrate orthogonality; it may mix propagation, phase offsets, and several processes.',
      field: (lon, lat) => (Math.exp(-Math.pow((lon - 235) / 34, 2)) - .9 * Math.exp(-Math.pow((lon - 170) / 30, 2))) * Math.exp(-Math.pow(lat / 10, 2))
    },
    {
      zhTitle: 'EOF3 · 赤道—副热带对比',
      enTitle: 'EOF3 · Equator-subtropics contrast',
      zhDescription: '第三模态展示赤道带与两侧副热带的反号关系，提醒我们高阶模态更需要稳定性检验和独立证据。',
      enDescription: 'The third mode contrasts the equatorial band with the subtropics, reminding us that higher modes need stronger stability tests and independent evidence.',
      field: (lon, lat) => Math.exp(-Math.pow((lon - 210) / 52, 2)) * (Math.exp(-Math.pow(lat / 5.5, 2)) - .58 * Math.exp(-Math.pow((Math.abs(lat) - 14) / 5.5, 2)))
    }
  ];
  const eofQuestions = [
    {tagZh:'概念',tagEn:'Concept',qZh:'EOF 分解究竟把什么拆开？',qEn:'What does EOF analysis actually decompose?',aZh:'它把随时间变化的空间异常场表示为空间模态 EOF 与时间系数 PC 的乘积之和。每对 EOF–PC 描述一种统计协变结构，而不是自动命名一个物理过程。',aEn:'It represents a time-varying anomaly field as a sum of spatial EOF patterns multiplied by temporal PCs. Each EOF–PC pair is a statistical covariance structure, not an automatically identified physical process.'},
    {tagZh:'预处理',tagEn:'Preprocessing',qZh:'为什么常先去季节、去趋势并做面积权重？',qEn:'Why remove seasonality and trends, and apply area weighting?',aZh:'去季节突出非季节异常，去趋势避免长期变暖垄断方差；经纬网格再乘 √cosφ，可使不同纬度格点按代表面积进入协方差。是否执行每一步取决于研究问题。',aEn:'Deseasonalization isolates nonseasonal anomalies, detrending prevents long-term warming from dominating variance, and √cosφ weighting accounts for grid-cell area. Each choice must follow the research question.'},
    {tagZh:'符号',tagEn:'Sign',qZh:'EOF 和 PC 为什么可以同时反号？',qEn:'Why can an EOF and its PC both change sign?',aZh:'因为 EOF×PC 的乘积保持不变，整对模态乘以 −1 不改变重建场。跨研究比较时必须先统一符号约定，不能把正负号本身当作物理结论。',aEn:'Because the EOF×PC product is unchanged when both are multiplied by −1. Sign conventions must be aligned before comparing studies; the sign alone is not a physical conclusion.'},
    {tagZh:'显著性',tagEn:'Separation',qZh:'方差贡献高就说明模态稳定吗？',qEn:'Does a high variance fraction guarantee a stable mode?',aZh:'不一定。应查看相邻特征值是否可分离，例如使用 North 误差估计，并对时间段、区域、掩膜和预处理做敏感性试验。',aEn:'Not necessarily. Check whether neighboring eigenvalues are separable, for example with the North error estimate, and test sensitivity to period, domain, mask, and preprocessing.'},
    {tagZh:'解释',tagEn:'Interpretation',qZh:'为什么 EOF1 不能直接等同于 ENSO？',qEn:'Why should EOF1 not be equated directly with ENSO?',aZh:'EOF1 只是在既定数据、区域和预处理下解释方差最多的统计模态。把它解释为 ENSO，还要核对 PC 与 Niño3.4、风应力、海表高度及独立资料的关系。',aEn:'EOF1 is only the leading variance-maximizing mode for a chosen dataset, domain, and preprocessing. An ENSO interpretation requires checks against Niño3.4, wind stress, sea level, and independent evidence.'}
  ];
  const eofMap = document.getElementById('eofMap');
  const eofPc = document.getElementById('eofPc');
  const eofPhase = document.getElementById('eofPhase');
  const eofPhaseValue = document.getElementById('eofPhaseValue');
  const eofModeTitle = document.getElementById('eofModeTitle');
  const eofModeDescription = document.getElementById('eofModeDescription');
  const eofModeButtons = [...document.querySelectorAll('[data-eof-mode]')];
  let eofModeIndex = 0;
  let eofPlaying = false;
  let eofPlayFrame = 0;
  let eofDirection = 1;
  const activeLanguage = () => document.documentElement.lang.startsWith('en') ? 'en' : 'zh';
  const oceanColor = value => {
    const v = Math.max(-1, Math.min(1, value));
    if (v < 0) {
      const t = v + 1;
      return `rgb(${Math.round(42 + 166 * t)},${Math.round(85 + 137 * t)},${Math.round(166 + 71 * t)})`;
    }
    return `rgb(${Math.round(235 - 20 * v)},${Math.round(238 - 139 * v)},${Math.round(223 - 156 * v)})`;
  };
  function canvasScale(canvas) {
    if (!canvas) return null;
    const width = Math.max(300, Math.round(canvas.clientWidth || canvas.width));
    const height = Math.round(width * 410 / 760);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return {ctx, width, height};
  }
  function drawEofMap() {
    const scaled = canvasScale(eofMap);
    if (!scaled) return;
    const {ctx, width, height} = scaled;
    const pad = {l:48,r:18,t:22,b:36};
    const w = width - pad.l - pad.r, h = height - pad.t - pad.b;
    const phase = Number(eofPhase?.value || 100) / 100;
    ctx.fillStyle = '#061922'; ctx.fillRect(0,0,width,height);
    const cols = 64, rows = 24;
    for (let y=0;y<rows;y++) for (let x=0;x<cols;x++) {
      const lon = 120 + (x+.5)/cols*160;
      const lat = 20 - (y+.5)/rows*40;
      ctx.fillStyle = oceanColor(eofModes[eofModeIndex].field(lon,lat) * phase);
      ctx.fillRect(pad.l+x*w/cols,pad.t+y*h/rows,w/cols+1,h/rows+1);
    }
    ctx.strokeStyle='rgba(6,25,34,.28)';ctx.lineWidth=1;
    for (let lon=120;lon<=280;lon+=20){const x=pad.l+(lon-120)/160*w;ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,pad.t+h);ctx.stroke();ctx.fillStyle='#7d9da1';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(lon<=180?`${lon}°E`:`${360-lon}°W`,x,height-12)}
    for (let lat=-20;lat<=20;lat+=10){const y=pad.t+(20-lat)/40*h;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(pad.l+w,y);ctx.stroke();ctx.fillStyle='#7d9da1';ctx.textAlign='right';ctx.fillText(lat===0?'EQ':`${Math.abs(lat)}°${lat>0?'N':'S'}`,pad.l-7,y+3)}
    ctx.fillStyle='#0b3039';ctx.strokeStyle='#91aaa3';ctx.lineWidth=1;
    const poly=(points)=>{ctx.beginPath();points.forEach(([x,y],i)=>{const px=pad.l+(x-120)/160*w,py=pad.t+(20-y)/40*h;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.closePath();ctx.fill();ctx.stroke()};
    poly([[120,20],[147,20],[146,12],[137,6],[132,-5],[120,-8]]); poly([[128,-10],[152,-10],[156,-20],[120,-20],[120,-8]]); poly([[270,20],[280,20],[280,-20],[273,-20],[276,-5],[269,8]]);
    ctx.setLineDash([6,4]);ctx.strokeStyle='#f4c766';ctx.lineWidth=1.5;const nx=pad.l+(190-120)/160*w,ny=pad.t+(20-5)/40*h,nw=50/160*w,nh=10/40*h;ctx.strokeRect(nx,ny,nw,nh);ctx.setLineDash([]);ctx.fillStyle='#ffe197';ctx.textAlign='left';ctx.font='bold 10px system-ui';ctx.fillText('Niño 3.4',nx+4,ny-5);
  }
  function drawEofPc() {
    const scaled = canvasScale(eofPc);
    if (!scaled) return;
    const {ctx,width,height}=scaled,pad={l:42,r:18,t:22,b:36},w=width-pad.l-pad.r,h=height-pad.t-pad.b;
    ctx.fillStyle='#061922';ctx.fillRect(0,0,width,height);ctx.strokeStyle='rgba(153,195,198,.14)';ctx.lineWidth=1;
    [-2,-1,0,1,2].forEach(v=>{const y=pad.t+(2.6-v)/5.2*h;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(pad.l+w,y);ctx.stroke();ctx.fillStyle='#76979c';ctx.textAlign='right';ctx.font='10px system-ui';ctx.fillText(v,pad.l-7,y+3)});
    const points=144,fn=[i=>.9*Math.sin(i*.16)+.45*Math.sin(i*.47),i=>.8*Math.cos(i*.11+.7)+.5*Math.sin(i*.29),i=>.7*Math.sin(i*.21+1.4)+.38*Math.cos(i*.53)][eofModeIndex];
    ctx.beginPath();for(let i=0;i<points;i++){const x=pad.l+i/(points-1)*w,y=pad.t+(2.6-fn(i))/5.2*h;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle='#5fe0d2';ctx.lineWidth=2;ctx.stroke();
    ['1982','1992','2002','2012','2023'].forEach((year,i)=>{const x=pad.l+i/4*w;ctx.fillStyle='#76979c';ctx.textAlign=i===0?'left':i===4?'right':'center';ctx.fillText(year,x,height-12)});
    const phase=Number(eofPhase?.value||100)/100,x=pad.l+w*.72,y=pad.t+(2.6-phase)/5.2*h;ctx.setLineDash([4,4]);ctx.strokeStyle='#f4c766';ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,pad.t+h);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#f4c766';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
  }
  function renderEofVariance() {
    const host=document.getElementById('eofVarianceBars'); if(!host)return;
    const values=[32,13,8]; const lang=activeLanguage();
    host.innerHTML=values.map((value,index)=>`<div class="variance-row"><span>EOF${index+1}</span><i style="--bar:${value/32*100}%"></i><b>${lang==='en'?'example ':'示例 '}${value}%</b></div>`).join('');
  }
  function renderEofMode() {
    const mode=eofModes[eofModeIndex],lang=activeLanguage();
    if(eofModeTitle)eofModeTitle.textContent=lang==='en'?mode.enTitle:mode.zhTitle;
    if(eofModeDescription)eofModeDescription.textContent=lang==='en'?mode.enDescription:mode.zhDescription;
    eofModeButtons.forEach((button,index)=>{button.classList.toggle('active',index===eofModeIndex);button.setAttribute('aria-selected',String(index===eofModeIndex))});
    drawEofMap();drawEofPc();renderEofVariance();
  }
  eofModeButtons.forEach((button,index)=>button.addEventListener('click',()=>{eofModeIndex=index;renderEofMode()}));
  eofPhase?.addEventListener('input',()=>{const value=Number(eofPhase.value)/100;eofPhaseValue.textContent=`${value>=0?'+':''}${value.toFixed(1)}σ`;drawEofMap();drawEofPc()});
  function animateEof(){if(!eofPlaying)return;let value=Number(eofPhase.value)+eofDirection*3;if(value>=250||value<=-250)eofDirection*=-1;eofPhase.value=String(Math.max(-250,Math.min(250,value)));eofPhase.dispatchEvent(new Event('input'));eofPlayFrame=requestAnimationFrame(animateEof)}
  document.getElementById('eofPlay')?.addEventListener('click',event=>{eofPlaying=!eofPlaying;event.currentTarget.textContent=eofPlaying?(activeLanguage()==='en'?'❚❚ Pause':'❚❚ 暂停'):(activeLanguage()==='en'?'▶ Play phase':'▶ 播放位相');if(eofPlaying)animateEof();else cancelAnimationFrame(eofPlayFrame)});
  window.addEventListener('resize',()=>{drawEofMap();drawEofPc()});

  let eofQaIndex=0,eofQaTimer=0;
  const eofQaRoot=document.querySelector('.eof-qa'),eofQaQuestion=document.getElementById('eofQaQuestion'),eofQaAnswer=document.getElementById('eofQaAnswer'),eofQaTag=document.getElementById('eofQaTag'),eofQaCount=document.getElementById('eofQaCount'),eofQaDots=document.getElementById('eofQaDots');
  function renderEofQa(){const item=eofQuestions[eofQaIndex],lang=activeLanguage();eofQaTag.textContent=lang==='en'?item.tagEn:item.tagZh;eofQaQuestion.textContent=lang==='en'?item.qEn:item.qZh;eofQaAnswer.textContent=lang==='en'?item.aEn:item.aZh;eofQaCount.textContent=`${String(eofQaIndex+1).padStart(2,'0')} / 05`;eofQaDots.innerHTML=eofQuestions.map((_,index)=>`<button type="button" class="${index===eofQaIndex?'active':''}" data-eof-qa="${index}" aria-label="${lang==='en'?`Question ${index+1}`:`第 ${index+1} 题`}"></button>`).join('');eofQaDots.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{eofQaIndex=Number(button.dataset.eofQa);renderEofQa();restartEofQa()}))}
  function moveEofQa(step){eofQaIndex=(eofQaIndex+step+eofQuestions.length)%eofQuestions.length;renderEofQa()}
  function restartEofQa(){clearInterval(eofQaTimer);if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)eofQaTimer=setInterval(()=>moveEofQa(1),8000)}
  document.getElementById('eofQaPrev')?.addEventListener('click',()=>{moveEofQa(-1);restartEofQa()});document.getElementById('eofQaNext')?.addEventListener('click',()=>{moveEofQa(1);restartEofQa()});
  eofQaRoot?.addEventListener('mouseenter',()=>clearInterval(eofQaTimer));eofQaRoot?.addEventListener('mouseleave',restartEofQa);eofQaRoot?.addEventListener('focusin',()=>clearInterval(eofQaTimer));eofQaRoot?.addEventListener('focusout',restartEofQa);eofQaRoot?.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')moveEofQa(-1);if(event.key==='ArrowRight')moveEofQa(1)});
  document.addEventListener('languagechange',()=>{renderEofMode();renderEofQa();const play=document.getElementById('eofPlay');if(play)play.textContent=eofPlaying?(activeLanguage()==='en'?'❚❚ Pause':'❚❚ 暂停'):(activeLanguage()==='en'?'▶ Play phase':'▶ 播放位相')});
  renderEofMode();renderEofQa();restartEofQa();
})();
