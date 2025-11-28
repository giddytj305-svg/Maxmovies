// ---------- Config ----------
// ⬇️ Paste your backend URL here (e.g. "https://maxx-rho.vercel.app/api/generate")
const BACKEND_URL = "https://maxmoviesai-backend.vercel.app/api/generate";

// ---------- User Memory Setup ---------- 🧠
let userId = localStorage.getItem("max_user_id");
if (!userId) {
  userId = "user-" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("max_user_id", userId);
}

let currentProject = localStorage.getItem("max_last_project") || "General";

// ---------- DOM Elements ----------
const chat = document.getElementById("chat-container");
const input = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const themeBtn = document.getElementById("theme-toggle");
const clearBtn = document.getElementById("clear-chat");

// ---------- Helpers ----------
function scrollToBottom() {
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

function addMessage(content, sender = "ai") {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerHTML = content;
  chat.appendChild(div);
  scrollToBottom();
  return div;
}

function createCodeBlock(code, lang = "plaintext") {
  const wrapper = document.createElement("div");
  wrapper.className = "code-block";

  const header = document.createElement("div");
  header.className = "code-header";
  header.innerHTML = `<span class="lang">${lang.toUpperCase()}</span>`;

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy";
  copyBtn.className = "copy-btn";
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(code);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  };

  header.appendChild(copyBtn);

  const pre = document.createElement("pre");
  const codeEl = document.createElement("code");
  codeEl.className = lang;
  codeEl.textContent = code.trim();
  pre.appendChild(codeEl);
  wrapper.appendChild(header);
  wrapper.appendChild(pre);

  if (window.hljs) hljs.highlightElement(codeEl);
  return wrapper;
}

// ---------- Emoji-safe Typewriter ----------
async function typewriter(el, html, speed = 15) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const nodes = Array.from(temp.childNodes);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const chars = Array.from(node.textContent);
      for (const ch of chars) {
        el.innerHTML += ch;
        scrollToBottom();
        await sleep(speed);
      }
    } else {
      el.appendChild(node.cloneNode(true));
      scrollToBottom();
    }
  }
}

// ---------- Markdown Parser ----------
function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code class='inline-code'>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/(?:^|\n)\d+\.\s+(.*?)(?=\n|$)/g, '<li>$1</li>')
    .replace(/(?:^|\n)[*-]\s+(.*?)(?=\n|$)/g, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul class="fade-list">$1</ul>');
}

// ---------- Special Prompt Handler ----------
function checkSpecialPrompts(prompt) {
  const lower = prompt.toLowerCase();

  if (
    lower.includes("who built you") ||
    lower.includes("who is your developer") ||
    lower.includes("your creator") ||
    lower.includes("who made you") ||
    lower.includes("your maker")
  ) {
    // Owner name remains the same
    return "I was proudly crafted by <strong class='glow'>Max</strong> — a creative developer from <strong class='glow'>Kenya</strong> 🇰🇪, mixing logic and imagination to make something awesome 💻✨";
  }

  if (lower.includes("your name") || lower.includes("who are you")) {
    // Name and functionality updated
    return "I’m <strong>MaxMovies AI</strong> 🎬🍿 — your movie and series companion who loves finding the perfect film for you and sharing insights!<br>I can help you with <strong>other</strong> topics too✌️🌚";
  }

  return null;
}

// ---------- AI Logic (Backend Call) ----------
async function getResponse(prompt) {
  addMessage(prompt, "user");

  const specialReply = checkSpecialPrompts(prompt);
  if (specialReply) {
    const aiDiv = addMessage("", "ai");
    await typewriter(aiDiv, specialReply);
    return;
  }

  // 🧠 Thinking animation
  const aiDiv = addMessage(
    `<span class="thinking">🧠<span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`,
    "ai"
  );

  await new Promise(r => setTimeout(r, 800 + Math.random() * 600)); // delay for realism

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        project: currentProject,
        prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      aiDiv.innerHTML = `⚠️ Error ${response.status}: ${errorText}`;
      return;
    }

    const data = await response.json();
    const text = data.reply || "⚠️ No response received.";
    aiDiv.innerHTML = "";

    // 🧠 Simulated typing with pauses
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const parts = text.split(/```/g);
    let emojiList = ["😅", "😂", "💡", "🔥", "🚀", "😎", "🙌"];

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        const formatted = parseMarkdown(parts[i]);
        const p = document.createElement("p");

        // Random breathing pauses (simulate thought)
        const sentences = formatted.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          await typewriter(p, sentence + " ", 15);
          aiDiv.appendChild(p);
          scrollToBottom();
          await delay(150 + Math.random() * 250);
        }

        // Random reaction emoji at end (10% chance)
        if (Math.random() < 0.1) {
          const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
          p.innerHTML += " " + emoji;
        }
      } else {
        const [lang, ...codeArr] = parts[i].split("\n");
        const code = codeArr.join("\n");
        const block = createCodeBlock(code, lang || "plaintext");
        aiDiv.appendChild(block);
      }
      scrollToBottom();
    }

    aiDiv.querySelectorAll("ul.fade-list li").forEach((li, index) => {
      li.style.animationDelay = `${index * 0.1}s`;
    });
    aiDiv.querySelectorAll(".inline-code").forEach((el, i) => {
      el.style.animationDelay = `${i * 0.05}s`;
      el.classList.add("fade-in-inline");
    });
  } catch (err) {
    console.error(err);
    aiDiv.innerHTML = "⚠️ Server error — check your backend.";
  }
}

// ---------- Event Listeners ----------
sendBtn.onclick = async () => {
  const prompt = input.value.trim();
  if (!prompt) return;
  input.value = "";
  await getResponse(prompt);
};

input.addEventListener("keypress", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

themeBtn.onclick = () => {
  document.body.classList.toggle("light");
  themeBtn.textContent = document.body.classList.contains("light") ? "🌞" : "🌙";
};

clearBtn.onclick = () => {
  if (!confirm("Clear the chat history? This cannot be undone.")) return;
  // Updated initial message on clear
  chat.innerHTML = `<div class="message ai">🍿 Hey! Which movie or series can I help you with, or do you need ideas?</div>`;
  localStorage.removeItem("max_last_project");
  scrollToBottom();
};

// ---------- Initial Message ----------
if (chat.children.length === 0) {
  // Updated initial message on load
  addMessage("🍿 Hey! Which movie or series can I help you with, or do you need ideas?", "ai");
  scrollToBottom();
}

// ✅ Fix for mobile keyboard overlap
const promptInput = document.getElementById("prompt");
const chatContainer = document.getElementById("chat-container");

promptInput.addEventListener("focus", () => {
  setTimeout(() => {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
  }, 300);
});

promptInput.addEventListener("blur", () => {
  setTimeout(() => {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
  }, 100);
});
