const routes = [
  {
    number: '5181',
    name: 'Laranjal / Centro',
    origin: 'Laranjal',
    destination: 'Centro',
    region: 'Leste',
    neighborhoods: ['Laranjal', 'Areal', 'Centro'],
    notice: '',
    times: {
      util: ['06:00', '07:00', '08:00', '12:00', '18:00', '22:00'],
      sabado: ['07:00', '12:00', '18:00', '20:00'],
      domingo: ['08:00', '12:00', '18:00'],
    },
  },
  {
    number: '1101',
    name: 'Fragata / Centro',
    origin: 'Fragata',
    destination: 'Centro',
    region: 'Oeste',
    neighborhoods: ['Fragata', 'Centro'],
    notice: 'Desvio ilustrativo na Av. Duque de Caxias.',
    times: {
      util: ['05:30', '06:15', '07:00', '07:45', '17:30', '18:15', '19:00'],
      sabado: ['06:30', '07:30', '12:30', '13:30', '18:30'],
      domingo: [],
    },
  },
  {
    number: '2311',
    name: 'Areal / Três Vendas',
    origin: 'Areal',
    destination: 'Três Vendas',
    region: 'Norte',
    neighborhoods: ['Areal', 'Centro', 'Três Vendas'],
    notice: '',
    times: {
      util: ['06:00', '07:30', '12:00', '13:30', '17:00', '18:30'],
      sabado: ['07:30', '12:30', '18:30'],
      domingo: ['08:30', '17:30'],
    },
  },
  {
    number: '0100',
    name: 'Circular Centro',
    origin: 'Centro',
    destination: 'Centro',
    region: 'Centro',
    neighborhoods: ['Centro', 'Porto'],
    notice: '',
    times: {
      util: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
      sabado: [],
      domingo: [],
    },
  },
  {
    number: '6101',
    name: 'Navegantes / Centro',
    origin: 'Navegantes',
    destination: 'Centro',
    region: 'Sul',
    neighborhoods: ['Navegantes', 'Porto', 'Centro'],
    notice: '',
    times: {
      util: ['06:15', '07:15', '12:15', '18:15'],
      sabado: ['07:15', '12:15'],
      domingo: ['08:15', '18:15'],
    },
  },
  {
    number: '4101',
    name: 'Bom Jesus / Centro',
    origin: 'Bom Jesus',
    destination: 'Centro',
    region: 'Leste',
    neighborhoods: ['Bom Jesus', 'Areal', 'Centro'],
    notice: 'Atrasos ilustrativos em horário de pico.',
    times: {
      util: ['06:40', '07:40', '12:40', '18:40'],
      sabado: ['07:40', '12:40'],
      domingo: [],
    },
  },
];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function lineCard(route) {
  const neighborhoods = route.neighborhoods
    .map((neighborhood) => `<span>${escapeHtml(neighborhood)}</span>`)
    .join('');

  return `
    <article class="line-card">
      <div class="line-card__top">
        <span class="line-number">${escapeHtml(route.number)}</span>
        <span class="status"><i></i> Em demonstração</span>
      </div>
      <h3>${escapeHtml(route.name)}</h3>
      <p class="route-flow"><strong>${escapeHtml(route.origin)}</strong><span>→</span><strong>${escapeHtml(route.destination)}</strong></p>
      <div class="tags">${neighborhoods}</div>
      ${route.notice ? `<p class="notice">⚠ ${escapeHtml(route.notice)}</p>` : ''}
      <a class="text-link" href="/horarios?linha=${encodeURIComponent(route.number)}">Consultar horários <span>→</span></a>
    </article>
  `;
}

function renderFeatured() {
  const target = document.querySelector('[data-featured-lines]');
  if (target) target.innerHTML = routes.slice(0, 3).map(lineCard).join('');
}

function renderLines() {
  const target = document.querySelector('[data-lines-grid]');
  const input = document.querySelector('[data-line-search]');
  const select = document.querySelector('[data-region-filter]');
  const count = document.querySelector('[data-result-count]');
  const empty = document.querySelector('[data-empty-state]');
  if (!target || !input || !select) return;

  const update = () => {
    const query = input.value.trim().toLocaleLowerCase('pt-BR');
    const region = select.value;
    const filtered = routes.filter((route) => {
      const haystack = [
        route.number,
        route.name,
        route.origin,
        route.destination,
        ...route.neighborhoods,
      ].join(' ').toLocaleLowerCase('pt-BR');
      return (!query || haystack.includes(query)) && (!region || route.region === region);
    });
    target.innerHTML = filtered.map(lineCard).join('');
    count.textContent = `${filtered.length} ${filtered.length === 1 ? 'linha encontrada' : 'linhas encontradas'}`;
    empty.hidden = filtered.length !== 0;
  };

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) input.value = initialQuery;
  input.addEventListener('input', update);
  select.addEventListener('change', update);
  update();
}

function scheduleCard(route, day) {
  const labels = { util: 'Dias úteis', sabado: 'Sábados', domingo: 'Domingos e feriados' };
  const times = route.times[day];
  return `
    <article class="schedule-card">
      <div class="schedule-card__route">
        <span class="line-number">${escapeHtml(route.number)}</span>
        <div><h3>${escapeHtml(route.name)}</h3><p>${labels[day]}</p></div>
      </div>
      ${times.length
        ? `<div class="time-grid">${times.map((time) => `<time>${escapeHtml(time)}</time>`).join('')}</div>`
        : '<p class="no-service">Sem operação ilustrativa neste tipo de dia.</p>'}
    </article>
  `;
}

function renderSchedules() {
  const target = document.querySelector('[data-schedule-list]');
  const filters = document.querySelectorAll('[data-day-filter]');
  if (!target || !filters.length) return;
  const line = new URLSearchParams(window.location.search).get('linha');
  const selectedRoutes = line ? routes.filter((route) => route.number === line) : routes;
  let activeDay = 'util';

  const update = () => {
    target.innerHTML = selectedRoutes.map((route) => scheduleCard(route, activeDay)).join('');
    filters.forEach((filter) => {
      const selected = filter.dataset.dayFilter === activeDay;
      filter.classList.toggle('is-active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
  };

  filters.forEach((filter) => filter.addEventListener('click', () => {
    activeDay = filter.dataset.dayFilter;
    update();
  }));
  update();
}

function setupNavigation() {
  const button = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!button || !menu) return;
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('is-open', !open);
  });
}

function setupHomeSearch() {
  const form = document.querySelector('[data-home-search]');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = new FormData(form).get('q')?.toString().trim() ?? '';
    window.location.href = query ? `/linhas?q=${encodeURIComponent(query)}` : '/linhas';
  });
}

setupNavigation();
setupHomeSearch();
renderFeatured();
renderLines();
renderSchedules();
