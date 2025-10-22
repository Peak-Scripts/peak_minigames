import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SequenceMinigameProps, Cell } from '@/types';
const GRID_SIZE = 6;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const SequenceMinigame: React.FC<SequenceMinigameProps> = ({ 
  onComplete, 
  onClose, 
  rounds: propRounds = 3,
  sequenceLength: propSequenceLength = 3,
  showTime: propShowTime = 3000,
  inputTime: propInputTime = 8000
}) => {
  const rounds = Math.min(Math.max(propRounds, 1), 10);
  const sequenceLength = Math.min(Math.max(propSequenceLength, 1), 6);
  const showTime = Math.min(Math.max(propShowTime, 500), 10000);
  const inputTime = Math.min(Math.max(propInputTime, 2000), 30000);
  
  const [isVisible] = useState(true);
  const [grid, setGrid] = useState<Cell[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(rounds);
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'input' | 'success' | 'failed'>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(0);
  const [progressPercent, setProgressPercent] = useState(100);
  const [previewProgressPercent, setPreviewProgressPercent] = useState(100);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const showSequenceAbortRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const pendingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.005, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
    }
  }, []);

  const playClickSound = useCallback(() => {
    playSound(1200, 80, 'square');
  }, [playSound]);

  const playCorrectSound = useCallback(() => {
    playSound(1800, 100, 'square');
    setTimeout(() => playSound(2400, 80, 'square'), 80);
  }, [playSound]);

  const playWrongSound = useCallback(() => {
    playSound(150, 200, 'sawtooth');
    setTimeout(() => playSound(120, 200, 'sawtooth'), 100);
  }, [playSound]);

  const playSuccessSound = useCallback(() => {
    setTimeout(() => playSound(1000, 100, 'square'), 0);
    setTimeout(() => playSound(1400, 100, 'square'), 100);
    setTimeout(() => playSound(1800, 100, 'square'), 200);
    setTimeout(() => playSound(2400, 150, 'square'), 300);
  }, [playSound]);

  const playFailSound = useCallback(() => {
    setTimeout(() => playSound(300, 150, 'sawtooth'), 0);
    setTimeout(() => playSound(200, 150, 'sawtooth'), 100);
    setTimeout(() => playSound(100, 300, 'sawtooth'), 200);
  }, [playSound]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    pendingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    pendingTimeoutsRef.current = [];
    showSequenceAbortRef.current = true;
  }, []);

  const initializeGrid = useCallback(() => {
    const newGrid: Cell[] = Array.from({ length: TOTAL_CELLS }, (_, i) => ({
      id: i,
      isActive: false,
      isCorrect: false,
      isWrong: false,
    }));
    setGrid(newGrid);
  }, []);

  const generateSequence = useCallback((length: number) => {
    const seq: number[] = [];
    const available = Array.from({ length: TOTAL_CELLS }, (_, i) => i);
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);

      seq.push(available[randomIndex]);

      available.splice(randomIndex, 1);
    }
    
    return seq;
  }, []);

  const configRef = useRef({
    rounds: rounds,
    sequenceLength: sequenceLength,
    showTime: showTime,
    inputTime: inputTime
  });

  useEffect(() => {
    configRef.current = {
      rounds: rounds,
      sequenceLength: sequenceLength,
      showTime: showTime,
      inputTime: inputTime
    };
    setTotalRounds(rounds);
  }, [rounds, sequenceLength, showTime, inputTime]);

  const showSequence = useCallback(async (seq: number[]) => {
    if (showSequenceAbortRef.current) {
      return;
    }
    
    showSequenceAbortRef.current = false;

    setGameState('showing');
    setPlayerInput([]);
    initializeGrid();
    
    const totalPreviewTime = seq.length * 1000;

    setPreviewTimeLeft(totalPreviewTime);
    setPreviewProgressPercent(100);
    
    const startTime = Date.now();
    
    const animatePreview = () => {
      if (showSequenceAbortRef.current) {
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalPreviewTime - elapsed);
      const percent = (remaining / totalPreviewTime) * 100;
      
      setPreviewTimeLeft(remaining);
      setPreviewProgressPercent(Math.max(0, percent));
      
      if (remaining > 0 && !showSequenceAbortRef.current) {
        requestAnimationFrame(animatePreview);
      }
    };
    
    requestAnimationFrame(animatePreview);
    
    for (let i = 0; i < seq.length; i++) {
      if (showSequenceAbortRef.current) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, i === 0 ? 500 : 600));
      
      if (showSequenceAbortRef.current) {
        return;
      }
      
      playClickSound();
      
      setGrid(prev => prev.map(cell => ({
        ...cell,
        isActive: cell.id === seq[i],
        isCorrect: false,
        isWrong: false,
      })));
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (showSequenceAbortRef.current) {
        return;
      }
      
      setGrid(prev => prev.map(cell => ({
        ...cell,
        isActive: false,
      })));
    }
    
    if (showSequenceAbortRef.current) {
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (showSequenceAbortRef.current) {
      return;
    }
    setPreviewTimeLeft(0);
    setGameState('input');
    setPlayerInput([]);
    setTimeLeft(configRef.current.inputTime);
  }, [initializeGrid, playClickSound]);

  const startRound = useCallback((round: number) => {
    const seq = generateSequence(configRef.current.sequenceLength);
    
    setSequence(seq);
    setCurrentRound(round);
    showSequence(seq);
  }, [generateSequence, showSequence]);

  const initializeGame = useCallback(() => {
    cleanup();
    
    showSequenceAbortRef.current = false;
    isInitializedRef.current = true;
    
    setTotalRounds(rounds);
    setGameState('idle');
    setPlayerInput([]);
    setSequence([]);
    setCurrentRound(1);
    initializeGrid();
    
    const timeout = setTimeout(() => {
      if (isInitializedRef.current) {
        const seq = generateSequence(sequenceLength);
        setSequence(seq);
        setCurrentRound(1);
        showSequence(seq);
      }
    }, 500);
    pendingTimeoutsRef.current.push(timeout);
  }, [initializeGrid, startRound, cleanup]);


  useEffect(() => {
    if (!isVisible || gameState !== 'input') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const startTime = Date.now();
    const duration = configRef.current.inputTime;
    setProgressPercent(100);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const percent = (remaining / duration) * 100;
      
      setTimeLeft(remaining);
      setProgressPercent(Math.max(0, percent));

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        playFailSound();
        setGameState('failed');
        
        const timeout1 = setTimeout(() => {
          onComplete(false);
        }, 2500);
        
        const timeout2 = setTimeout(() => {
          onClose();
        }, 3000);
        
        pendingTimeoutsRef.current.push(timeout1, timeout2);
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, cleanup, playFailSound, isVisible, onComplete, onClose]);

  const handleCellClick = useCallback((cellId: number) => {
    if (gameState !== 'input') {
      return;
    }

    const newInput = [...playerInput, cellId];
    const currentIndex = playerInput.length;

    if (cellId !== sequence[currentIndex]) {
      playWrongSound();
      
      setGrid(prev => prev.map(cell =>
        cell.id === cellId ? { ...cell, isWrong: true } : cell
      ));
      
      const timeout1 = setTimeout(() => {
        playFailSound();
        setGameState('failed');
        
        const timeout2 = setTimeout(() => {
          onComplete(false);
        }, 2500);
        
        const timeout3 = setTimeout(() => {
          onClose();
        }, 3000);
        
        pendingTimeoutsRef.current.push(timeout2, timeout3);
      }, 300);
      
      pendingTimeoutsRef.current.push(timeout1);
      return;
    }

    playCorrectSound();

    setGrid(prev => prev.map(cell =>
      cell.id === cellId ? { ...cell, isCorrect: true } : cell
    ));

    setPlayerInput(newInput);

    if (newInput.length === sequence.length) {
      if (currentRound < totalRounds) {
        const timeout = setTimeout(() => {
          startRound(currentRound + 1);
        }, 800);
        pendingTimeoutsRef.current.push(timeout);
      } else {
        const timeout1 = setTimeout(() => {
          playSuccessSound();
          setGameState('success');
          
          const timeout2 = setTimeout(() => {
            onComplete(true);
          }, 2500);
          
          const timeout3 = setTimeout(() => {
            onClose();
          }, 3000);
          
          pendingTimeoutsRef.current.push(timeout2, timeout3);
        }, 300);
        
        pendingTimeoutsRef.current.push(timeout1);
      }
    }
  }, [gameState, playerInput, sequence, currentRound, totalRounds, startRound, cleanup, playCorrectSound, playWrongSound, playSuccessSound, playFailSound, onComplete, onClose]);

  useEffect(() => {
    initializeGame();
    return () => {
      cleanup();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className='w-full max-w-4xl'>
      <Card className='border-border/40 bg-card/95 shadow-xl relative'>
        <div className='px-6 py-6'>
          <CardTitle className='text-xl'>Sequence Memory</CardTitle>
          <CardDescription>
            {gameState === 'showing' && 'Memorize the sequence'}
            {gameState === 'input' && 'Enter the sequence'}
            {gameState === 'idle' && 'Initializing...'}
          </CardDescription>
        </div>
        <Separator />
        <CardContent className='p-0 pt-6 pb-6'>
          <div className='space-y-4'>
            <div className='flex justify-center'>
              <div className='px-3 py-1 rounded bg-muted/50 text-sm text-muted-foreground'>
                <span className='font-medium'>{currentRound}</span>
                <span className='mx-1'>/</span>
                <span>{totalRounds}</span>
              </div>
            </div>

            <div className='flex justify-center px-6'>
              <div 
                className='grid gap-2'
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  width: 'min(90vw, 80vh)',
                  aspectRatio: '1'
                }}
              >
                {grid.map((cell) => (
                  <motion.button
                    key={cell.id}
                    onClick={() => handleCellClick(cell.id)}
                    disabled={gameState !== 'input'}
                    className={`aspect-square rounded-md border transition-colors ${
                      cell.isActive
                        ? 'bg-primary border-primary'
                        : cell.isCorrect
                        ? 'bg-green-500 border-green-500'
                        : cell.isWrong
                        ? 'bg-destructive border-destructive'
                        : 'bg-muted/50 border-border hover:bg-muted'
                    } ${gameState === 'input' ? 'cursor-pointer' : 'cursor-default'}`}
                    whileHover={gameState === 'input' ? { scale: 0.95 } : {}}
                    whileTap={gameState === 'input' ? { scale: 0.9 } : {}}
                    animate={{
                      scale: cell.isActive || cell.isCorrect || cell.isWrong ? [1, 1.05, 1] : 1,
                    }}
                    transition={{ duration: 0.15 }}
                  />
                ))}
              </div>
            </div>

            <div className='flex justify-center px-6'>
              <div 
                className='bg-muted rounded-full h-2 overflow-hidden'
                style={{ 
                  width: 'min(90vw, 80vh)',
                  minWidth: '12rem',
                  maxWidth: '100%'
                }}
              >
                {gameState === 'showing' ? (
                  <div 
                    className={`h-2 progress-bar-fill ${
                      previewTimeLeft < 2000 
                        ? 'bg-red-500' 
                        : previewTimeLeft < 4000
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      transform: `scaleX(${previewProgressPercent / 100})`
                    }}
                  ></div>
                ) : (
                  <div 
                    className={`h-2 progress-bar-fill ${
                      timeLeft < 2000 
                        ? 'bg-red-500' 
                        : timeLeft < 4000
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      transform: `scaleX(${progressPercent / 100})`
                    }}
                  ></div>
                )}
              </div>
            </div>

            <div className='flex justify-center'>
              <div className='flex items-center gap-1.5'>
                {Array.from({ length: configRef.current.sequenceLength }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i < playerInput.length 
                        ? 'w-6 bg-primary' 
                        : 'w-4 bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>

        {(gameState === 'success' || gameState === 'failed') && (
          <div className='absolute inset-0 bg-background flex items-center justify-center rounded-lg'>
            <div className='text-center max-w-sm mx-auto px-8'>
              {gameState === 'success' ? (
                <div className='space-y-8'>
                  <div className='relative'>
                    <div className='w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center'>
                      <svg className='h-10 w-10 text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  </div>
                  <div className='space-y-3'>
                    <h2 className='text-2xl font-semibold text-foreground'>
                      Success
                    </h2>
                    <p className='text-muted-foreground text-base leading-relaxed'>
                      Sequence completed successfully
                    </p>
                  </div>
                </div>
              ) : (
                <div className='space-y-8'>
                  <div className='relative'>
                    <div className='w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center'>
                      <svg className='h-10 w-10 text-destructive' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </div>
                  </div>
                  <div className='space-y-3'>
                    <h2 className='text-2xl font-semibold text-foreground'>
                      Failed
                    </h2>
                    <p className='text-muted-foreground text-base leading-relaxed'>
                      Sequence failed
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SequenceMinigame;
