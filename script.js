const apiBase = `http://localhost:${location.port}`;

const fileUploadSizeLimit = 10240 * 10240; // 10 KB for upload
document.getElementById("fileInput").addEventListener("change", function () {
  const file = this.files[0];
  const errorDiv = document.getElementById("sizeError");
  if (file && file.size > fileUploadSizeLimit) {
    errorDiv.style.display = "block";
  } else {
    errorDiv.style.display = "none";
  }
});

function fetchChain() {
  fetch(`${apiBase}/chain`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("chain").textContent = JSON.stringify(
        data,
        null,
        2
      );
      renderMermaidChain(data);
    })
    .catch((err) => {
      alert("Error fetching blockchain.");
      console.error(err);
    });
}

window.onload = fetchChain;

function validateChain() {
  fetch(`${apiBase}/validate`)
    .then((res) => res.json())
    .then((data) => {
      alert("Blockchain valid? " + data.valid);
    })
    .catch((err) => {
      alert("Error validating blockchain.");
      console.error(err);
    });
}

function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  const errorDiv = document.getElementById("sizeError");
  if (!file) {
    alert("Please choose a file.");
    return;
  }
  if (file.size > fileUploadSizeLimit) {
    errorDiv.style.display = "block";
    return;
  }
  errorDiv.style.display = "none";

  const formData = new FormData();
  formData.append("file", file);

  fetch(`${apiBase}/upload`, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      alert(`File uploaded!`);
      fetchChain();
    })
    .catch((err) => {
      alert("Error uploading file.");
      console.error(err);
    })
    .finally(() => {
      fileInput.value = "";
    });
}

function validateFile() {
  const fileInput = document.getElementById("validateFileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please choose a file to validate.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  fetch(`${apiBase}/verify`, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      alert("File verified? " + data.verified);
    })
    .catch((err) => {
      alert("Error verifying file.");
      console.error(err);
    })
    .finally(() => {
      fileInput.value = "";
    });
}

// Function to render blockchain flow diagram using Mermaid
function renderMermaidChain(chainData) {
  // Build a flowchart string referencing previousHash
  let diagram = "flowchart LR\n";
  // Map hashes to block indices for easy lookup
  const hashToIndex = {};
  chainData.forEach((block) => {
    hashToIndex[block.hash] = block.index;
  });
  // Draw nodes
  chainData.forEach((block) => {
    diagram += `  B${block.index}["Block ${
      block.index
    }\\nHash: ${block.hash.slice(0, 8)}"]\n`;
  });
  // Draw edges based on prevHash
  chainData.forEach((block) => {
    if (block.previousHash && hashToIndex[block.previousHash] !== undefined) {
      diagram += `  B${hashToIndex[block.previousHash]} --> B${block.index}\n`;
    }
  });
  // Render diagram
  document.getElementById(
    "mermaidChain"
  ).innerHTML = `<pre class="mermaid">${diagram}</pre>`;
  if (window.mermaid) {
    mermaid.init(undefined, document.querySelectorAll(".mermaid"));
  }
}
