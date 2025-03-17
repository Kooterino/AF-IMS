document.addEventListener("DOMContentLoaded", function () {
  // ---------------
  // Utility functions for localStorage data management
  // ---------------
  function getItems() {
    const items = localStorage.getItem("items");
    return items ? JSON.parse(items) : [];
  }
  function saveItems(items) {
    localStorage.setItem("items", JSON.stringify(items));
  }
  function getStock() {
    const stock = localStorage.getItem("stock");
    return stock ? JSON.parse(stock) : [];
  }
  function saveStock(stock) {
    localStorage.setItem("stock", JSON.stringify(stock));
  }

  // ---------------
  // Generate location datalist options (A001 - Z195)
  // ---------------
  const locationList = document.getElementById("location-list");
  if (locationList) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < letters.length; i++) {
      for (let j = 1; j <= 195; j++) {
        const num = j.toString().padStart(3, "0");
        const option = document.createElement("option");
        option.value = letters[i] + num;
        locationList.appendChild(option);
      }
    }
  }

  // ---------------
  // Add Stock Page: New item definition
  // ---------------
  const addStockForm = document.getElementById("add-stock-form");
  if (addStockForm) {
    addStockForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("item-name").value.trim();
      const type = document.getElementById("item-type").value;
      const description = document.getElementById("item-description").value.trim();
      const productNumber = document.getElementById("product-number").value.trim();
      const upc = document.getElementById("upc-number").value.trim();

      if (!name || !type || !upc) {
        alert("Please fill in all required fields (Name, Type, UPC).");
        return;
      }
      let items = getItems();
      // Check if item with same UPC already exists
      if (items.find(item => item.upc === upc)) {
        alert("An item with this UPC already exists.");
        return;
      }
      const newItem = { name, type, description, productNumber, upc };
      items.push(newItem);
      saveItems(items);
      document.getElementById("add-message").innerText = "New item added successfully!";
      addStockForm.reset();
    });
  }

  // ---------------
  // Receiving Page: Search and add stock (location & quantity) for an existing item
  // ---------------
  let selectedItem = null;
  const searchInput = document.getElementById("item-search");
  const suggestionsDiv = document.getElementById("suggestions");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const term = searchInput.value.toLowerCase();
      suggestionsDiv.innerHTML = "";
      if (term.length < 1) return;
      const items = getItems();
      const matches = items.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.productNumber && item.productNumber.toLowerCase().includes(term)) ||
        item.upc.toLowerCase().includes(term)
      );
      matches.forEach(item => {
        const div = document.createElement("div");
        div.className = "suggestion";
        div.innerText = `${item.name} (${item.upc})`;
        div.addEventListener("click", function () {
          selectedItem = item;
          document.getElementById("selected-item-name").innerText = item.name;
          document.getElementById("selected-item-type").innerText = item.type;
          document.getElementById("selected-item-description").innerText = item.description;
          document.getElementById("selected-item-product-number").innerText = item.productNumber;
          document.getElementById("selected-item-upc").innerText = item.upc;
          suggestionsDiv.innerHTML = "";
          searchInput.value = item.name;
        });
        suggestionsDiv.appendChild(div);
      });
    });
  }

  const receivingForm = document.getElementById("receiving-form");
  if (receivingForm) {
    receivingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!selectedItem) {
        alert("Please select an item from the suggestions above.");
        return;
      }
      const location = document.getElementById("item-location").value.trim();
      const quantity = parseInt(document.getElementById("quantity").value);
      if (!location || isNaN(quantity)) {
        alert("Please fill in the location and a valid quantity.");
        return;
      }
      let stock = getStock();
      // If a stock record with same UPC and location exists, update its quantity.
      const idx = stock.findIndex(s => s.upc === selectedItem.upc && s.location === location);
      if (idx > -1) {
        stock[idx].quantity += quantity;
      } else {
        stock.push({ upc: selectedItem.upc, location, quantity });
      }
      saveStock(stock);
      document.getElementById("message").innerText = `Stock updated for ${selectedItem.name}.`;
      receivingForm.reset();
      selectedItem = null;
      // Clear selected item details.
      document.getElementById("selected-item-name").innerText = "";
      document.getElementById("selected-item-type").innerText = "";
      document.getElementById("selected-item-description").innerText = "";
      document.getElementById("selected-item-product-number").innerText = "";
      document.getElementById("selected-item-upc").innerText = "";
    });
  }

  // ---------------
  // Picks Page: List stock items with option to pick (remove quantity)
  // ---------------
  const inventoryListDiv = document.getElementById("inventory-list");
  if (inventoryListDiv) {
    function renderPicks() {
      inventoryListDiv.innerHTML = "";
      const stock = getStock();
      if (stock.length === 0) {
        inventoryListDiv.innerHTML = "<p>No stock available.</p>";
        return;
      }
      const items = getItems();
      stock.forEach((entry, index) => {
        const item = items.find(i => i.upc === entry.upc) || { name: "Unknown", type: "", upc: entry.upc };
        const div = document.createElement("div");
        div.className = "pick-item";
        div.style.border = "1px solid #444";
        div.style.padding = "10px";
        div.style.marginBottom = "10px";
        div.innerHTML = `
          <strong>${item.name}</strong> (${item.type}) - Stock: ${entry.quantity}<br>
          UPC: ${item.upc} | Location: ${entry.location}<br>
          <label>Quantity to Pick: </label>
          <input type="number" id="pick-qty-${index}" min="1" max="${entry.quantity}" value="1">
          <button data-index="${index}" class="pick-btn">Pick</button>
        `;
        inventoryListDiv.appendChild(div);
      });
      document.querySelectorAll(".pick-btn").forEach(btn => {
        btn.addEventListener("click", function () {
          const idx = parseInt(this.getAttribute("data-index"));
          const pickQty = parseInt(document.getElementById("pick-qty-" + idx).value);
          let stock = getStock();
          if (isNaN(pickQty) || pickQty < 1) {
            alert("Invalid quantity");
            return;
          }
          if (pickQty > stock[idx].quantity) {
            alert("Not enough stock available.");
            return;
          }
          stock[idx].quantity -= pickQty;
          if (stock[idx].quantity === 0) {
            stock.splice(idx, 1);
          }
          saveStock(stock);
          renderPicks();
        });
      });
    }
    renderPicks();
  }

  // ---------------
  // Remove Stock Page: List items alphabetically with checkboxes to remove them (and their stock)
  // ---------------
  const removeListDiv = document.getElementById("remove-list");
  if (removeListDiv) {
    function renderRemoveList() {
      removeListDiv.innerHTML = "";
      let items = getItems();
      items.sort((a, b) => a.name.localeCompare(b.name));
      items.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "remove-item";
        div.style.borderBottom = "1px solid #444";
        div.style.padding = "5px";
        div.innerHTML = `<input type="checkbox" class="remove-checkbox" data-upc="${item.upc}" id="remove-${index}"> 
                         <label for="remove-${index}">${item.name} (${item.upc})</label>`;
        removeListDiv.appendChild(div);
      });
    }
    renderRemoveList();
    const removeBtn = document.getElementById("remove-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        const checkboxes = document.querySelectorAll(".remove-checkbox:checked");
        if (checkboxes.length === 0) {
          alert("No items selected for removal.");
          return;
        }
        if (!confirm("Are you sure you want to remove the selected items and all associated stock?")) {
          return;
        }
        let items = getItems();
        let stock = getStock();
        checkboxes.forEach(cb => {
          const upcToRemove = cb.getAttribute("data-upc");
          items = items.filter(item => item.upc !== upcToRemove);
          stock = stock.filter(entry => entry.upc !== upcToRemove);
        });
        saveItems(items);
        saveStock(stock);
        renderRemoveList();
      });
    }
  }

  // ---------------
  // Database Page: Render a table joining stock and item definitions; export as Excel; include search filtering
  // ---------------
  const inventoryTable = document.getElementById("inventory-table");
  if (inventoryTable) {
    // Modified renderDatabaseTable to optionally filter rows based on a search term.
    function renderDatabaseTable(filterTerm = "") {
      const tbody = inventoryTable.querySelector("tbody");
      tbody.innerHTML = "";
      const stock = getStock();
      const items = getItems();
      const lowerFilter = filterTerm.toLowerCase();
      stock.forEach(entry => {
        const item = items.find(i => i.upc === entry.upc) || { name: "Unknown", type: "", description: "", productNumber: "", upc: entry.upc };
        // Create a string with all searchable fields
        const combined = `${item.name} ${item.type} ${item.description} ${item.productNumber} ${item.upc} ${entry.location} ${entry.quantity}`.toLowerCase();
        if (!filterTerm || combined.indexOf(lowerFilter) > -1) {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.type}</td>
            <td>${item.description}</td>
            <td>${item.productNumber}</td>
            <td>${item.upc}</td>
            <td>${entry.location}</td>
            <td>${entry.quantity}</td>
          `;
          tbody.appendChild(row);
        }
      });
    }
    // Initial render with no filter.
    renderDatabaseTable();

    // Listen for changes on the search input field.
    const searchInputDB = document.getElementById("database-search");
    if (searchInputDB) {
      searchInputDB.addEventListener("input", function () {
        renderDatabaseTable(this.value);
      });
    }

    const exportBtn = document.getElementById("export-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        const stock = getStock();
        const items = getItems();
        const ws_data = [["Item Name", "Type", "Description", "Product Number", "UPC", "Location", "Quantity"]];
        stock.forEach(entry => {
          const item = items.find(i => i.upc === entry.upc) || { name: "Unknown", type: "", description: "", productNumber: "", upc: entry.upc };
          ws_data.push([item.name, item.type, item.description, item.productNumber, item.upc, entry.location, entry.quantity]);
        });
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventory");
        XLSX.writeFile(wb, "Inventory.xlsx");
      });
    }
  }

  // ---------------
  // Scan Page: Camera access and barcode/QR code scanning
  // ---------------
  if (document.getElementById("reader")) {
    // Check for mobile device (iPhone/Android)
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const scanStatus = document.getElementById("scan-status");
    const scanAction = document.getElementById("scan-action");
    const scanContainer = document.getElementById("scan-container");
    const scanResult = document.getElementById("scan-result");
    let html5QrCode;

    if (!isMobile) {
      scanStatus.innerText = "Error: Camera scanning is only available on iPhone/Android devices.";
      scanAction.innerHTML = "";
    } else {
      // On mobile devices, show the option to request camera access.
      scanAction.innerHTML = `<button id="request-scan">Scan?</button>`;
      const requestScanBtn = document.getElementById("request-scan");
      requestScanBtn.addEventListener("click", function () {
        // Disable the scan button while scanning is active
        requestScanBtn.disabled = true;
        scanStatus.innerText = "Requesting camera permission...";
        // Initialize the html5-qrcode scanner.
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: 250 };
        html5QrCode.start(
          { facingMode: "environment" },
          config,
          qrCodeMessage => {
            scanStatus.innerText = "Code Scanned: " + qrCodeMessage;
            // Stop scanning once a code is read.
            html5QrCode.stop().then(() => {
              processScannedCode(qrCodeMessage);
            }).catch(err => {
              console.error("Failed to stop scanning.", err);
            });
          },
          errorMessage => {
            // Optionally log scanning errors.
            console.log("Scanning error:", errorMessage);
          }
        ).then(() => {
          // Camera started successfully.
          scanStatus.innerText = "Camera is active. Align code within frame.";
          scanContainer.style.display = "block";
          // The scan button remains visible but disabled.
        }).catch(err => {
          console.error("Error starting camera: ", err);
          scanStatus.innerText = "Camera access denied or error occurred.";
          requestScanBtn.disabled = false;
        });
      });
    }

    // Stop scan button functionality.
    document.getElementById("stop-scan").addEventListener("click", function () {
      if (html5QrCode) {
        html5QrCode.stop().then(() => {
          scanStatus.innerText = "Scan stopped.";
          scanContainer.style.display = "none";
          // Re-enable the scan button.
          const requestScanBtn = document.getElementById("request-scan");
          if (requestScanBtn) {
            requestScanBtn.disabled = false;
          }
        }).catch(err => {
          console.error("Error stopping scan", err);
        });
      }
    });

    // Process the scanned code (barcode/QR code)
    function processScannedCode(scannedCode) {
      // Treat the scanned code as the UPC.
      const items = getItems();
      const item = items.find(i => i.upc === scannedCode);
      if (item) {
        // If item exists, prompt to add stock.
        scanResult.innerHTML = `
          <p>Item found: <strong>${item.name}</strong> (${item.upc})</p>
          <p>Add stock for this item:</p>
          <label for="scan-quantity">Quantity:</label>
          <input type="number" id="scan-quantity" min="1" value="1">
          <label for="scan-location">Location:</label>
          <input type="text" id="scan-location" list="location-list-scan" required>
          <datalist id="location-list-scan"></datalist>
          <button id="add-scan-stock">Add Stock</button>
        `;
        // Generate location datalist options for the scan form.
        const locationDatalist = document.getElementById("location-list-scan");
        if (locationDatalist) {
          locationDatalist.innerHTML = "";
          const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          for (let i = 0; i < letters.length; i++) {
            for (let j = 1; j <= 195; j++) {
              const num = j.toString().padStart(3, "0");
              const option = document.createElement("option");
              option.value = letters[i] + num;
              locationDatalist.appendChild(option);
            }
          }
        }
        document.getElementById("add-scan-stock").addEventListener("click", function () {
          const location = document.getElementById("scan-location").value.trim();
          const quantity = parseInt(document.getElementById("scan-quantity").value);
          if (!location || isNaN(quantity)) {
            alert("Please provide a valid location and quantity.");
            return;
          }
          let stock = getStock();
          const idx = stock.findIndex(s => s.upc === item.upc && s.location === location);
          if (idx > -1) {
            stock[idx].quantity += quantity;
          } else {
            stock.push({ upc: item.upc, location, quantity });
          }
          saveStock(stock);
          scanResult.innerHTML = `<p>Stock updated for ${item.name}.</p>`;
          // Reset scan view: hide preview and re-enable the scan button.
          scanContainer.style.display = "none";
          const requestScanBtn = document.getElementById("request-scan");
          if (requestScanBtn) {
            requestScanBtn.disabled = false;
          }
          scanStatus.innerText = "";
        });
      } else {
        // If no item exists for the scanned UPC, prompt to add it to the database.
        scanResult.innerHTML = `
          <p>No item found with UPC: <strong>${scannedCode}</strong></p>
          <p>Do you want to add this item to the database?</p>
          <a href="add_stock.html?upc=${encodeURIComponent(scannedCode)}">Click here to add item</a>
        `;
        // Reset scan view: hide preview and re-enable the scan button.
        scanContainer.style.display = "none";
        const requestScanBtn = document.getElementById("request-scan");
        if (requestScanBtn) {
          requestScanBtn.disabled = false;
        }
        scanStatus.innerText = "";
      }
    }
  }
});