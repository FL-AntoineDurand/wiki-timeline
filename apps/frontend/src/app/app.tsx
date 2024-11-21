// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState } from 'react';
import { CheckCircledIcon, PlusIcon } from '@radix-ui/react-icons';
import axios from 'axios';

import './app.scss';

//
//
//

type Event = {
  begin: {
    year: string;
    month?: string;
    day?: string;
  };
  end: {
    year: string;
    month?: string;
    day?: string;
  };
  summary: string;
};

type ArticleData = {
  article: string;
  events: Event[];
  links: string[];
};

//
//
//
const Timeline = ({
  articlesData,
  zoom,
  handleSearch,
}: {
  articlesData: ArticleData[];
  zoom: number;
  handleSearch: (article: string) => void;
}) => {
  const articleColors = articlesData.map((article) => {
    return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
      Math.random() * 256
    )}, ${Math.floor(Math.random() * 256)})`;
  });

  let verticalPosition = 0;

  const timelineBegin = Math.min(
    ...articlesData.flatMap((article) =>
      article.events.map((event) => parseInt(event.begin.year))
    )
  );

  const allLinks = articlesData.flatMap((article, index) => {
    const links = [...new Set(article.links)];
    return links.map((l) => ({ color: articleColors[index], text: l }));
  });

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        margin: '50px 50px',
      }}
    >
      <div style={{ margin: '0 50px' }}>
        {allLinks.map((link) => (
          <button
            className="link-button"
            style={{ borderColor: link.color }}
            onClick={() => handleSearch(link.text)}
          >
            {link.text}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginTop: '50px' }}>
        {articlesData.map((article, index) => (
          <div
            key={article.article}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <div
              style={{
                width: '100%',
              }}
            >
              {article.events.map((event) =>
                event.end ? (
                  <div
                    key={event.summary}
                    className="period"
                    style={{
                      left: `${
                        (parseInt(event.begin.year) - timelineBegin) * zoom
                      }px`,
                      top: `calc((var(--event-height) + var(--event-vertical-margin)) * ${verticalPosition++})`,
                      width: `${
                        (parseInt(event.end.year) -
                          parseInt(event.begin.year)) *
                        zoom
                      }px`,
                      backgroundColor: articleColors[index],
                    }}
                  >
                    <span className="event-text">
                      {event.begin.year}-{event.end.year} {event.summary}
                    </span>
                  </div>
                ) : (
                  <div
                    key={event.summary}
                    className="event"
                    style={{
                      left: `${
                        (parseInt(event.begin.year) - timelineBegin) * zoom
                      }px`,
                      top: `calc((var(--event-height) + var(--event-vertical-margin)) * ${verticalPosition++})`,
                      backgroundColor: articleColors[index],
                    }}
                  >
                    <span className="event-text">
                      {event.begin.year} {event.summary}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

//
//
//

export function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ArticleData[]>([]);

  const handleSearch = async (article: string) => {
    try {
      const response = await axios.get(
        'https://timeline-backend.fluid-lifecycle.com/events',
        {
          params: {
            article: article,
          },
        }
      );
      setSearchResults([...searchResults, response.data]);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <header className="flex items-center justify-between w-full mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="border p-2 rounded-md w-full"
        />
        <button
          onClick={() => handleSearch(searchTerm)}
          className="ml-2 p-2 rounded-md bg-blue-500 text-white"
        >
          <CheckCircledIcon />
        </button>
      </header>
      <main className="w-full">
        {searchResults.length > 0 ? (
          <>
            <Timeline
              articlesData={searchResults}
              zoom={20}
              handleSearch={handleSearch}
            />
            {/*
            <ul className="list-disc pl-5">
              {searchResults.map((result, index: number) => (
                <li key={index}>
                  <pre>{JSON.stringify(result.events, null, 4)}</pre>
                </li>
              ))}
            </ul>
            */}
          </>
        ) : (
          <p>No results found.</p>
        )}
      </main>
    </div>
  );
}

export default App;
