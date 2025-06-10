const username = 'Eternitegik';
const repo = 'jira_data_extractor';
const branch = 'main';
const path = 'Release';

const metadataUrl = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${path}/metadata.json`;
const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}?ref=${branch}`;

const latestList = document.getElementById('latest-file');
const fileList = document.getElementById('file-list');

latestList.innerHTML = '<li class="loading">Загрузка...</li>';
fileList.innerHTML = '<li class="loading">Загрузка...</li>';

Promise.all([
  fetch(metadataUrl).then(async r => {
    if (!r.ok) throw new Error(`Ошибка metadata: ${r.status}`);
    return r.json();
  }),
  fetch(apiUrl).then(async r => {
    if (!r.ok) throw new Error(`Ошибка API GitHub: ${r.status}`);
    return r.json();
  })
])
  .then(([metadata, files]) => {
    const fileMap = {};
    files.forEach(file => {
      if (file.name !== 'metadata.json') {
        fileMap[file.name] = file.download_url;
      }
    });

    const sortedFiles = metadata
      .filter(f => fileMap[f.name])
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedFiles.length === 0) {
      latestList.innerHTML = '<li>Нет файлов.</li>';
      fileList.innerHTML = '<li>Нет файлов.</li>';
      return;
    }

    latestList.innerHTML = '';
    fileList.innerHTML = '';

    // --- Последний файл ---
    const latest = sortedFiles[0];
    const latestLi = document.createElement('li');

    const latestLink = document.createElement('a');
    latestLink.href = fileMap[latest.name];
    latestLink.textContent = latest.name;
    latestLink.target = '_blank';

    const descriptionP = document.createElement('p');
    const maxLength = 200;
    const fullText = latest.description || '';
    const shortText = fullText.length > maxLength ? fullText.slice(0, maxLength) + '…' : fullText;

    descriptionP.textContent = shortText;

    if (fullText.length > maxLength) {
      const icon = createSearchIcon(() => showModal(fullText));
      descriptionP.appendChild(icon);
    }

    latestLi.appendChild(latestLink);
    latestLi.appendChild(descriptionP);
    latestList.appendChild(latestLi);

    // --- Остальные файлы ---
    sortedFiles.slice(1).forEach(file => {
      const li = document.createElement('li');
      li.classList.add('file-item');

      const wrapper = document.createElement('div');
      wrapper.className = 'file-entry';

      const link = document.createElement('a');
      link.href = fileMap[file.name];
      link.textContent = file.name;
      link.className = 'file-name';
      link.target = '_blank';
      link.download = file.name;

      const icon = createSearchIcon(() => showModal(file.description || 'Описание отсутствует'));

      wrapper.appendChild(link);
      wrapper.appendChild(icon);
      li.appendChild(wrapper);
      fileList.appendChild(li);
    });

  })
  .catch(async err => {
  console.error('Ошибка при загрузке:', err);

  let fallbackLink = '';

  try {
    const metaResp = await fetch(metadataUrl);
    if (!metaResp.ok) throw new Error(`metadata.json вернул ${metaResp.status}`);
    const metadata = await metaResp.json();

    const sorted = metadata.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sorted.length > 0) {
      const lastName = sorted[0].name;
      const url = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${path}/${lastName}`;
      fallbackLink = `<br>Альтернативная ссылка: <a href="${url}" target="_blank" rel="noopener">Скачать</a>`;
    }
  } catch (e) {
    console.warn("Не удалось получить альтернативную ссылку:", e);
  }

  latestList.innerHTML = `<li>Превышен лимит загрузки данных. Попробуйте позже.${fallbackLink}</li>`;
  fileList.innerHTML = '<li>Ошибка загрузки списка файлов</li>';
});


// --- Модальное окно ---
function showModal(text) {
  let modal = document.getElementById('desc-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'desc-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <button id="modal-close" class="modal-close">&times;</button>
        <div id="modal-text" class="modal-text"></div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modal-close').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  document.getElementById('modal-text').textContent = text;
  modal.style.display = 'flex';
}

function createSearchIcon(onClick) {
  const icon = document.createElement('span');
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#555"
         class="search-icon" viewBox="0 0 24 24">
      <path d="M10 2a8 8 0 105.29 14.29l4.59 4.59 1.41-1.41-4.59-4.59A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z"/>
    </svg>
  `;
  icon.style.cursor = 'pointer';
  icon.title = 'Показать описание';
  icon.classList.add('icon-right');
  icon.addEventListener('click', onClick);
  return icon;
}
