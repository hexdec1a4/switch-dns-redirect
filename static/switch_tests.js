// static/switch_tests.js

const tests = {
  testWebUSB: async () => {
    log("Running WebUSB test...");
    log("WebUSB API available: " + ('usb' in navigator));
  },

  testFetchRoot: async () => {
    log("Running fetch('/') test...");
    try {
      const response = await fetch('/');
      log(`Fetch to '/' succeeded with status: ${response.status}`);
    } catch (e) {
      log("Fetch to '/' failed: " + e.message);
    }
  },

  testCookies: async () => {
    log("Cookies enabled: " + navigator.cookieEnabled);
  },

  testAdvancedAPIs: async () => {
    const apis = [
      'usb', 'serial', 'bluetooth', 'mediaDevices', 'serviceWorker',
      'indexedDB', 'WebAssembly', 'SharedArrayBuffer', 'OffscreenCanvas',
      'AudioContext'
    ];
    for (const api of apis) {
      const supported = (api in window) || (api in navigator);
      log(`${api} supported: ${supported}`);
    }
  },

  testNetwork: async () => {
    try {
      const ws = new WebSocket("wss://echo.websocket.org");
      ws.onopen = () => {
        log("WebSocket connection opened");
        ws.close();
      };
      ws.onerror = (e) => log("WebSocket error: " + e.message);
    } catch (e) {
      log("WebSocket error: " + e.message);
    }

    try {
      const response = await fetch("https://api.github.com");
      log("Cross-origin fetch status: " + response.status);
    } catch (e) {
      log("Cross-origin fetch failed: " + e.message);
    }
  },

  testStorage: async () => {
    try {
      localStorage.setItem('sandboxTest', 'true');
      log("localStorage test passed: " + localStorage.getItem('sandboxTest'));
      localStorage.removeItem('sandboxTest');
    } catch (e) {
      log("localStorage error: " + e.message);
    }

    try {
      sessionStorage.setItem('sandboxTest', 'true');
      log("sessionStorage test passed: " + sessionStorage.getItem('sandboxTest'));
      sessionStorage.removeItem('sandboxTest');
    } catch (e) {
      log("sessionStorage error: " + e.message);
    }

    try {
      const db = indexedDB.open("sandboxTestDB", 1);
      db.onerror = () => log("IndexedDB error");
      db.onsuccess = () => log("IndexedDB opened");
    } catch (e) {
      log("IndexedDB not available: " + e.message);
    }
  },

  testEvalAndFunction: async () => {
    try {
      log("Eval result: " + eval("4 + 4"));
    } catch (e) {
      log("Eval blocked: " + e.message);
    }

    try {
      const f = new Function("return 'Function worked!'");
      log(f());
    } catch (e) {
      log("new Function blocked: " + e.message);
    }
  },

  testPopup: async () => {
    const popup = window.open("", "_blank", "width=100,height=100");
    if (popup) {
      log("Popup allowed");
      popup.close();
    } else {
      log("Popup blocked");
    }
  },

  testPerformanceAndRAF: async () => {
    log("performance.now(): " + performance.now());

    let count = 0;
    function raf() {
      count++;
      if (count < 5) requestAnimationFrame(raf);
      else log("requestAnimationFrame worked 5 times");
    }
    requestAnimationFrame(raf);
  },

  testWebWorker: async () => {
    try {
      const blob = new Blob(["postMessage('worker alive');"]);
      const worker = new Worker(URL.createObjectURL(blob));
      worker.onmessage = e => log("Worker says: " + e.data);
    } catch (e) {
      log("Web Worker error: " + e.message);
    }
  },

  testDeviceAPIs: async () => {
    log("DeviceOrientationEvent supported: " + ('DeviceOrientationEvent' in window));
    log("DeviceMotionEvent supported: " + ('DeviceMotionEvent' in window));
    log("Geolocation supported: " + ('geolocation' in navigator));
  },

  testClipboardAPI: async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText("Clipboard test success!");
        log("Clipboard writeText succeeded.");
      } catch (e) {
        log("Clipboard writeText failed: " + e.message);
      }
    } else {
      log("Clipboard API NOT available.");
    }
  },

  testBlobAndFileAPI: async () => {
    try {
      const blob = new Blob(["sandbox"], { type: "text/plain" });
      const reader = new FileReader();
      reader.onload = () => log("Blob read result: " + reader.result);
      reader.readAsText(blob);
    } catch (e) {
      log("Blob/File API test failed: " + e.message);
    }
  }
};
