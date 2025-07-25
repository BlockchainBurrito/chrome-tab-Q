document.addEventListener("DOMContentLoaded", () => {
  const urlList = document.getElementById("url-list");
  const savedQueuesList = document.getElementById("savedQueuesList");
  const buttonClearItems = document.getElementById("buttonClearItems");
  const buttonClearQueues = document.getElementById("buttonClearQueues");
  const buttonRestoreAll = document.getElementById("buttonRestoreAll");
  const myonoffswitch = document.getElementById("myonoffswitch");

  // Utility for messaging the background
  function sendToBackground(action, data = {}) {
    return chrome.runtime.sendMessage({ action, ...data });
  }

  // Confirm dialog handling
  function setupConfirm(buttonId, yesCallback) {
    const button = document.getElementById(buttonId);
    const dialog = document.querySelector(`.dialog-clear[data-for="${buttonId}"]`);

    button.addEventListener("click", () => dialog.style.display = "block");

    dialog.querySelector('[name="clearNo"]').addEventListener("click", () => {
      dialog.style.display = "none";
    });

    dialog.querySelector('[name="clearYes"]').addEventListener("click", () => {
      dialog.style.display = "none";
      yesCallback();
    });
  }

  // Setup confirmation buttons
  setupConfirm("buttonClearItems", () => sendToBackground("clearItems"));
  setupConfirm("buttonClearQueues", () => sendToBackground("clearSavedQueues"));

  buttonRestoreAll.addEventListener("click", () => {
    sendToBackground("restoreSavedQueues");
  });

  // Toggle active state
  myonoffswitch.addEventListener("change", (e) => {
    sendToBackground("setActive", { active: e.target.checked });
  });

  // Load current state from background
  chrome.runtime.sendMessage({ action: "getState" }, (response) => {
    console.log("Popup got state:", response);

    const { active, queue, savedQueues } = response || {};
    myonoffswitch.checked = active;

    // Debugging output to verify structure
    if (!Array.isArray(savedQueues)) {
      console.warn("Expected savedQueues to be an array, got:", savedQueues);
    } else {
      savedQueues.forEach((q, i) => {
        console.log(`Saved queue ${i}:`, q);
      });
    }

    renderQueue(queue);
    renderSavedQueues(savedQueues);
  });

  function renderQueue(queue) {
    urlList.innerHTML = "";
    if (!queue || queue.length === 0) {
      document.getElementById("urlListInfo").textContent = "Queue is empty";
      return;
    }

    document.getElementById("urlListInfo").textContent = "Current Queue";
    queue.forEach((item, index) => {
      const li = createQueueItemElement(item, index, queue.length, "current");
      urlList.appendChild(li);
    });
  }

  function renderSavedQueues(savedQueues) {
    savedQueuesList.innerHTML = "";
    if (!savedQueues || savedQueues.length === 0) {
      document.getElementById("savedQueuesInfo").textContent = "No saved queues";
      return;
    }

    document.getElementById("savedQueuesInfo").textContent = "Saved Queues";
    savedQueues.forEach((queue, queueIndex) => {
      const li = document.createElement("li");
      const nestedOl = document.createElement("ol");
      nestedOl.className = "list-level2";

      queue.forEach((item, index) => {
        const subLi = createQueueItemElement(item, index, queue.length, "saved", queueIndex);
        nestedOl.appendChild(subLi);
      });

      li.appendChild(nestedOl);
      savedQueuesList.appendChild(li);
    });
  }

  function createQueueItemElement(value, index, totalLength, type, queueIndex = null) {
    const li = document.createElement("li");
    li.textContent = value;

    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✖";
    removeBtn.className = "btn btn-small";
    removeBtn.title = "Remove this item";
    removeBtn.addEventListener("click", () => {
      if (type === "current") {
        sendToBackground("removeItem", { index });
        li.remove();
      } else {
        sendToBackground("removeSavedItem", { queueIndex, index });
        li.remove();
      }
    });

    // Move up
    const upBtn = document.createElement("button");
    upBtn.textContent = "↑";
    upBtn.className = "btn btn-small";
    upBtn.disabled = index === 0;
    upBtn.title = "Move up";
    upBtn.addEventListener("click", () => {
      sendToBackground("moveItem", {
        index,
        newIndex: index - 1,
        type,
        queueIndex
      });
    });

    // Move down
    const downBtn = document.createElement("button");
    downBtn.textContent = "↓";
    downBtn.className = "btn btn-small";
    downBtn.disabled = index === totalLength - 1;
    downBtn.title = "Move down";
    downBtn.addEventListener("click", () => {
      sendToBackground("moveItem", {
        index,
        newIndex: index + 1,
        type,
        queueIndex
      });
    });

    const controls = document.createElement("div");
    controls.className = "controls";
    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(removeBtn);

    li.appendChild(controls);
    return li;
  }
});
