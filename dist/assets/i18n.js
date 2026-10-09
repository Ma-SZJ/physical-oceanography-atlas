(() => {
  const dictionary = window.DPO_I18N || {};
  const containsChinese = value => /[\u3400-\u9fff]/.test(value || '');
  const entries = Object.entries(dictionary).filter(([source]) => containsChinese(source)).sort((a, b) => b[0].length - a[0].length);
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const attributes = ['alt', 'title', 'aria-label', 'placeholder'];
  const controls = [...document.querySelectorAll('.language-switch [data-language]')];
  let language = 'zh';
  let applying = false;

  function translated(value) {
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    const core = value.trim();
    if (!core || !containsChinese(core)) return value;
    if (dictionary[core]) return leading + dictionary[core] + trailing;
    let result = core;
    for (const [source, target] of entries) {
      if (source.length < 2 || !result.includes(source)) continue;
      result = result.split(source).join(target);
      if (!containsChinese(result)) break;
    }
    result = result
      .replace(/第\s*(\d+)\s*题/g, 'Question $1')
      .replace(/第\s*(\d+)\s*页/g, 'Slide $1')
      .replace(/示例\s*([\d.]+)%/g, 'Example $1%')
      .replace(/([\d.]+)\s*幅/g, '$1 figures');
    return leading + result + trailing;
  }

  function shouldSkip(node) {
    const parent = node.parentElement;
    return !parent || Boolean(parent.closest('script, style, noscript, code, pre'));
  }

  function applyTextNode(node) {
    if (shouldSkip(node)) return;
    const current = node.nodeValue || '';
    if (language === 'en') {
      if (containsChinese(current)) originalText.set(node, current);
      const source = originalText.get(node) || current;
      const next = translated(source);
      if (next !== current) node.nodeValue = next;
    } else if (originalText.has(node) && current !== originalText.get(node)) {
      node.nodeValue = originalText.get(node);
    }
  }

  function applyElementAttributes(element) {
    if (!(element instanceof Element)) return;
    let originals = originalAttributes.get(element);
    if (!originals) { originals = {}; originalAttributes.set(element, originals); }
    for (const attribute of attributes) {
      if (!element.hasAttribute(attribute)) continue;
      const current = element.getAttribute(attribute) || '';
      if (language === 'en') {
        if (containsChinese(current)) originals[attribute] = current;
        const source = originals[attribute] || current;
        element.setAttribute(attribute, translated(source));
      } else if (originals[attribute] != null) {
        element.setAttribute(attribute, originals[attribute]);
      }
    }
  }

  function applyRoot(root = document.body) {
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) applyTextNode(root);
      if (root.nodeType === Node.ELEMENT_NODE) applyElementAttributes(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE) applyTextNode(node);
        else applyElementAttributes(node);
      }
    } finally { applying = false; }
  }

  function setLanguage(next, persist = true) {
    language = next === 'en' ? 'en' : 'zh';
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.body.dataset.language = language;
    controls.forEach(button => {
      const active = button.dataset.language === language;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    applyRoot();
    document.title = language === 'en' ? 'Descriptive Physical Oceanography · Course Site' : '描述性物理海洋 · 课程网站';
    if (persist) { try { localStorage.setItem('dpo-language', language); } catch (_) {} }
    document.dispatchEvent(new CustomEvent('languagechange', {detail: {language}}));
    requestAnimationFrame(() => applyRoot());
  }

  controls.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  const observer = new MutationObserver(mutations => {
    if (applying || language !== 'en') return;
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') applyTextNode(mutation.target);
      mutation.addedNodes?.forEach(node => applyRoot(node));
    }
  });
  observer.observe(document.body, {subtree: true, childList: true, characterData: true});
  let initial = 'zh';
  try { initial = localStorage.getItem('dpo-language') || 'zh'; } catch (_) {}
  setLanguage(initial, false);
})();
