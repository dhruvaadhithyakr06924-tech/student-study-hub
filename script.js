const $ = selector => document.querySelector(selector);

const subjects = [
  {id:1,code:"CSE2258",name:"Web Technology",category:"Web",icon:"🌐",color:"blue",description:"Learn HTML, CSS, JavaScript and the foundations of the World Wide Web.",modules:["Web basics and Internet concepts","HTML elements, links, images and lists","HTML forms, tables and semantic tags","CSS basics, selectors and layouts","JavaScript fundamentals and events"]},
  {id:2,code:"CSE2255",name:"OOP Using Java",category:"Programming",icon:"☕",description:"Explore Java programming, object-oriented concepts, classes and objects.",modules:["Introduction to Java, JDK and JRE","Variables, data types and operators","Conditional statements and loops","Classes, objects and constructors","Inheritance, polymorphism and encapsulation"]},
  {id:3,code:"CSE2253",name:"Data Structures",category:"Core CS",icon:"🧩",description:"Understand how data is organised, stored and processed efficiently.",modules:["Introduction to data structures","Arrays and linked lists","Stacks and queues","Searching and sorting","Trees and graphs"]},
  {id:4,code:"CSE2009",name:"Computer Organization",category:"Core CS",icon:"💻",description:"Study computer architecture, processors, memory and instruction execution.",modules:["Computer basics and functional units","Number systems and data representation","Register transfer and micro-operations","CPU organisation and instruction cycles","Memory and input/output organisation"]},
  {id:5,code:"MAT2303",name:"Mathematics",category:"Core CS",icon:"📐",description:"Practise mathematical methods used in engineering and computer science.",modules:["Matrices and linear algebra","Differential calculus","Integral calculus","Probability and distributions","Statistics and curve fitting"]},
  {id:6,code:"CSE2301",name:"Computer Networks",category:"Core CS",icon:"🔗",description:"Discover network models, communication protocols and data transmission.",modules:["Introduction to computer networks","OSI and TCP/IP reference models","Transmission media and signals","Data link layer and error control","Network layer and routing basics"]}
];

const questions = [
  {question:"Which HTML tag is used to create a hyperlink?",options:["<link>","<a>","<href>","<url>"],answer:1,explanation:"The <a> (anchor) element creates a hyperlink using its href attribute."},
  {question:"Which CSS property changes the text colour?",options:["font-style","text-size","color","background"],answer:2,explanation:"The CSS color property sets the foreground colour of text."},
  {question:"Which JavaScript keyword declares a block-scoped variable that can be reassigned?",options:["const","let","static","define"],answer:1,explanation:"let declares a block-scoped variable that can be reassigned."}
];

let activeSubjectFilter = "All";
let activeTaskFilter = "All";
let tasks = [];
let selectedSubjectId = null;
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let toastTimer;
let darkMode = false;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

function loadTasks() {
  try {
    const saved = localStorage.getItem("studyHubTasks");
    tasks = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(tasks)) tasks = [];
  } catch { tasks = []; }
}
function saveTasks() {
  try { localStorage.setItem("studyHubTasks", JSON.stringify(tasks)); } catch {}
}

function renderSubjects() {
  const query = $("#subject-search").value.trim().toLowerCase();
  const filtered = subjects.filter(subject =>
    (activeSubjectFilter === "All" || subject.category === activeSubjectFilter) &&
    `${subject.name} ${subject.code} ${subject.description} ${subject.category}`.toLowerCase().includes(query)
  );
  $("#subject-grid").innerHTML = filtered.map(subject => `
    <article class="subject-card">
      <div class="subject-top"><div class="subject-icon">${subject.icon}</div><span class="subject-code">${subject.code}</span></div>
      <h3>${subject.name}</h3><p>${subject.description}</p>
      <div class="subject-footer"><span class="module-count">${subject.modules.length} modules</span><button class="view-button" data-subject="${subject.id}">View modules →</button></div>
    </article>`).join("");
  $("#subject-empty").classList.toggle("hidden", filtered.length !== 0);
  $("#subject-total").textContent = subjects.length;
}

function openSubject(id) {
  const subject = subjects.find(item => item.id === id);
  if (!subject) return;
  selectedSubjectId = id;
  $("#modal-icon").textContent = subject.icon;
  $("#modal-title").textContent = subject.name;
  $("#modal-description").textContent = `${subject.code} · ${subject.description}`;
  $("#module-list").innerHTML = subject.modules.map((module, index) => `<div class="module-item"><span>MODULE ${index + 1}</span>${escapeHTML(module)}</div>`).join("");
  $("#subject-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeSubject() {
  $("#subject-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

function renderTasks() {
  const filtered = tasks.filter(task => activeTaskFilter === "All" || (activeTaskFilter === "Completed" ? task.completed : !task.completed));
  $("#task-list").innerHTML = filtered.map(task => `
    <div class="task-item ${task.completed ? "done" : ""}">
      <input class="task-check" type="checkbox" data-toggle-task="${task.id}" ${task.completed ? "checked" : ""} aria-label="Mark ${escapeHTML(task.title)} complete">
      <div class="task-copy"><div class="task-title">${escapeHTML(task.title)}</div><div class="task-meta">${escapeHTML(task.subject)} · ${task.completed ? "Completed" : "Pending"}</div></div>
      <button class="delete-task" data-delete-task="${task.id}" aria-label="Delete task">✕</button>
    </div>`).join("");
  $("#task-empty").classList.toggle("hidden", filtered.length > 0);
  const completed = tasks.filter(task => task.completed).length;
  const pending = tasks.length - completed;
  const percentage = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  $("#task-total").textContent = pending;
  $("#completed-total").textContent = completed;
  $("#progress-text").textContent = `${percentage}%`;
  $("#progress-fill").style.width = `${percentage}%`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderQuiz() {
  const finished = quizIndex >= questions.length;
  $("#quiz-score-label").textContent = `Score: ${quizScore}`;
  $("#quiz-progress-fill").style.width = `${finished ? 100 : quizIndex / questions.length * 100}%`;
  if (finished) {
    $("#question-count").textContent = "Quiz complete";
    $("#question-text").textContent = `You scored ${quizScore} out of ${questions.length}!`;
    $("#answer-options").innerHTML = `<p class="muted">${quizScore === questions.length ? "Excellent work! You got every answer correct." : "Good practice! Restart the quiz to try again and improve your score."}</p>`;
    $("#answer-feedback").textContent = "";
    $("#next-question").textContent = "Quiz completed";
    $("#next-question").disabled = true;
    return;
  }
  const current = questions[quizIndex];
  quizAnswered = false;
  $("#question-count").textContent = `Question ${quizIndex + 1} of ${questions.length}`;
  $("#question-text").textContent = current.question;
  $("#answer-feedback").textContent = "";
  $("#next-question").disabled = true;
  $("#next-question").textContent = quizIndex === questions.length - 1 ? "See results →" : "Next question →";
  $("#answer-options").innerHTML = current.options.map((option, index) => `<button class="answer-option" data-answer="${index}">${escapeHTML(option)}</button>`).join("");
}

function chooseAnswer(index) {
  if (quizAnswered || quizIndex >= questions.length) return;
  quizAnswered = true;
  const current = questions[quizIndex];
  const correct = index === current.answer;
  if (correct) quizScore++;
  document.querySelectorAll("[data-answer]").forEach(button => {
    const optionIndex = Number(button.dataset.answer);
    button.disabled = true;
    if (optionIndex === current.answer) button.classList.add("correct");
    else if (optionIndex === index) button.classList.add("incorrect");
  });
  $("#answer-feedback").textContent = `${correct ? "Correct! " : "Not quite. "}${current.explanation}`;
  $("#quiz-score-label").textContent = `Score: ${quizScore}`;
  $("#next-question").disabled = false;
}

$("#subject-search").addEventListener("input", renderSubjects);
$("#subject-filters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeSubjectFilter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(item => item.classList.toggle("active", item === button));
  renderSubjects();
});
$("#subject-grid").addEventListener("click", event => {
  const button = event.target.closest("[data-subject]");
  if (button) openSubject(Number(button.dataset.subject));
});
$("#close-modal").addEventListener("click", closeSubject);
$("#subject-modal").addEventListener("click", event => { if (event.target === $("#subject-modal")) closeSubject(); });
$("#add-revision-task").addEventListener("click", () => {
  const subject = subjects.find(item => item.id === selectedSubjectId);
  if (!subject) return;
  tasks.unshift({id:Date.now(),title:`Revise ${subject.name} modules`,subject:subject.name,completed:false});
  saveTasks(); renderTasks(); closeSubject(); showToast("Revision task added to your planner");
  $("#planner").scrollIntoView({behavior:"smooth"});
});

$("#task-form").addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#task-input").value.trim();
  if (!title) return;
  tasks.unshift({id:Date.now(),title,subject:$("#task-subject").value,completed:false});
  saveTasks(); renderTasks(); event.currentTarget.reset(); $("#task-input").focus();
  showToast("Study task added!");
});
$("#task-filters").addEventListener("click", event => {
  const button = event.target.closest("[data-task-filter]");
  if (!button) return;
  activeTaskFilter = button.dataset.taskFilter;
  document.querySelectorAll("[data-task-filter]").forEach(item => item.classList.toggle("active", item === button));
  renderTasks();
});
$("#task-list").addEventListener("change", event => {
  const checkbox = event.target.closest("[data-toggle-task]");
  if (!checkbox) return;
  const task = tasks.find(item => item.id === Number(checkbox.dataset.toggleTask));
  if (task) { task.completed = checkbox.checked; saveTasks(); renderTasks(); }
});
$("#task-list").addEventListener("click", event => {
  const button = event.target.closest("[data-delete-task]");
  if (!button) return;
  tasks = tasks.filter(task => task.id !== Number(button.dataset.deleteTask));
  saveTasks(); renderTasks(); showToast("Task deleted");
});
$("#clear-completed").addEventListener("click", () => {
  const oldLength = tasks.length;
  tasks = tasks.filter(task => !task.completed);
  saveTasks(); renderTasks();
  showToast(oldLength === tasks.length ? "No completed tasks to clear" : "Completed tasks cleared");
});

$("#answer-options").addEventListener("click", event => {
  const button = event.target.closest("[data-answer]");
  if (button) chooseAnswer(Number(button.dataset.answer));
});
$("#next-question").addEventListener("click", () => {
  if (!quizAnswered) return;
  quizIndex++;
  renderQuiz();
});
$("#restart-quiz").addEventListener("click", () => { quizIndex = 0; quizScore = 0; renderQuiz(); });

$("#theme-toggle").addEventListener("click", () => {
  darkMode = !darkMode;
  document.body.classList.toggle("dark", darkMode);
  $("#theme-toggle").textContent = darkMode ? "☀️ Light mode" : "🌙 Theme";
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeSubject();
});

loadTasks();
renderSubjects();
renderTasks();
renderQuiz();
