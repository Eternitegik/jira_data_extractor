const manifestMatches = chrome.runtime.getManifest().content_scripts[0].matches;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "getJiraData",
    title: "Получить данные Jira",
    contexts: ["all"],
    documentUrlPatterns: manifestMatches
  });

  chrome.storage.sync.set({
    title: true,
    link: true,
    executor: true,
    author: true,
    status: true,
    type_task: false,
    data_create: false,
    data_update: false,
    description: false,
    showNotification: true,
    order: [
      "title",
      "link",
      "executor",
      "author",
      "status",
      "type_task",
      "data_create",
      "data_update",
      "description"
    ]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = tab.url || "";

  const isMatch = manifestMatches.some(pattern => {
    const regex = new RegExp('^' + pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\//g, '\\/') + '$');
    return regex.test(url);
  });

  if (info.menuItemId === "getJiraData" && isMatch) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractAndCopyJiraData
      });
    } catch (error) {
      console.error("Ошибка при выполнении скрипта:", error);
      chrome.tabs.sendMessage(tab.id, { type: "error", message: "Ошибка при извлечении данных Jira." });
    }
  }
});

async function extractAndCopyJiraData() {
  const options = await chrome.storage.sync.get();
  const order = options.order || [
    "title",
    "link",
    "executor",
    "author",
    "status",
    "type_task",
    "data_create",
    "data_update",
    "description"
  ];
  const data = [];

  const getElementText = (xpath) => {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue?.textContent.trim() || "";
    } catch {
      return "";
    }
  };

  for (const key of order) {
    if (!options[key]) continue;

    switch (key) {
      case "title": {
        let title = getElementText("//h1[@id='summary-val']");
        if (!title) {
          title = getElementText("//h2[@id='summary-val']");
        }
        data.push(title);
        break;
      }
      case "description":
        data.push(" ");
        break;
      case "status":
        data.push(getElementText("//span[contains(@id, 'status-val')]//span"));
        break;
      case "type_task":
        data.push(getElementText("//li//span[contains(@id,'type-val')]"));
        break;
      case "executor":
        data.push(getElementText("(//dd//span[contains(@id,'issue_summary')])[1]"));
        break;
      case "author":
        data.push(getElementText("(//dd//span[contains(@id,'issue_summary')])[2]"));
        break;
      case "data_create":
        data.push(getElementText("//span[contains(@id,'created-val')]/time"));
        break;
      case "data_update":
        data.push(getElementText("//span[contains(@id,'updated-val')]/time"));
        break;
      case "link": {
        const links = document.evaluate("//li//a[contains(@id,'key-val')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        const allLinks = [];
        for (let i = 0; i < links.snapshotLength; i++) {
          allLinks.push(links.snapshotItem(i).href);
        }
        data.push(allLinks.join(", "));
        break;
      }
    }
  }

  const row = data.join("\t");
  await navigator.clipboard.writeText(row);

  if (options.showNotification !== false) {
    alert("Данные скопированы в буфер обмена!");
  }
}
