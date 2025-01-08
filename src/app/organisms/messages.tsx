'use client';

import { DebugJsonMessage } from './../../../api/types';
import { parseType } from './../../../api/utils';
import { useEffect, useState } from 'react';
import { useSocket, socket } from '../contexts/socket';

const parseTimestamp = (ms: number): string => {
  // ms duration since program start
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const msString = (ms % 1000).toString().padStart(3, '0');
  const secondsString = (seconds % 60).toString().padStart(2, '0');
  const minutesString = (minutes % 60).toString().padStart(2, '0');
  const hoursString = hours.toString().padStart(2, '0');

  return `${hoursString}:${minutesString}:${secondsString}.${msString}`;
};

const ControllerMessages: React.FC<{
  label: string;
  num?: number;
  showJson?: boolean;
}> = (props) => {
  const [messages, setMessages] = useState<DebugJsonMessage[]>([]);

  const { connected } = useSocket();

  useEffect(() => {
    function addJson(msg: DebugJsonMessage) {
      // console.log(`Add JSON: ${JSON.stringify(msg)}`);
      setMessages((prev) => {
        const updatedNumbers = [msg, ...prev];
        return updatedNumbers.slice(0, props.num ?? 1);
      });
    }

    if (connected) {
      console.log('Debug Socket Connected');
      socket?.on(props.label, addJson);
    }

    return () => {
      socket?.off(props.label, addJson);
    };
  }, [connected, props.label, props.num]);

  return (
    <>
      <ol className="list-inside text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)] bg-gray-100 rounded-xl p-4">
        {messages.length == 0 ? (
          <li className="mb-2 display:inline-block margin-top:.5rem">
            <span className="text-xs text-gray-400 display:inline-block">
              EMPTY
            </span>
          </li>
        ) : (
          messages.map((msg, i) => {
            return (
              <li
                className="mb-2 display:inline-block margin-top:.5rem"
                key={`json-${props.label}-${i}`}
              >
                {props.showJson === true ? (
                  <span className="text-xs text-gray-600 display:inline-block">
                    <code>{JSON.stringify(msg)}</code>
                  </span>
                ) : (
                  <>
                    <span className="text-xs text-gray-400 display:inline-block">
                      {`[ ${
                        msg.t ? `${msg.t}` : parseType(msg.type).toUpperCase()
                      } ${msg.timestamp ? parseTimestamp(msg.timestamp) : 'NOW'} ]`}
                    </span>
                    <span className="minWidth:1rem display:inline-block">
                      &nbsp;{' '}
                    </span>
                    <span className="text-xs text-gray-400 display:inline-block">
                      {msg.data &&
                        Object.entries(msg.data).map(([key, value]) => {
                          return (
                            <span
                              key={`json-${props.label}-${i}-${key}`}
                              className="ml-1 text-gray-900 display:inline-block"
                            >
                              {key
                                .split('-')
                                .map(
                                  (word) =>
                                    word.slice(0, 1).toUpperCase() +
                                    word.slice(1).toLowerCase()
                                )
                                .join(' ')}
                              : {JSON.stringify(value)}
                            </span>
                          );
                        })}
                    </span>
                    <span className="text-xs text-gray-600 display:inline-block">
                      <code>{JSON.stringify(msg.msg)}</code>
                    </span>
                  </>
                )}
              </li>
            );
          })
        )}
      </ol>
    </>
  );
};

export default ControllerMessages;
