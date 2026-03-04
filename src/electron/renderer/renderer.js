const readerStatus = document.getElementById("readerStatus");
const readerList = document.getElementById("readerList");
const bridgeStatus = document.getElementById("bridgeStatus");
const headerStatus = document.getElementById("headerStatus");
const tokenInput = document.getElementById("tokenInput");
const autoStartToggle = document.getElementById("autoStartToggle");
const saveBtn = document.getElementById("saveBtn");
const saveHint = document.getElementById("saveHint");

const formatReaderList = (readers) => {
  if (!readers || readers.length === 0) return "No reader detected";
  return readers.join(", ");
};

const updateStatus = (payload) => {
  const readers = payload?.readers ?? [];
  readerList.textContent = formatReaderList(readers);
  const status = payload?.status ?? (readers.length > 0 ? "online" : "connecting");
  if (status === "online") {
    readerStatus.textContent = "Connected";
    readerStatus.className = "status status-online";
    headerStatus.textContent = "Reader online";
    headerStatus.className = "status status-online";
  } else if (status === "error") {
    readerStatus.textContent = "Reader error";
    readerStatus.className = "status status-offline";
    headerStatus.textContent = "Reader error";
    headerStatus.className = "status status-offline";
  } else {
    readerStatus.textContent = "Waiting for reader";
    readerStatus.className = "status status-pending";
    headerStatus.textContent = "Reader connecting";
    headerStatus.className = "status status-pending";
  }
  bridgeStatus.textContent = `${payload?.host ?? "127.0.0.1"}:${payload?.port ?? ""}`;
};

const showHint = (message, type = "success") => {
  saveHint.textContent = message;
  saveHint.className = `hint hint-${type}`;
  setTimeout(() => {
    saveHint.textContent = "";
    saveHint.className = "hint";
  }, 2500);
};

const init = async () => {
  const settings = await window.bridgeApi.getSettings();
  tokenInput.value = settings?.deviceToken ?? "";
  autoStartToggle.checked = Boolean(settings?.autoStart);

  const status = await window.bridgeApi.getStatus();
  updateStatus(status);

  window.bridgeApi.onStatus(updateStatus);
};

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  const token = tokenInput.value.trim();
  const autoStart = autoStartToggle.checked;
  await window.bridgeApi.saveSettings({ deviceToken: token, autoStart });
  showHint("Settings saved.");
  saveBtn.disabled = false;
});

init();
