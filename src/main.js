import './style.css'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

const supabaseUrl = 'https://ahfdcxiyyntnmcylfkqn.supabase.co';
const supabaseanonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZmRjeGl5eW50bm1jeWxma3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NTk2MTEsImV4cCI6MjA2MzIzNTYxMX0.bmUO6vPu8svMLE-SbuI9_Zg8XCGHrwRr9D4n-tgoaW8";
const supabase = createClient(supabaseUrl, supabaseanonKey);

const app = document.createElement('div');
app.className = 'max-w-2xl mx-auto p-4';
document.body.appendChild(app);

let currentSort = 'created_at.desc';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
}

function getSortOptionsHtml(selected) {
  return `
    <label class="block mb-2 font-semibold">Sortuj:</label>
    <select id="sort-select" class="mb-4 p-2 border rounded">
      <option value="created_at.asc" ${selected === 'created_at.asc' ? 'selected' : ''}>po dacie rosnąco</option>
      <option value="created_at.desc" ${selected === 'created_at.desc' ? 'selected' : ''}>po dacie malejąco</option>
      <option value="title.asc" ${selected === 'title.asc' ? 'selected' : ''}>po nazwie alfabetycznie</option>
    </select>
  `;
}

async function fetchArticles() {
  const [orderField, orderDirection] = currentSort.split('.');
  const { data, error } = await supabase
    .from('article')
    .select('*')
    .order(orderField, { ascending: orderDirection === 'asc' });

  if (error) {
    app.innerHTML = `<p class="text-red-500">Błąd pobierania artykułów: ${error.message}</p>`;
    return;
  }

  const articlesHtml = data.map(article => `
    <article class="mb-8 p-4 border rounded bg-white shadow">
      <h2 class="text-xl font-bold">${article.title}</h2>
      <h3 class="text-md text-gray-600 mb-2">${article.subtitle}</h3>
      <div class="text-sm text-gray-500 mb-1">
        Autor: <span class="font-semibold">${article.author}</span> | 
        Data: ${formatDate(article.created_at)}
      </div>
      <div class="mt-2">${article.content}</div>
    </article>
  `).join('');

  app.innerHTML = `
    <div id="sort-container">${getSortOptionsHtml(currentSort)}</div>
    <div id="articles">${articlesHtml}</div>
    <form id="article-form" class="mt-8 p-4 border rounded bg-gray-50 flex flex-col gap-2">
      <h2 class="font-bold mb-2">Dodaj nowy artykuł</h2>
      <input name="title" placeholder="Tytuł" class="p-2 border rounded" required />
      <input name="subtitle" placeholder="Podtytuł" class="p-2 border rounded" required />
      <input name="author" placeholder="Autor" class="p-2 border rounded" required />
      <textarea name="content" placeholder="Treść" class="p-2 border rounded" required></textarea>
      <label class="font-semibold">Data utworzenia:</label>
      <input name="created_at" type="date" class="p-2 border rounded" required />
      <button type="submit" class="bg-green-600 text-white p-2 rounded mt-2 cursor-pointer">Dodaj artykuł</button>
      <div id="form-message" class="text-sm mt-2"></div>
    </form>
  `;

  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    fetchArticles();
  });

  document.getElementById('article-form').addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  let createdAt = formData.get('created_at');
  if (createdAt) {
    createdAt = new Date(createdAt + 'T12:00:00').toISOString();
  } else {
    createdAt = new Date().toISOString();
  }

  const newArticle = {
    title: formData.get('title'),
    subtitle: formData.get('subtitle'),
    author: formData.get('author'),
    content: formData.get('content'),
    created_at: createdAt
  };

  const { error } = await supabase.from('article').insert([newArticle]);
  const msgDiv = document.getElementById('form-message');
  if (error) {
    msgDiv.textContent = `Błąd dodawania: ${error.message}`;
    msgDiv.className = 'text-red-500 mt-2';
  } else {
    msgDiv.textContent = 'Artykuł dodany!';
    msgDiv.className = 'text-green-600 mt-2';
    form.reset();
    fetchArticles();
  }
}

fetchArticles();