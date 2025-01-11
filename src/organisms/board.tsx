'use client';

import React, { FC, useState, useEffect } from 'react';
import DebugSocketMessages from '../molecules/messages';
import { useSocket } from '../contexts/socket';
import { DebugJsonMessage } from '$/types';

const DEBUGJSON_NUM_DATA_OPTIONS = [10, 25, 50, 100];

export type DebugMessageBoardProps = {
  socket?: string;
  messages?: DebugJsonMessage[];
  setNumData?: (n: number) => void;
};

const DebugMessageBoard: FC<DebugMessageBoardProps> = (props) => {
  // UI STATES
  const [showJson, setShowJson] = useState<boolean>(false);
  const [numData, _setNumData] = useState<number>(
    DEBUGJSON_NUM_DATA_OPTIONS[0]
  );
  const setNumData = (n: number) => {
    console.log(`Set Num Data: ${n}`);
    _setNumData(n);
    if (props.setNumData) {
      props.setNumData(n);
    }
  };

  const [sock, setSock] = useState<string | null>(null);

  const { connected, socket, sockets } = useSocket();

  useEffect(() => {
    if (connected && socket) {
      if (props.socket && sockets && sockets.includes(props.socket)) {
        setSock(props.socket);
      } else if (sockets && sockets.length > 0) {
        setSock(sockets[0]);
      } else {
        setSock(null);
      }
    } else {
      setSock(null);
    }
  }, [connected, props.socket, socket, sockets]);

  return sock ? (
    <>
      <h2>{`DEBUG SOCKET '${sock}'`}</h2>
      <DebugSocketMessages
        key={`debug-socket-${sock}`}
        label={sock}
        num={numData}
        showJson={showJson}
        messages={props.messages}
      />
      <div className="flex gap-4 items-center flex-col sm:flex-row">
        {/* <a
          className="rounded-xl border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Flash Controller
        </a> */}
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
    </>
  ) : (
    <h2>
      {props.socket
        ? `DEBUG SOCKET ENOENT '${props.socket}'`
        : 'NO DEBUG SOCKETS'}
    </h2>
  );
};

export default DebugMessageBoard;
