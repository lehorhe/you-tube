import React, { useState, useEffect, useRef } from 'react';

const BOOT_SEQUENCE = [
  'Initializing Wnet YouTube Analysis Core v2.5...',
  'Checking system integrity...',
  '[ OK ] Mounted /dev/api/youtube',
  '[ OK ] Mounted /dev/api/gemini',
  'Loading modules:',
  '  - yt_channel_stats.mod',
  '  - yt_video_parser.mod',
  '  - gemini_summary_gen.mod',
  '  - gemini_insight_core.mod',
  'All systems nominal. Awaiting user input.',
];

const GIRAFFES = [
  // Giraffe 1 by jgs
  [
    '      \\\\',
    '       \\\\_',
    "    .---(')",
    '   o( )_-\\_',
  ],
  // Giraffe 2 by unknown
  [
    '    .--.',
    '   |o_o |',
    '   |:_/ |',
    '  //   \\ \\',
    ' (|     | )',
    "/'\\_   _/`\\",
    '\\___)=(___/',
  ],
];

const HUMAN_INPUT_PROMPT = 'Human in the loop (pol. Człowiek w pętli):';

interface AnalysisProgressProps {
  steps: string[];
  title?: string;
  showBootSequence?: boolean;
  isHumanInputEnabled?: boolean;
  onHumanInputCommand?: (command: string) => void;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ 
    steps, 
    title = 'SYSTEM LOG', 
    showBootSequence = false,
    isHumanInputEnabled = false,
    onHumanInputCommand 
}) => {
  const [fullyTypedText, setFullyTypedText] = useState('');
  const [currentLine, setCurrentLine] = useState('');
  const [humanInput, setHumanInput] = useState('');
  const [isAwaitingHumanInput, setIsAwaitingHumanInput] = useState(false);
  
  const linesQueueRef = useRef<string[]>([]);
  const isTypingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const prevStepsRef = useRef<string[]>([]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processQueue = () => {
    if (isTypingRef.current || linesQueueRef.current.length === 0) {
        if (!isTypingRef.current && linesQueueRef.current.length === 0 && isHumanInputEnabled && !isAwaitingHumanInput) {
            linesQueueRef.current.push(HUMAN_INPUT_PROMPT);
        } else {
             return;
        }
    }
    isTypingRef.current = true;
    const nextLine = linesQueueRef.current.shift();
    if (nextLine) {
        typeLine(nextLine);
    }
  }

  const typeLine = (line: string) => {
    let index = 0;
    const type = () => {
        if (index < line.length) {
            setCurrentLine(prev => prev + line[index]);
            index++;
            animationFrameRef.current = window.setTimeout(type, Math.random() * 15 + 5);
        } else {
            setFullyTypedText(prev => prev + line + '\n');
            setCurrentLine('');
            isTypingRef.current = false;
            
            if (line === HUMAN_INPUT_PROMPT) {
                setIsAwaitingHumanInput(true);
                setTimeout(() => inputRef.current?.focus(), 50);
            } else {
                processQueue();
            }
        }
    };
    type();
  }

  // Effect for initialization (runs ONCE on mount, thanks to `key` prop)
  useEffect(() => {
    const initialQueue: string[] = [];

    // 1. Giraffe Anomaly (25% chance)
    if (Math.random() < 0.25) {
        const giraffe = GIRAFFES[Math.floor(Math.random() * GIRAFFES.length)];
        initialQueue.push('Hold on, detecting anomaly in the data stream...');
        initialQueue.push(...giraffe.map(line => `  ${line}`));
        initialQueue.push('Anomaly classified: Giraffa camelopardalis. Non-critical. Resuming operations.');
    }

    // 2. Boot Sequence
    if (showBootSequence) {
        if (initialQueue.length > 0) initialQueue.push('-----------------------------------------');
        initialQueue.push(...BOOT_SEQUENCE);
    }
    
    linesQueueRef.current = initialQueue;
    prevStepsRef.current = []; // Initialize prevSteps for the other effect
    processQueue();

    // Cleanup
    return () => {
        if (animationFrameRef.current) clearTimeout(animationFrameRef.current);
        isTypingRef.current = false;
    };
  }, [showBootSequence]); // Relies on prop, but `key` remount ensures it only runs once at the start

  // Effect for handling incoming steps AFTER initial mount
  useEffect(() => {
    if (steps.length > prevStepsRef.current.length) {
        const newSteps = steps.slice(prevStepsRef.current.length);
        linesQueueRef.current.push(...newSteps);
        processQueue();
    }
    prevStepsRef.current = steps;
  }, [steps]);
  
  // Effect for handling human input
  useEffect(() => {
    if (!isTypingRef.current && linesQueueRef.current.length === 0 && isHumanInputEnabled && !isAwaitingHumanInput) {
        processQueue();
    }
  }, [isHumanInputEnabled, isAwaitingHumanInput]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [fullyTypedText, currentLine, humanInput]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!humanInput.trim()) return;

      setFullyTypedText(prev => prev + `> ${humanInput}\n`);
      onHumanInputCommand?.(humanInput);
      setHumanInput('');
      setIsAwaitingHumanInput(false);
  };

  return (
    <div className="bg-black border-2 border-neutral-800 rounded-lg font-terminal text-base text-green-400 shadow-[0_0_20px_rgba(52,211,153,0.2)] relative crt-effect aspect-[4/3] w-full max-w-2xl mx-auto flex flex-col overflow-hidden">
        <div className="bg-neutral-800 border-b-2 border-neutral-700 px-4 py-1 text-center font-bold text-neutral-300 text-sm tracking-widest flex-shrink-0">
            :: {title} ::
        </div>
        <div ref={terminalRef} className="p-4 overflow-y-auto flex-1" onClick={() => inputRef.current?.focus()}>
          <pre className="whitespace-pre-wrap leading-normal">
            {fullyTypedText}
            {!isAwaitingHumanInput && currentLine}
            {!isAwaitingHumanInput && isTypingRef.current && <span className="animate-blink">_</span>}
          </pre>
           {isAwaitingHumanInput && (
              <form onSubmit={handleFormSubmit}>
                  <div className="flex">
                    <span className="text-green-400 mr-2 whitespace-pre">{'> '}</span>
                    <div className="relative flex-1">
                      <input
                          ref={inputRef}
                          type="text"
                          value={humanInput}
                          onChange={(e) => setHumanInput(e.target.value)}
                          className="bg-transparent border-none outline-none text-green-400 w-full p-0 font-terminal text-base"
                          autoComplete="off"
                          autoFocus
                      />
                    </div>
                  </div>
              </form>
            )}
        </div>
      <style>{`
        .crt-effect {
          text-shadow: 0 0 5px #34d399, 0 0 10px #34d399;
        }
        .crt-effect::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(to bottom, rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
          z-index: 1;
          background-size: 100% 4px;
          pointer-events: none;
        }
         /* Custom scrollbar for terminal */
        .overflow-y-auto::-webkit-scrollbar {
            width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
            background: #1a1a1a;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
            background-color: #34d399;
            border-radius: 4px;
            border: 2px solid #1a1a1a;
        }
      `}</style>
    </div>
  );
};

export default AnalysisProgress;