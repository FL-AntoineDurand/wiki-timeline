// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState } from 'react';
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
        margin: '50px 0',
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

      <div
        style={{
          background: '#111',
          margin: '50px',
          border: 'solid 2px #222',
          width: 'fit-content'
        }}
      >
        {articlesData.map((article, index) => (
          <>
            {article.events.map((event) =>
              event.end ? (
                <div
                  key={event.summary}
                  className="period"
                  style={{
                    marginLeft: `${
                      (parseInt(event.begin.year) - timelineBegin) * zoom
                    }px`,
                    width: `${
                      (parseInt(event.end.year) - parseInt(event.begin.year)) *
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
                    marginLeft: `${
                      (parseInt(event.begin.year) - timelineBegin) * zoom
                    }px`,
                    backgroundColor: articleColors[index],
                  }}
                >
                  <span className="event-text">
                    {event.begin.year} {event.summary}
                  </span>
                </div>
              )
            )}
          </>
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
    <div>
      <header
        style={{
          top: '20px',
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '90vw',
          margin: '0 25px',
        }}
      >
        <div style={{ flex: '0 1 400px', textAlign: 'center' }}></div>
        <div style={{ flex: '1 0 600px', textAlign: 'center' }}>
          <span style={{ color: 'white' }}>
            Copy-Paste a Wikipedia article title
          </span>
          <input
            style={{
              margin: '0 15px',
              border: '1px solid #ccc',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              width: '100%',
              maxWidth: '500px',
            }}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
          />
          <button
            onClick={() => handleSearch(searchTerm)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
            }}
          >
            Go
          </button>
        </div>
        <div style={{ flex: '0 1 400px', textAlign: 'center' }}></div>
      </header>
      <div style={{ marginTop: '100px' }}>
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
      </div>
    </div>
  );
}

export default App;
