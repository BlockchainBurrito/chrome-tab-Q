// Initial default state
let state = {
  queue: [],
  savedQueues: [],
  active: true,
};

// Load initial state from storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["queue", "savedQueues", "active"], (data) => {
    state.queue = data.queue || [];
    state.savedQueues = data.savedQueues || [];
    state.active = data.active !== undefined ? data.active : true;
  });
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "getState":
      chrome.storage.local.get(["queue", "savedQueues", "active"], (data) => {
        sendResponse({
          queue: data.queue || [],
          savedQueues: data.savedQueues || [],
          active: data.active !== undefined ? data.active : true,
        });
      });
      return true; // needed for async response

    case "clearItems":
      state.queue = [];
      chrome.storage.local.set({ queue: [] });
      break;

    case "clearSavedQueues":
      state.savedQueues = [];
      chrome.storage.local.set({ savedQueues: [] });
      break;

    case "restoreSavedQueues":
      const restored = state.savedQueues.flat();
      state.queue = [...state.queue, ...restored];
      chrome.storage.local.set({ queue: state.queue });
      break;

    case "setActive":
      state.active = message.active;
      chrome.storage.local.set({ active: state.active });
      break;

    case "removeItem":
      if (state.queue[message.index] !== undefined) {
        state.queue.splice(message.index, 1);
        chrome.storage.local.set({ queue: state.queue });
      }
      break;

    case "removeSavedItem":
      if (
        state.savedQueues[message.queueIndex] &&
        state.savedQueues[message.queueIndex][message.index] !== undefined
      ) {
        state.savedQueues[message.queueIndex].splice(message.index, 1);
        chrome.storage.local.set({ savedQueues: state.savedQueues });
      }
      break;

    case "moveItem":
      let targetList =
        message.type === "current"
          ? state.queue
          : state.savedQueues[message.queueIndex];

      if (
        targetList &&
        message.index >= 0 &&
        message.index < targetList.length &&
        message.newIndex >= 0 &&
        message.newIndex < targetList.length
      ) {
        const [moved] = targetList.splice(message.index, 1);
        targetList.splice(message.newIndex, 0, moved);

        if (message.type === "current") {
          chrome.storage.local.set({ queue: state.queue });
        } else {
          chrome.storage.local.set({ savedQueues: state.savedQueues });
        }
      }
      break;

    default:
      console.warn("Unhandled message:", message);
  }

  return false; // sync responses don't need `true`
});
