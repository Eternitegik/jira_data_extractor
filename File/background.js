chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "getJiraData",
    title: "Получить данные Jira",
    contexts: ["all"],
    documentUrlPatterns: ["*://jira.dear.com.ru/*", "*://jira.rtk-sr.tech/*"]
  });

  chrome.storage.sync.set({
    title: true,
	description: false,
    link: true,
    executor: true,
    author: true,
    status: true,
	type_task: false,
	showNotification: true
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = tab.url || "";
  if (info.menuItemId === "getJiraData" && url.includes("jira.dear.com.ru")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractAndCopyJiraData
    });
  }
});

async function extractAndCopyJiraData() {
  const options = await chrome.storage.sync.get();
  const order = options.order || ["title", "description", "link", "executor", "author", "status", "type_task"];
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
      case "title":
        data.push(getElementText("//h1[@id='summary-val']"));
        break;
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
      case "link":
        const links = document.evaluate("//li//a[contains(@id,'key-val')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        const allLinks = [];
        for (let i = 0; i < links.snapshotLength; i++) {
          allLinks.push(links.snapshotItem(i).href);
        }
        data.push(allLinks.join(", "));
        break;
    }
  }

  const row = data.join("\t");
  await navigator.clipboard.writeText(row);
  if (options.showNotification !== false) {
	  alert("Данные скопированы в буфер обмена!");
	}
}