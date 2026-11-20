const originalUrl = 'https://certified.elastic.co/ef4ad0fb-892d-4afa-98f1-c8e5024cf2dc';
const credentialUrl = 'https://certifiedelastic.com/3f3199a5-9059-4ac1-a82d-21e44f9af4dc#acc.ynpt7XOC';
const credentialId = '3f3199a5-9059-4ac1-a82d-21e44f9af4dc';
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const dialog = $('#action-dialog');
const dialogContent = $('#dialog-content');
let toastTimer;

function toast(message) {
  const target = $('#toast');
  target.textContent = message;
  target.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { target.hidden = true; }, 3200);
}

function openDialog(title, content) {
  $('#dialog-title').textContent = title;
  dialogContent.innerHTML = content;
  if (!dialog.open) dialog.showModal();
}

$('.dialog-close').addEventListener('click', () => dialog.close());
// Scroll without replacing the credential URL's required fragment.
$$('a[href^="#"]').forEach(anchor => {
  const target = document.getElementById(anchor.getAttribute('href').slice(1));
  if (!target) return;
  anchor.addEventListener('click', event => {
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
  });
});
dialog.addEventListener('click', (event) => {
  const box = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  $$('[aria-expanded="true"][aria-haspopup]').forEach(button => button.setAttribute('aria-expanded', 'false'));
});

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard');
  } catch {
    openDialog('Copy to clipboard', '<p>Select and copy the text below.</p><textarea id="copy-fallback" readonly></textarea>');
    $('#copy-fallback').value = text;
    $('#copy-fallback').select();
  }
}

const cookieBanner = $('.cookies-banner');
try { if (localStorage.getItem('elastic-cookie-dismissed') === 'true') cookieBanner.hidden = true; } catch { /* Storage may be disabled. */ }
$('button', cookieBanner).addEventListener('click', () => {
  cookieBanner.hidden = true;
  try { localStorage.setItem('elastic-cookie-dismissed', 'true'); } catch { /* Session-only dismissal still works. */ }
});

// Recreate the source application's responsive certificate scaling without its runtime.
const banner = $('rp-credential-banner .banner');
const certificate = $('#certificatePanel');
const certificateArtwork = $('.certificate-artwork', certificate);
const certificateWidth = Number(certificateArtwork.getAttribute('width'));
const certificateHeight = Number(certificateArtwork.getAttribute('height'));
function fitCertificate() {
  if (certificate.hidden) return;
  const width = Math.max(1, banner.clientWidth - 2);
  const height = width * certificateHeight / certificateWidth;
  certificate.style.width = `${width}px`;
  certificate.style.height = `${height}px`;
}
new ResizeObserver(fitCertificate).observe(banner);
fitCertificate();

const badgePanel = document.createElement('div');
badgePanel.id = 'badgePanel';
badgePanel.className = 'badge-wrapper';
badgePanel.setAttribute('role', 'tabpanel');
badgePanel.setAttribute('aria-labelledby', 'badge-tab');
badgePanel.hidden = true;
badgePanel.append($('accredible-badge', $('#badge-tab')).cloneNode(true));
banner.append(badgePanel);
function selectTab(id, moveFocus = false) {
  const isBadge = id === 'badge-tab';
  certificate.hidden = isBadge;
  badgePanel.hidden = !isBadge;
  $$('.switcher [role="tab"]').forEach(tab => {
    const selected = tab.id === id;
    tab.classList.toggle('selected', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) tab.focus();
  });
  fitCertificate();
}
$$('.switcher [role="tab"]').forEach(tab => {
  tab.addEventListener('click', () => selectTab(tab.id));
  tab.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const id = event.key === 'Home' ? 'certificate-tab' : event.key === 'End' ? 'badge-tab' : tab.id === 'badge-tab' ? 'certificate-tab' : 'badge-tab';
      selectTab(id, true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); selectTab(tab.id);
    }
  });
});

const expandButton = $('.expand-button-container button');
expandButton.addEventListener('click', () => {
  const expanded = expandButton.getAttribute('aria-expanded') !== 'true';
  expandButton.setAttribute('aria-expanded', String(expanded));
  $('#credential-details').classList.toggle('expanded', expanded);
  $('#credential-details').classList.toggle('el-with-content-fade', !expanded);
  $('.mdc-button__label span', expandButton).textContent = expanded ? 'Show less' : 'Show more';
});

function downloadOptions() {
  openDialog('Download Options', `
    <div class="download-options">
      <button type="button" class="download-option" data-download="pdf"><span class="download-file-icon">PDF</span><span><strong>Download Certificate</strong><small>PDF document · ready to print</small></span></button>
      <button type="button" class="download-option" data-download="png"><span class="download-file-icon">PNG</span><span><strong>Download Certificate Image</strong><small>High resolution PNG image</small></span></button>
      <button type="button" class="download-option" data-download="badge"><span class="download-file-icon">PNG</span><span><strong>Download Badge</strong><small>SIEM Analyst badge for Sanam Naveen</small></span></button>
    </div>`);
}
$('[data-cy="btn-export"]').addEventListener('click', event => {
  event.currentTarget.setAttribute('aria-expanded', 'true'); downloadOptions();
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function artworkCanvas(source) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth * 2;
  canvas.height = image.naturalHeight * 2;
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function certificateCanvas() {
  // The same self-contained artwork is used on screen and in both export formats.
  return artworkCanvas(certificateArtwork.src);
}

// A small, standards-based PDF wrapper for the same certificate image.
async function certificatePdf(canvas) {
  const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.97));
  if (!jpeg) throw new Error('Unable to generate PDF image');
  const bytes = new Uint8Array(await jpeg.arrayBuffer());
  const pageWidth = 792;
  const pageHeight = pageWidth * canvas.height / canvas.width;
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;
  const push = data => { const chunk = typeof data === 'string' ? encoder.encode(data) : data; chunks.push(chunk); length += chunk.length; };
  const object = (number, contents) => { offsets[number] = length; push(`${number} 0 obj\n${contents}\nendobj\n`); };
  push('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Certificate 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = length;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
  push(bytes); push('\nendstream\nendobj\n');
  const commands = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Certificate Do\nQ\n`;
  object(5, `<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}endstream`);
  const xref = length;
  push('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type:'application/pdf' });
}

$('#rmi-email').addEventListener('click', () => {
  openDialog('Share Credential via Email', `
    <p>Share this credential profile with a colleague or friend.</p>
    <form id="email-form"><label for="recipient-email">Recipient email</label><input id="recipient-email" type="email" placeholder="name@example.com" autocomplete="email" required>
    <label for="email-message">Message</label><textarea id="email-message">Take a look at Sanam Naveen's credential profile.</textarea>
    <div class="dialog-actions"><button class="action-button" type="submit">Open Email</button><button class="action-button secondary" type="button" data-copy="link">Copy Link</button></div>
    <p class="dialog-note">Opens your email app with a message ready to review and send.</p></form>`);
});

$('#rmi-embed').addEventListener('click', () => {
  openDialog('Credential Embedding Options', `
    <p>Copy this code to display the credential on your website.</p>
    <label for="embed-code">Embed code</label><textarea id="embed-code" readonly></textarea>
    <div class="dialog-actions"><button class="action-button" type="button" data-copy="embed">Copy Embed Code</button></div>`);
  $('#embed-code').value = `<iframe src="${location.origin}${location.pathname}${location.hash}" title="Credential profile — Sanam Naveen" width="100%" height="850" style="border:0" loading="lazy"></iframe>`;
});

$('#rmi-help').addEventListener('click', () => {
  openDialog('Credential Help', `
    <p>This page displays the credential profile for Sanam Naveen.</p>
    <p>Use the thumbnails to switch between the certificate and badge. Select <strong>Download</strong> to save the artwork, or <strong>Show more</strong> to read the credential details.</p>
    <div class="dialog-actions"><a class="action-button" href="https://help.accredible.com/" target="_blank" rel="noopener noreferrer">Visit Help Center</a></div>`);
});

function sharingOptions() {
  openDialog('Share Credential', `<p>Show this credential on your social network.</p><div class="dialog-share-links" id="share-options"></div>
    <label for="share-link">Credential link</label><input id="share-link" readonly><div class="dialog-actions"><button class="action-button" type="button" data-copy="link">Copy Link</button></div>`);
  $('#share-link').value = credentialUrl;
  $$('rp-accredishare-bar a').forEach(anchor => {
    const link = anchor.cloneNode(false); link.textContent = anchor.getAttribute('aria-label');
    $('#share-options').append(link);
  });
}
$('[data-cy="btn-more-options"]').addEventListener('click', sharingOptions);
$('#credentialMenuTriggerButton').addEventListener('click', event => {
  event.currentTarget.setAttribute('aria-expanded', 'true');
  openDialog('More options', `<div class="download-options"><button class="download-option" type="button" data-copy="link">Copy Credential Link</button><button class="download-option" type="button" data-action="print">Print Certificate</button><a class="download-option" href="${originalUrl}" target="_blank" rel="noopener noreferrer">View Reference Page</a></div>`);
});
$('.btn-copy').addEventListener('click', () => copy(credentialUrl));
$('.verify-button').addEventListener('click', () => {
  openDialog('Credential Details', `<p>Credential details for Sanam Naveen.</p>
    <dl class="credential-facts"><dt>Name</dt><dd>Sanam Naveen</dd><dt>Credential</dt><dd>Elastic Certified SIEM Analyst</dd><dt>Issued on</dt><dd>November 20, 2026</dd><dt>Expires on</dt><dd>November 20, 2028</dd></dl>
    <img class="credential-qr-preview" src="./assets/credential-qr.svg" alt="QR code containing the credential URL">
    <p class="qr-url">${credentialUrl}</p>
    <div class="dialog-actions"><button class="action-button" type="button" data-copy="link">Copy URL</button><a class="action-button secondary" href="./assets/credential-qr.png" download="Sanam-Naveen-QR.png">Download QR</a></div>`);
});
$$('.verified-issuer').forEach(button => button.addEventListener('click', () => {
  openDialog('Issuer Information', '<p>Visit Elastic to learn more about its certification program.</p><div class="dialog-actions"><a class="action-button" href="https://www.elastic.co/training/certification" target="_blank" rel="noopener noreferrer">Elastic Certification</a></div>');
}));
$('.unlock-button').addEventListener('click', () => {
  openDialog('Share Your Value', `<p>Talking points based on the skills described in this credential.</p><ul class="statement-list"><li>Mastering Elastic Common Schema and visualization tools sharpens your ability to articulate complex security data.</li><li>Build aggregation-based and Lens visualizations for security use cases.</li><li>Search, analyze, correlate, and monitor security data using Elastic Security.</li></ul><div class="dialog-actions"><button class="action-button" type="button" data-copy="statements">Copy Statements</button></div>`);
});
$('#suggested-credentials').addEventListener('click', () => {
  openDialog('Suggested Credentials', '<p>Explore more certification opportunities from Elastic.</p><div class="download-options"><a class="download-option" href="https://www.elastic.co/training/certification" target="_blank" rel="noopener noreferrer"><span><strong>Elastic Certified SIEM Analyst</strong><small>Elastic Security, security monitoring, ECS, visualizations, and dashboards.</small></span></a><a class="download-option" href="https://www.elastic.co/training/certification" target="_blank" rel="noopener noreferrer"><span><strong>Elastic Certification</strong><small>Explore the Elastic certification program.</small></span></a></div>');
});
$('#signIn').addEventListener('click', () => {
  // Authentication stays with Accredible; the recreation never collects credentials.
  location.href = $('.sign-in-more-options a').href;
});
const languageSelector = $('accredible-language-selector select');
if (languageSelector) languageSelector.value = 'en-gb';
if (languageSelector) languageSelector.addEventListener('change', () => {
  openDialog('Language', '<p>For translated credential content, open the original page and choose your preferred language.</p><div class="dialog-actions"><a class="action-button" href="' + originalUrl + '" target="_blank" rel="noopener noreferrer">Open Original Page</a></div>');
  languageSelector.value = 'en-gb';
});

dialogContent.addEventListener('submit', event => {
  if (event.target.id !== 'email-form') return;
  event.preventDefault();
  const address = $('#recipient-email').value;
  const subject = 'Credential profile — Sanam Naveen';
  const body = $('#email-message').value + '\n\n' + credentialUrl;
  location.href = `mailto:${encodeURIComponent(address)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
dialogContent.addEventListener('click', async event => {
  const trigger = event.target.closest('[data-copy],[data-download],[data-action]');
  if (!trigger) return;
  if (trigger.dataset.copy === 'link') await copy(credentialUrl);
  if (trigger.dataset.copy === 'embed') await copy($('#embed-code').value);
  if (trigger.dataset.copy === 'statements') await copy($$('.statement-list li').map(li => li.textContent).join('\n\n'));
  if (trigger.dataset.action === 'print') {
    selectTab('certificate-tab'); dialog.close(); window.print();
  }
  if (['png', 'pdf', 'badge'].includes(trigger.dataset.download)) {
    trigger.disabled = true;
    try {
      const isBadge = trigger.dataset.download === 'badge';
      const canvas = isBadge ? await artworkCanvas('./assets/siem-analyst-badge.svg') : await certificateCanvas();
      const format = trigger.dataset.download === 'pdf' ? 'pdf' : 'png';
      const blob = format === 'pdf' ? await certificatePdf(canvas) : await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Unable to generate certificate');
      downloadBlob(blob, `${isBadge ? 'Sanam-Naveen-Badge' : 'Sanam-Naveen'}.${format}`);
      toast(isBadge ? 'Badge downloaded' : 'Certificate downloaded');
    }
    catch { toast('Unable to create the image. Please try printing the certificate.'); }
    finally { trigger.disabled = false; }
  }
});
