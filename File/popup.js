document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("options-form");
  const list = document.getElementById("fields-list");
  const notifCheckbox = document.getElementById("showNotification");

  const stored = await chrome.storage.sync.get();
  const allKeys = Array.from(list.children).map(li => li.dataset.key);

  // Установить состояния чекбоксов
  for (const li of list.children) {
    const key = li.dataset.key;
    const checkbox = li.querySelector("input[type='checkbox']");
    checkbox.checked = stored[key] ?? true;
  }

  // Установить состояние уведомления
  notifCheckbox.checked = stored.showNotification ?? true;

  // Восстановить порядок
  if (stored.order) {
    const keySet = new Set(stored.order);
    const currentItems = Array.from(list.children);
    const newOrder = [];

    for (const key of stored.order) {
      const item = currentItems.find(li => li.dataset.key === key);
      if (item) newOrder.push(item);
    }

    for (const key of allKeys) {
      if (!keySet.has(key)) {
        const item = currentItems.find(li => li.dataset.key === key);
        if (item) newOrder.push(item);
      }
    }

    for (const item of newOrder) {
      list.appendChild(item);
    }
  }

  // ✅ Drag and Drop (внутри DOMContentLoaded, чтобы list был доступен)
  let draggedItem = null;

  list.addEventListener("dragstart", (e) => {
    draggedItem = e.target;
    e.target.style.opacity = 0.5;
  });

  list.addEventListener("dragend", (e) => {
    e.target.style.opacity = "";
  });

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const target = e.target.closest("li");
    if (target && target !== draggedItem) {
      const rect = target.getBoundingClientRect();
      const after = (e.clientY - rect.top) > rect.height / 2;
      target.parentNode.insertBefore(draggedItem, after ? target.nextSibling : target);
    }
  });

  // ✅ Обработчик кнопки "Сохранить"
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {};
    const order = [];

    for (const li of list.children) {
      const key = li.dataset.key;
      const checkbox = li.querySelector("input[type='checkbox']");
      data[key] = checkbox.checked;
      order.push(key);
    }

    data.order = order;
    data.showNotification = notifCheckbox.checked;

    chrome.storage.sync.set(data, () => {
      alert("Настройки сохранены!");
    });
  });

const username = 'Eternitegik';
const repo = 'jira_data_extractor';
const branch = 'main';
const path = 'Release';

  const metadataUrl = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${path}/metadata.json`;
  try {
    const metaResp = await fetch(metadataUrl);
    if (!metaResp.ok) throw new Error(`metadata.json вернул ${metaResp.status}`);
    const metadata = await metaResp.json();

    const sorted = metadata.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sorted.length > 0) {
      const lastName = sorted[0].name;
      const url = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${path}/${lastName}`;
      const version = sorted[0].version;

      const version_ex = chrome.runtime.getManifest().version;


      document.getElementById("version_ex").textContent = `Текущая версия: ${version_ex}`;
      document.getElementById("version").textContent = `Последняя версия: ${version}`;
      document.getElementById("version_download").innerHTML = `<a class="chrome-link" href="${url}" target="_blank" rel="noopener">Скачать</a>    -    <a class="chrome-link" href="https://eternitegik.github.io/jira_data_extractor/" target="_blank" rel="noopener">Инструкция</a>`;

      var valuepars = parseFloat(version_ex);

      if(version > valuepars){
        document.getElementById("update_ex").style.display = 'block';
      }
      
      console.log(version);
      console.log(url);
      console.log(version_ex);
      console.log(valuepars);
    }
  } catch (e) {
    console.warn("Не удалось получить альтернативную ссылку:", e);
  }
});


// Проверить верию расширения, если верия расширения ниже чем в manifest.json с сайта
// https://eternitegik.github.io/jira_data_extractor/File/manifest.json