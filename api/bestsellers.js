import fs from 'fs/promises';
import path from 'path';

const translationDict = {
  ru: {
    "Game": "Игра",
    "Software": "Программное обеспечение",
    "Gift Card": "Подарочная карта",
    "Account": "Аккаунт",
    "No description": "Нет описания",
    "PlayStation": "PlayStation",
    "Xbox": "Xbox",
    "Mobile": "Мобильный",
    "Software License": "Лицензия программного обеспечения"
  },
  en: {
    "Игра": "Game",
    "Программное обеспечение": "Software",
    "Подарочная карта": "Gift Card",
    "Аккаунт": "Account",
    "Нет описания": "No description",
    "PlayStation": "PlayStation",
    "Xbox": "Xbox",
    "Мобильный": "Mobile",
    "Лицензия программного обеспечения": "Software License"
  }
};

function translate(text, lang) {
  if (!text || !translationDict[lang]) return text || '';
  for (let key in translationDict[lang]) {
    if (text.includes(key)) {
      return text.replace(new RegExp(key, 'g'), translationDict[lang][key]);
    }
  }
  return text;
}

export async function GET(req) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '12');
  const lang = url.searchParams.get('lang') || 'ru';

  const filePath = path.resolve('./public/id.txt');
  const idList = (await fs.readFile(filePath, 'utf-8')).split(',').map(id => parseInt(id.trim()));

  const start = (page - 1) * limit;
  const idsPage = idList.slice(start, start + limit);

  const response = await fetch('https://api.digiseller.com/api/products/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ ids: idsPage, lang: lang === 'ru' ? 'ru-RU' : 'en-US' })
  });

  const result = await response.json();

  const products = result.products.map(p => ({
    id: p.id,
    name: translate(p.name, lang),
    description: translate(p.desc || '', lang),
    image: p.image?.url || '',
    price: p.prices?.[0]?.amount || '',
    currency: p.prices?.[0]?.currency?.name || '',
    affiliate_link: `https://plati.market/itm/${p.id}?ai=1393244`
  }));

  return new Response(JSON.stringify({ products, total: idList.length }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
