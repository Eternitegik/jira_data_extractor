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
});


// Проверить верию расширения, если верия расширения ниже чем в manifest.json с сайта
// https://eternitegik.github.io/jira_data_extractor/File/manifest.json