const STORAGE_KEY = 'interviewPractised';

const cards = [...document.querySelectorAll('.qa')];
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

const load = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

let practised = load();

const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...practised]));

function render() {
  for (const card of cards) card.classList.toggle('done', practised.has(card.dataset.id));

  const done = cards.filter((c) => practised.has(c.dataset.id)).length;
  progressFill.style.width = `${(done / cards.length) * 100}%`;
  progressText.textContent = `${done} of ${cards.length} practised`;
}

// The tick lives inside <summary>, so its click must not also open the card.
for (const card of cards) {
  card.querySelector('.tick').addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const id = card.dataset.id;
    if (practised.has(id)) practised.delete(id);
    else practised.add(id);
    save();
    render();
  });
}

document.getElementById('resetProgress').addEventListener('click', () => {
  if (!practised.size || confirm('Clear all your ✓ marks?')) {
    practised = new Set();
    save();
    render();
  }
});

const toggleAll = document.getElementById('toggleAll');
toggleAll.addEventListener('click', () => {
  const expanding = toggleAll.textContent.startsWith('Expand');
  for (const card of cards) if (!card.hidden) card.open = expanding;
  toggleAll.textContent = expanding ? 'Collapse all' : 'Expand all';
});

// Filter on question text and answer text, then hide sections left with nothing.
document.getElementById('qSearch').addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();

  for (const card of cards) {
    const match = !query || card.textContent.toLowerCase().includes(query);
    card.hidden = !match;
    if (query && match) card.open = true;
    if (!query) card.open = false;
  }

  const sections = [...document.querySelectorAll('.prep section')];
  for (const section of sections) {
    const owned = [...section.querySelectorAll('.qa')];
    section.hidden = !query
      ? false
      : owned.length
        ? owned.every((c) => c.hidden) // question section: hide once every card is filtered out
        : !section.textContent.toLowerCase().includes(query); // prose section: match its own text
  }

  document.getElementById('noResults').hidden = !query || sections.some((s) => !s.hidden);
  toggleAll.textContent = query ? 'Collapse all' : 'Expand all';
});

render();
