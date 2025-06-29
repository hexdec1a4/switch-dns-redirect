// static/menu.js
window.initMenu = function(socket, { onMenuOpen, onMenuClose }) {
  console.log('Initializing menu.js');

  // Create menu container
  const specialMenu = document.createElement('div');
  specialMenu.id = 'specialMenu';
  specialMenu.style.position = 'fixed';
  specialMenu.style.top = '60px';
  specialMenu.style.left = '50%';
  specialMenu.style.transform = 'translateX(-50%)';
  specialMenu.style.backgroundColor = 'rgba(30,30,30,0.98)';
  specialMenu.style.border = '1px solid #888';
  specialMenu.style.padding = '20px';
  specialMenu.style.borderRadius = '16px';
  specialMenu.style.zIndex = '9999';
  specialMenu.style.width = '95%';
  specialMenu.style.maxWidth = '500px';
  specialMenu.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
  specialMenu.style.color = 'white';
  specialMenu.style.userSelect = 'none';
  specialMenu.style.display = 'none';
  specialMenu.style.flexDirection = 'column';
  specialMenu.style.fontFamily = 'Arial, sans-serif';

  // Append to body
  document.body.appendChild(specialMenu);

  // Top bar with close button
  const menuTopBar = document.createElement('div');
  menuTopBar.id = 'menuTopBar';
  menuTopBar.style.display = 'flex';
  menuTopBar.style.justifyContent = 'space-between';
  menuTopBar.style.alignItems = 'center';
  menuTopBar.style.marginBottom = '15px';

  const closeMenuBtn = document.createElement('button');
  closeMenuBtn.id = 'closeMenu';
  closeMenuBtn.textContent = 'Close Menu';

  menuTopBar.appendChild(closeMenuBtn);
  specialMenu.appendChild(menuTopBar);

  // Page toggles
  const pageToggles = document.createElement('div');
  pageToggles.id = 'pageToggles';
  pageToggles.style.display = 'flex';
  pageToggles.style.justifyContent = 'center';
  pageToggles.style.gap = '20px';
  pageToggles.style.margin = '15px 0 20px 0';

  const btnScripts = document.createElement('button');
  btnScripts.id = 'showScriptsPage';
  btnScripts.textContent = 'Scripts';
  btnScripts.classList.add('active');

  const btnColors = document.createElement('button');
  btnColors.id = 'showColorsPage';
  btnColors.textContent = 'Colors';

  const btnWebsite = document.createElement('button');
  btnWebsite.id = 'showWebsitePage';
  btnWebsite.textContent = 'Website Loader';

  pageToggles.appendChild(btnScripts);
  pageToggles.appendChild(btnColors);
  pageToggles.appendChild(btnWebsite);

  specialMenu.appendChild(pageToggles);

  // Pages container styles
  const pages = {};

  // Scripts Page
  const scriptsPage = document.createElement('div');
  scriptsPage.id = 'scriptsPage';
  scriptsPage.style.display = 'flex';
  scriptsPage.style.flexDirection = 'column';
  scriptsPage.style.gap = '10px';
  scriptsPage.style.flexGrow = '1';

  // Scripts listbox (multiple select)
  const scriptLabel = document.createElement('label');
  scriptLabel.htmlFor = 'scriptSelect';
  scriptLabel.textContent = 'Select Script(s):';

  const scriptSelect = document.createElement('select');
  scriptSelect.id = 'scriptSelect';
  scriptSelect.multiple = true;
  scriptSelect.style.height = '150px';
  scriptSelect.style.fontSize = '1rem';
  scriptSelect.style.borderRadius = '8px';
  scriptSelect.style.border = '1px solid #555';
  scriptSelect.style.backgroundColor = '#222';
  scriptSelect.style.color = 'white';
  scriptSelect.style.width = '100%';

  const loadScriptBtn = document.createElement('button');
  loadScriptBtn.id = 'loadScript';
  loadScriptBtn.textContent = 'Run Selected Script(s)';

  scriptsPage.appendChild(scriptLabel);
  scriptsPage.appendChild(scriptSelect);
  scriptsPage.appendChild(loadScriptBtn);

  pages.scripts = scriptsPage;
  specialMenu.appendChild(scriptsPage);

  // Colors Page
  const colorsPage = document.createElement('div');
  colorsPage.id = 'colorsPage';
  colorsPage.style.display = 'none';
  colorsPage.style.flexDirection = 'column';
  colorsPage.style.gap = '10px';

  // Color sliders
  function createColorSlider(labelText, id) {
    const label = document.createElement('label');
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '255';
    input.id = id;
    input.style.width = '100%';
    input.style.webkitAppearance = 'none';
    input.style.height = '8px';
    input.style.borderRadius = '5px';
    input.style.background = '#444';
    input.style.outline = 'none';

    label.appendChild(document.createElement('br'));
    label.appendChild(input);

    return { label, input };
  }

  const redSlider = createColorSlider('Red', 'redSlider');
  const greenSlider = createColorSlider('Green', 'greenSlider');
  const blueSlider = createColorSlider('Blue', 'blueSlider');

  colorsPage.appendChild(redSlider.label);
  colorsPage.appendChild(greenSlider.label);
  colorsPage.appendChild(blueSlider.label);

  pages.colors = colorsPage;
  specialMenu.appendChild(colorsPage);

  // Website Loader Page
  const websitePage = document.createElement('div');
  websitePage.id = 'websitePage';
  websitePage.style.display = 'none';
  websitePage.style.flexDirection = 'column';
  websitePage.style.gap = '10px';

  const urlLabel = document.createElement('label');
  urlLabel.htmlFor = 'urlInput';
  urlLabel.textContent = 'Enter URL:';

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.id = 'urlInput';
  urlInput.placeholder = 'https://example.com';
  urlInput.style.width = '100%';
  urlInput.style.padding = '8px';
  urlInput.style.borderRadius = '6px';
  urlInput.style.border = 'none';
  urlInput.style.fontSize = '1rem';
  urlInput.style.backgroundColor = '#222';
  urlInput.style.color = 'white';

  const visitBtn = document.createElement('button');
  visitBtn.id = 'visitBtn';
  visitBtn.textContent = 'Visit';

  websitePage.appendChild(urlLabel);
  websitePage.appendChild(urlInput);
  websitePage.appendChild(visitBtn);

  pages.website = websitePage;
  specialMenu.appendChild(websitePage);

  // Helper: show page and highlight button
  function showPage(pageName) {
    Object.entries(pages).forEach(([name, el]) => {
      if (name === pageName) {
        el.style.display = 'flex';
        pageToggles.querySelector(`#show${capitalizeFirstLetter(name)}Page`).classList.add('active');
      } else {
        el.style.display = 'none';
        pageToggles.querySelector(`#show${capitalizeFirstLetter(name)}Page`).classList.remove('active');
      }
    });
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Initial page
  showPage('scripts');

  // Page toggle button events
  btnScripts.addEventListener('click', () => showPage('scripts'));
  btnColors.addEventListener('click', () => showPage('colors'));
  btnWebsite.addEventListener('click', () => showPage('website'));

  // Close menu button event
  closeMenuBtn.addEventListener('click', () => {
    specialMenu.style.display = 'none';
    document.body.classList.remove('menu-open');
    if (onMenuClose) onMenuClose();
  });

  // Variables for menu state
  let menuOpen = false;

  // Open menu function
  function openMenu() {
    if (menuOpen) return;
    specialMenu.style.display = 'flex';
    document.body.classList.add('menu-open');
    menuOpen = true;
    if (onMenuOpen) onMenuOpen();
    fetchGameList();
  }

  // Fetch list of game scripts from server
  async function fetchGameList() {
    try {
      const res = await fetch('/list-games');
      if (!res.ok) {
        console.error('Failed to fetch game list:', res.status);
        return;
      }
      const list = await res.json();
      scriptSelect.innerHTML = '';
      list.forEach(filename => {
        const opt = document.createElement('option');
        opt.value = filename;
        opt.textContent = filename;
        scriptSelect.appendChild(opt);
      });
    } catch (err) {
      console.error('Error fetching game list:', err);
    }
  }

  // Load and run selected scripts
  loadScriptBtn.addEventListener('click', async () => {
    const selectedScripts = Array.from(scriptSelect.selectedOptions).map(opt => opt.value);
    if (selectedScripts.length === 0) {
      alert('Please select at least one script to run.');
      return;
    }
    for (const filename of selectedScripts) {
      try {
        console.log(`Fetching script: ${filename}`);
        const res = await fetch(`/load-game/${filename}`);
        if (!res.ok) {
          alert(`Failed to fetch script "${filename}": HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        console.log(`Script content for "${filename}":`, data.content);
        if (!data.content) {
          alert(`No script content returned for "${filename}"`);
          continue;
        }
        eval(data.content);
        console.log(`Script "${filename}" executed successfully.`);
      } catch (e) {
        alert(`Error loading/running script "${filename}": ${e.message}`);
        console.error(e);
      }
    }
    // Close menu after running scripts and disable keybinds
    closeMenuBtn.click();
    disableMenuToggleKeys();
  });

  // Visit button click for website loader
  visitBtn.addEventListener('click', () => {
    let url = urlInput.value.trim();
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    window.open(url, '_blank');
  });

  // Keybinds for menu toggle
  const keysPressed = new Set();
  let toggleEnabled = true;

  function disableMenuToggleKeys() {
    toggleEnabled = false;
    console.log('Menu toggle keys disabled');
  }

  function enableMenuToggleKeys() {
    toggleEnabled = true;
    console.log('Menu toggle keys enabled');
  }

  document.addEventListener('keydown', e => {
    if (!toggleEnabled) return;
    if ((e.code === 'ArrowUp' || e.code === 'KeyW') && !e.repeat) keysPressed.add('up');
    if ((e.code === 'KeyA' || e.code === 'Enter') && !e.repeat) keysPressed.add('a');

    if (keysPressed.has('up') && keysPressed.has('a')) {
      openMenu();
      keysPressed.clear();
    }
  });

  document.addEventListener('keyup', e => {
    keysPressed.delete('up');
    keysPressed.delete('a');
  });

  // Expose disable/enable functions if needed later
  window.disableMenuToggleKeys = disableMenuToggleKeys;
  window.enableMenuToggleKeys = enableMenuToggleKeys;

  // Return API for parent switch.html to use if needed
  return {
    openMenu,
    closeMenu: () => {
      closeMenuBtn.click();
    }
  };
};
