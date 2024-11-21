const fs = require('fs');
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
const openai = new OpenAI();

//

//

async function getWikipediaArticleLinks(title) {
  const queryParams = {
    action: 'parse',
    format: 'json',
    page: title,
    prop: 'parsetree',
  };

  const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams(
    queryParams
  )}`;
  const response = await fetch(url);
  const data = await response.json();

  //console.log(data.parse.parsetree);

  const parsetree = data.parse.parsetree['*'];
  const links = parsetree
    .match(/\[\[([^\]]+)\]\]/g)
    .map((link) => link.slice(2, -2));

  // Save parsetree to article.xml file
  // fs.writeFileSync('/tmp/article.xml', parsetree);

  return links;
}

//

async function getWikipediaArticleText(title) {
  const queryParams = {
    action: 'query',
    format: 'json',
    prop: 'extracts|info',
    titles: title,
    exintro: 'true',
    explaintext: 'true',
  };

  const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams(
    queryParams
  )}`;

  const response = await fetch(url);
  const data = await response.json();

  // console.log(data);

  const pages = data.query.pages;
  for (const pageId in pages) {
    if (!pages[pageId].missing) {
      return { text: pages[pageId].extract };
    } else {
      throw new Error('Article not found.');
    }
  }
}

//
//

const extractEvents = async (text: string) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      {
        role: 'user',
        content: `Extract all dates or periods of time from this article and provide them following this format: 
{
begin: {
   year: string,
   month?: string,
   day?: string
},
end?: {
   year: string,
   month?: string,
   day? : string,
},
summary: string
}.

article: 
${text}`,
      },
    ],
  });

  const raw = completion.choices[0].message.content;
  const jsonContent = raw.split('```json')[1].split('```')[0].trim();
  const parsedJson = JSON.parse(jsonContent);
  console.log(parsedJson);
  return parsedJson;
};

//
//

if (!process.env.OPENAI_API_KEY) throw new Error('No openai api key');

//
//
const main = async (article: string) => {
  const sanitizedArticleName = article.replace(/[^a-zA-Z0-9-_]+/g, ' ');

  // Check if the sanitized article name exists
  if (fs.existsSync(`${sanitizedArticleName}.json`)) {
    return JSON.parse(fs.readFileSync(`${sanitizedArticleName}.json`, 'utf8'));
  }

  // Example usage
  const links = await getWikipediaArticleLinks(article);
  // console.log(links);

  const { text } = await getWikipediaArticleText(article);
  // console.log({ text });

  // Filter links to keep those appearing in the text variable
  const filteredLinks = links.filter((link) => text.includes(link));
  // console.log(filteredLinks);

  const events = await extractEvents(text);

  const save = {
    article,
    text,
    links: filteredLinks,
    events,
  };

  fs.writeFileSync(`${sanitizedArticleName}.json`, JSON.stringify(save));

  return save;
};

//
//
//

const app = express();
const port = 3000;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.options('/events', (req, res) => {
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.send();
});

app.get('/events', async (req, res) => {
  const article = req.query.article;
  if (!article) {
    return res.status(400).send('Article parameter is required');
  }
  try {
    const result = await main(article);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
