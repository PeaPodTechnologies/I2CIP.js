'use client';

import Image from 'next/image';
import ControllerMessages from './organisms/messages';
import { useState } from 'react';
import DebugSocketProvider from './contexts/socket';

const DEBUGJSON_NUM_DATA_OPTIONS = [10, 25, 50, 100];

const Home: React.FC<{}> = (props) => {
  const [showJson, setShowJson] = useState<boolean>(false);
  const [numData, _setNumData] = useState<number>(
    DEBUGJSON_NUM_DATA_OPTIONS[0]
  );

  const setNumData = (n: number) => {
    console.log(`Set Num Data: ${n}`);
    _setNumData(n);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-2 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">
          DebugJson.JS
        </h1>
        <DebugSocketProvider
          socketChildMap={(socket) => (
            <ControllerMessages
              label={socket}
              num={numData}
              showJson={showJson}
              key={`messages-${socket}`}
            />
          )}
        >
          <h2>Offline</h2>{' '}
        </DebugSocketProvider>
        <p className="min-w-[65vw] text-xs">&nbsp;</p> {/* Horizontal Spacer */}
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-xl border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Flash Controller
          </a>
          <a
            className="rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            // href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowJson(!showJson)}
          >
            {showJson ? 'Show Debug' : 'Show JSON'}
          </a>
          <select
            className="rounded-xl border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 pr-8"
            value={numData}
            onChange={(e) => {
              console.log(`Set Num Data: ${e.target.value}`);
              setNumData(Number(e.target.value));
            }}
          >
            {DEBUGJSON_NUM_DATA_OPTIONS.map((num) => (
              <option key={num} value={num}>
                {`Show ${num}`}
              </option>
            ))}
          </select>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          // href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          GitHub Repository
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.npmjs.com/package/debugjson.js"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          npm Package
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.peapodtech.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to peapodtech.com →
        </a>
      </footer>
    </div>
  );
};

export default Home;
