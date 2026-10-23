(() => {
  const tbody = document.querySelector('.wave-family-table tbody');
  const tableScroll = document.querySelector('.wave-table-scroll');
  if (!tbody || !tableScroll) return;

  const waves = [
    {name:'Intermediate-depth',zh:'中等水深表面重力波',en:'Intermediate-depth surface gravity wave',restZh:'重力；自由表面',restEn:'Gravity; free surface',scaleZh:'1/20 ≤ h/λ ≤ 1/2',scaleEn:'1/20 ≤ h/λ ≤ 1/2',propZh:'整层水深影响轨道和波速',propEn:'Finite depth affects orbital motion and speed',dispZh:'色散',dispEn:'Dispersive',tone:'yes',formula:'ω² = gk tanh(kh)',groups:['surface']},
    {name:'Infragravity',zh:'次重力波',en:'Infragravity wave',restZh:'重力；短波群调制与破碎带强迫',restEn:'Gravity; forcing by short-wave groups and breaking',scaleZh:'约 25–300 s；近岸至陆架',scaleEn:'About 25–300 s; nearshore to shelf',propZh:'长周期表面波，可沿岸或离岸传播',propEn:'Long-period surface wave; alongshore or cross-shore',dispZh:'浅水时弱色散',dispEn:'Weakly dispersive in shallow water',tone:'mixed',formula:'ω < wind-wave band',groups:['surface','forced']},
    {name:'Edge',zh:'边缘波',en:'Edge wave',restZh:'重力 + 岸线边界',restEn:'Gravity + shoreline boundary',scaleZh:'近岸；离岸指数衰减',scaleEn:'Nearshore; exponential offshore decay',propZh:'沿岸传播或形成驻波模态',propEn:'Alongshore propagation or standing modes',dispZh:'模态色散',dispEn:'Modal dispersion',tone:'yes',formula:'A ∝ e<sup>−kx</sup>',groups:['surface','interior']},
    {name:'Seiche',zh:'湖振／港湾振荡',en:'Seiche / harbour oscillation',restZh:'重力 + 封闭或半封闭盆地边界',restEn:'Gravity + enclosed or semi-enclosed basin',scaleZh:'分钟至小时；盆地长度尺度',scaleEn:'Minutes to hours; basin length scale',propZh:'反射叠加形成驻波与共振',propEn:'Reflections form standing waves and resonance',dispZh:'由盆地模态决定',dispEn:'Set by basin modes',tone:'mixed',formula:'Tₙ ≈ 2L/(n√gh)',groups:['surface','forced']},
    {name:'Meteotsunami',zh:'气象海啸',en:'Meteotsunami',restZh:'重力；移动气压或风强迫',restEn:'Gravity; moving pressure or wind forcing',scaleZh:'分钟至小时；陆架和港湾',scaleEn:'Minutes to hours; shelf and harbour',propZh:'强迫长波，Proudman 共振可放大',propEn:'Forced long wave; Proudman resonance can amplify it',dispZh:'浅水长波近似',dispEn:'Shallow-water long-wave limit',tone:'mixed',formula:'U<sub>forcing</sub> ≈ √(gh)',groups:['surface','atmosphere','forced']},
    {name:'Internal tide',zh:'内潮',en:'Internal tide',restZh:'层结浮力 + 周期性潮汐强迫',restEn:'Stratification + periodic tidal forcing',scaleZh:'小时周期；公里至盆地尺度',scaleEn:'Tidal periods; kilometres to basin scale',propZh:'由海脊或陆坡转换，在海洋内部传播',propEn:'Generated over ridges or slopes and propagates internally',dispZh:'模态色散',dispEn:'Modal and dispersive',tone:'yes',formula:'ω = ω<sub>M2,K1,…</sub>',groups:['interior','forced']},
    {name:'Near-inertial',zh:'近惯性内波',en:'Near-inertial internal wave',restZh:'科氏力 + 层结浮力',restEn:'Coriolis + stratification',scaleZh:'频率接近 |f|；天气尺度激发',scaleEn:'Frequency near |f|; weather-scale forcing',propZh:'风暴后能量从混合层向内部辐射',propEn:'Storm energy radiates from the mixed layer into the interior',dispZh:'强色散',dispEn:'Strongly dispersive',tone:'yes',formula:'ω ≳ |f|',groups:['interior','rotating']},
    {name:'Internal solitary',zh:'内孤立波',en:'Internal solitary wave',restZh:'浮力 + 非线性与色散平衡',restEn:'Buoyancy + balance of nonlinearity and dispersion',scaleZh:'百米至数十公里；分钟至小时',scaleEn:'Hundreds of metres to tens of kilometres; minutes to hours',propZh:'孤立波包沿跃层或连续层结传播',propEn:'Localized packets travel along an interface or stratification',dispZh:'非线性色散波',dispEn:'Nonlinear dispersive wave',tone:'yes',formula:'η = a sech²[(x−ct)/L]',groups:['interior','forced']},
    {name:'Poincaré',zh:'Poincaré／惯性重力波',en:'Poincaré / inertia–gravity wave',restZh:'重力或浮力 + 科氏力',restEn:'Gravity or buoyancy + Coriolis',scaleZh:'频率高于局地惯性频率',scaleEn:'Frequency above the local inertial frequency',propZh:'海洋与大气中的旋转重力波',propEn:'Rotating gravity wave in ocean and atmosphere',dispZh:'色散',dispEn:'Dispersive',tone:'yes',formula:'ω² = f² + c²K²',groups:['interior','rotating','atmosphere']},
    {name:'Inertial',zh:'惯性振荡',en:'Inertial oscillation',restZh:'科氏力',restEn:'Coriolis acceleration',scaleZh:'周期 T<sub>f</sub> = 2π/|f|',scaleEn:'Period T<sub>f</sub> = 2π/|f|',propZh:'理想极限为水团原地旋转，是波数趋零极限',propEn:'Local parcel rotation in the ideal limit; zero-wavenumber limit',dispZh:'局地振荡极限',dispEn:'Local-oscillation limit',tone:'mixed',formula:'ω = ±f',groups:['rotating']},
    {name:'Coastally trapped',zh:'沿岸俘获波／陆架波',en:'Coastally trapped / shelf wave',restZh:'科氏力 + 重力 + 地形位涡梯度',restEn:'Coriolis + gravity + topographic PV gradient',scaleZh:'数日至数周；陆架宽度至数百公里',scaleEn:'Days to weeks; shelf width to hundreds of kilometres',propZh:'沿岸传播、离岸衰减；包含多阶模态',propEn:'Alongshore propagation and offshore decay; multiple modes',dispZh:'通常色散',dispEn:'Usually dispersive',tone:'yes',formula:'q = (f+ζ)/H',groups:['interior','rotating']},
    {name:'Equatorial Rossby',zh:'赤道 Rossby 波',en:'Equatorial Rossby wave',restZh:'赤道 β 效应与位涡守恒',restEn:'Equatorial β effect + PV conservation',scaleZh:'天气至季节尺度；赤道变形半径',scaleEn:'Weather to seasonal scales; equatorial deformation radius',propZh:'相位通常向西，存在不同南北模态',propEn:'Usually westward phase with multiple meridional modes',dispZh:'色散',dispEn:'Dispersive',tone:'yes',formula:'n ≥ 1 equatorial modes',groups:['rotating','atmosphere']},
    {name:'Yanai / MRG',zh:'混合 Rossby–重力波（Yanai 波）',en:'Mixed Rossby–gravity (Yanai) wave',restZh:'赤道 β 效应 + 重力',restEn:'Equatorial β effect + gravity',scaleZh:'赤道天气尺度；n = 0 模态',scaleEn:'Equatorial synoptic scale; n = 0 mode',propZh:'兼具 Rossby 与惯性重力波性质',propEn:'Shares Rossby and inertia–gravity characteristics',dispZh:'强色散',dispEn:'Strongly dispersive',tone:'yes',formula:'n = 0 mixed mode',groups:['rotating','atmosphere']},
    {name:'Equatorial IG',zh:'赤道惯性重力波（东传／西传）',en:'Equatorial inertia–gravity wave (eastward / westward)',restZh:'重力 + 赤道旋转约束',restEn:'Gravity + equatorial rotational trapping',scaleZh:'数小时至数日；赤道波导',scaleEn:'Hours to days; equatorial waveguide',propZh:'存在东传与西传分支',propEn:'Has eastward- and westward-propagating branches',dispZh:'色散',dispEn:'Dispersive',tone:'yes',formula:'ω² ≈ c²k²+(2n+1)βc',groups:['rotating','atmosphere']},
    {name:'Atmospheric gravity',zh:'大气重力波',en:'Atmospheric gravity wave',restZh:'稳定层结中的浮力',restEn:'Buoyancy in stable stratification',scaleZh:'分钟至小时；米至上千公里',scaleEn:'Minutes to hours; metres to thousands of kilometres',propZh:'可向上传能量并造成动量沉积',propEn:'Can carry energy upward and deposit momentum',dispZh:'色散且各向异性',dispEn:'Dispersive and anisotropic',tone:'yes',formula:'|f| < ω < N',groups:['atmosphere','interior']},
    {name:'Mountain',zh:'山岳波／地形重力波',en:'Mountain / orographic gravity wave',restZh:'浮力；气流越过地形的定常强迫',restEn:'Buoyancy; stationary forcing by flow over terrain',scaleZh:'山脉至中尺度；下风侧波列',scaleEn:'Mountain to mesoscale; lee-wave trains',propZh:'对地近似定常，能量可向上传播',propEn:'Nearly stationary to the ground; energy may propagate upward',dispZh:'受风切变和层结控制',dispEn:'Controlled by shear and stratification',tone:'mixed',formula:'ω<sub>ground</sub> ≈ 0',groups:['atmosphere','forced']},
    {name:'Lamb',zh:'Lamb 波',en:'Lamb wave',restZh:'压缩性 + 重力；近地面边界',restEn:'Compressibility + gravity; lower boundary',scaleZh:'全球至天气尺度；常近声速传播',scaleEn:'Global to synoptic scale; often near acoustic speed',propZh:'水平传播、垂向结构近似倏逝',propEn:'Horizontal propagation with vertically evanescent structure',dispZh:'近似弱色散',dispEn:'Approximately weakly dispersive',tone:'mixed',formula:'c ≈ √(g h<sub>e</sub>)',groups:['atmosphere']},
    {name:'Acoustic',zh:'声波',en:'Acoustic wave',restZh:'可压缩性与压力梯度',restEn:'Compressibility + pressure gradient',scaleZh:'高频；从局地到全球',scaleEn:'High frequency; local to global',propZh:'可在大气和可压缩海水中传播',propEn:'Propagates in the atmosphere and compressible seawater',dispZh:'理想均匀介质近似非色散',dispEn:'Nearly non-dispersive in an ideal uniform medium',tone:'no',formula:'c<sub>s</sub> = √(γRT)',groups:['atmosphere','interior']},
    {name:'Atmospheric tides',zh:'大气潮汐',en:'Atmospheric tide',restZh:'太阳加热或引潮力 + 大气本征模态',restEn:'Solar heating or tidal gravity + atmospheric normal modes',scaleZh:'8 h、12 h、24 h 等；全球尺度',scaleEn:'8 h, 12 h, 24 h, etc.; global scale',propZh:'迁移与非迁移潮汐，可向上传播',propEn:'Migrating and nonmigrating tides; may propagate upward',dispZh:'受迫模态',dispEn:'Forced modal response',tone:'mixed',formula:'S1, S2, M2…',groups:['atmosphere','forced']},
    {name:'Synoptic baroclinic',zh:'斜压天气尺度 Rossby 波',en:'Synoptic baroclinic Rossby wave',restZh:'位涡梯度；从平均温度梯度取能',restEn:'PV gradient; extracts energy from mean temperature gradient',scaleZh:'约 1000–5000 km；数日',scaleEn:'About 1000–5000 km; several days',propZh:'中纬度槽脊和天气系统波包',propEn:'Midlatitude trough–ridge patterns and weather wave packets',dispZh:'色散并可不稳定增长',dispEn:'Dispersive and may grow by instability',tone:'yes',formula:'baroclinic instability + PV',groups:['atmosphere','rotating']},
    {name:'CCEW',zh:'对流耦合赤道波',en:'Convectively coupled equatorial wave',restZh:'赤道干动力模态 + 湿对流反馈',restEn:'Dry equatorial modes + moist-convective feedback',scaleZh:'数日至数周；热带行星尺度',scaleEn:'Days to weeks; tropical planetary scale',propZh:'Kelvin、ER、MRG、EIG／WIG 等湿耦合表现',propEn:'Moist counterparts of Kelvin, ER, MRG, and EIG/WIG modes',dispZh:'有效等效深度下色散',dispEn:'Dispersive with an effective equivalent depth',tone:'yes',formula:'dry modes + convection',groups:['atmosphere','rotating','forced']},
    {name:'MJO / moist mode',zh:'MJO／热带湿耦合模态',en:'MJO / tropical moist mode',restZh:'对流—水汽—环流—辐射耦合',restEn:'Coupled convection, moisture, circulation, and radiation',scaleZh:'约 30–60 d；行星尺度',scaleEn:'About 30–60 days; planetary scale',propZh:'主要向东传播；并非单一经典自由波',propEn:'Primarily eastward; not a single classical free wave',dispZh:'耦合慢模态',dispEn:'Coupled slow mode',tone:'mixed',formula:'moist coupled disturbance',groups:['atmosphere','forced']},
    {name:'Instability wave',zh:'不稳定波（正压／斜压／剪切）',en:'Instability wave (barotropic / baroclinic / shear)',restZh:'从平均流动能或有效位能取能',restEn:'Extracts mean kinetic or available potential energy',scaleZh:'从边界层到天气／中尺度',scaleEn:'Boundary-layer to synoptic or mesoscale',propZh:'扰动随流传播并增长，最终非线性饱和',propEn:'Perturbations propagate and grow, then saturate nonlinearly',dispZh:'增长型色散关系',dispEn:'Dispersion relation with growth',tone:'yes',formula:'Im(ω) > 0',groups:['interior','atmosphere','forced']}
  ];

  const existingGroups = [
    ['surface'], ['surface'], ['surface'], ['interior'], ['surface','forced'], ['rotating'], ['rotating']
  ];
  const domainLabel = groups => groups.includes('atmosphere') && groups.some(group => ['surface','interior','rotating'].includes(group)) ? 'OCEAN · ATMOS' : groups.includes('atmosphere') ? 'ATMOSPHERE' : 'OCEAN';
  const bilingual = (zh, en) => `<span class="zh-only">${zh}</span><span class="en-only">${en}</span>`;

  [...tbody.rows].forEach((row, index) => {
    const groups = existingGroups[index] || ['surface'];
    row.dataset.groups = groups.join(' ');
    const badge = document.createElement('span');
    badge.className = 'wave-domain-tag';
    badge.textContent = domainLabel(groups);
    row.cells[0]?.appendChild(badge);
  });

  waves.forEach(wave => {
    const row = document.createElement('tr');
    row.dataset.groups = wave.groups.join(' ');
    row.innerHTML = `<th scope="row"><b>${wave.name}</b>${bilingual(wave.zh,wave.en)}<span class="wave-domain-tag">${domainLabel(wave.groups)}</span></th><td>${bilingual(wave.restZh,wave.restEn)}</td><td>${bilingual(wave.scaleZh,wave.scaleEn)}</td><td>${bilingual(wave.propZh,wave.propEn)}</td><td><span class="dispersion ${wave.tone}">${bilingual(wave.dispZh,wave.dispEn)}</span></td><td><code>${wave.formula}</code></td>`;
    tbody.appendChild(row);
  });

  const total = tbody.rows.length;
  const headingZh = document.querySelector('.wave-table-heading h3 .zh-only');
  const headingEn = document.querySelector('.wave-table-heading h3 .en-only');
  const indexZh = document.querySelector('a[href="#chapter8-waves"] small .zh-only');
  const indexEn = document.querySelector('a[href="#chapter8-waves"] small .en-only');
  if (headingZh) headingZh.textContent = '海洋—大气主要波族与动力模态总表';
  if (headingEn) headingEn.textContent = 'Ocean–atmosphere wave families and dynamical modes';
  if (indexZh) indexZh.textContent = `四个核心问答与 ${total} 类波动总表`;
  if (indexEn) indexEn.textContent = `Four core questions and a ${total}-mode wave atlas`;

  const filters = [
    ['all','全部','All'],
    ['surface','海表与界面','Surface & interface'],
    ['interior','内部与沿岸','Interior & coastal'],
    ['rotating','旋转与赤道','Rotating & equatorial'],
    ['atmosphere','大气','Atmosphere'],
    ['forced','受迫与非线性','Forced & nonlinear']
  ];
  const controls = document.createElement('div');
  controls.className = 'wave-table-filters';
  controls.setAttribute('role','group');
  controls.setAttribute('aria-label','波动类型筛选');
  controls.innerHTML = filters.map(([key,zh,en],index) => `<button type="button" class="${index===0?'active':''}" data-wave-filter="${key}" aria-pressed="${index===0?'true':'false'}">${bilingual(zh,en)}</button>`).join('') + '<output aria-live="polite"></output>';
  const scope = document.createElement('p');
  scope.className = 'wave-table-scope';
  scope.innerHTML = `<b>${bilingual('范围说明','Scope')}</b>${bilingual('覆盖海洋学与大气科学课程中的主要标准波族、常见动力模态及重要受迫或耦合扰动。同一现象可能属于多个分类；局地别名与连续谱中的每个子模态不逐一拆行。','Covers the principal standard wave families, commonly taught dynamical modes, and major forced or coupled disturbances in oceanography and atmospheric science. One phenomenon may belong to several classes; local names and every submode of a continuous spectrum are not listed separately.')}`;
  tableScroll.before(controls, scope);

  const output = controls.querySelector('output');
  const buttons = [...controls.querySelectorAll('button')];
  const rows = [...tbody.rows];
  function updateCount(count) {
    output.textContent = document.body.dataset.language === 'en' ? `${count} of ${rows.length} entries` : `显示 ${count} / ${rows.length} 类`;
  }
  function filterRows(key) {
    let count = 0;
    rows.forEach(row => {
      const show = key === 'all' || row.dataset.groups.split(' ').includes(key);
      row.hidden = !show;
      if (show) count++;
    });
    buttons.forEach(button => {
      const active = button.dataset.waveFilter === key;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    controls.dataset.activeFilter = key;
    updateCount(count);
    tableScroll.scrollTo({top:0,left:0,behavior:'smooth'});
  }
  buttons.forEach(button => button.addEventListener('click', () => filterRows(button.dataset.waveFilter)));
  document.addEventListener('languagechange', () => {
    updateCount(rows.filter(row => !row.hidden).length);
    controls.setAttribute('aria-label', document.body.dataset.language === 'en' ? 'Wave-family filters' : '波动类型筛选');
  });
  filterRows('all');
})();
