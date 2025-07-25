// Keys for storage
const STORAGE_KEYS = {
  ACTIVE: 'tabsQueue_active',
  QUEUE: 'tabsQueue_currentQueue',
  SAVED: 'tabsQueue_savedQueues'
};

// Default state
let active = true;
let queue = [];
let savedQueues = [];

// Load from storage when the service worker starts
loadState();

function loadState() {
  chrome.storage.local.get([STORAGE_KEYS.ACTIVE, STORAGE_KEYS.QUEUE, STORAGE_KEYS.SAVED], (result) => {
    active = result[STORAGE_KEYS.ACTIVE] ?? true;
    queue = result[STORAGE_KEYS.QUEUE] ?? [];
    savedQueues = result[STORAGE_KEYS.SAVED] ?? [];
  });
}

function saveState() {
  chrome.storage.local.set({
    [STORAGE_KEYS.ACTIVE]: active,
    [STORAGE_KEYS.QUEUE]: queue,
    [STORAGE_KEYS.SAVED]: savedQueues
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "getState":
      sendResponse({
        active,
        queue,
        savedQueues
      });
      break;

    case "setActive":
      active = message.active;
      saveState();
      break;

    case "clearItems":
      queue = [];
      saveState();
      break;

    case "clearSavedQueues":
      savedQueues = [];
      saveState();
      break;

    case "restoreSavedQueues":
      queue = savedQueues.flat();
      saveState();
      break;

    case "removeItem":
      if (Number.isInteger(message.index) && message.index >= 0 && message.index < queue.length) {
        queue.splice(message.index, 1);
        saveState();
      }
      break;

    case "removeSavedItem":
      if (
        Number.isInteger(message.queueIndex) &&
        Number.isInteger(message.index) &&
        savedQueues[message.queueIndex]
      ) {
        savedQueues[message.queueIndex].splice(message.index, 1);
        if (savedQueues[message.queueIndex].length === 0) {
          savedQueues.splice(message.queueIndex, 1);
        }
        saveState();
      }
      break;

    case "moveItem":
      const list = message.type === "current" ? queue : savedQueues[message.queueIndex];
      const { index, newIndex } = message;
      if (
        Array.isArray(list) &&
        Number.isInteger(index) &&
        Number.isInteger(newIndex) &&
        index >= 0 && newIndex >= 0 &&
        index < list.length && newIndex < list.length
      ) {
        const [item] = list.splice(index, 1);
        list.splice(newIndex, 0, item);
        saveState();
      }
      break;

    default:
      console.warn("Unknown action received in background script:", message.action);
  }

  return true;
});
