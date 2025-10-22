import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LibIcon from '@/components/LibIcon';
import { PathMinigameProps, Position } from '@/types';

const PathMinigame: React.FC<PathMinigameProps> = ({ 
    onComplete, 
    onClose, 
    gridSize: propGridSize = 12, 
    timeLimit = 30, 
    enableSound = true 
}) => {
    const gridSize = Math.min(Math.max(propGridSize, 4), 20);
    const gameStarted = true;
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [progressPercent, setProgressPercent] = useState(100);
    const [gameComplete, setGameComplete] = useState(false);
    const [gameSuccess, setGameSuccess] = useState(false);
    const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
    const [path, setPath] = useState<Position[]>([]);
    const [correctPath, setCorrectPath] = useState<Position[]>([]);
    const [isMoving, setIsMoving] = useState(false);

    const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
        try {
            let audioContext = (window as any).audioContext;
            
            if (!audioContext || audioContext.state === 'closed') {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                (window as any).audioContext = audioContext;
            }
            
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.005, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
        }
    };

    const playMoveSound = () => {
        if (!enableSound) return;
        playSound(800, 0.05, 'square');
        setTimeout(() => playSound(1000, 0.05, 'square'), 50);
    };
    
    const playSuccessSound = () => {
        if (!enableSound) return;
        playSound(523, 0.1, 'sine');
        setTimeout(() => playSound(659, 0.1, 'sine'), 100);
        setTimeout(() => playSound(784, 0.1, 'sine'), 200);
    };
    
    const playFailureSound = () => {
        if (!enableSound) return;
        playSound(200, 0.15, 'sawtooth');
        setTimeout(() => playSound(150, 0.15, 'sawtooth'), 150);
    };
    
    const playTimeWarningSound = () => {
        if (!enableSound) return;
        playSound(1000, 0.08, 'triangle');
        setTimeout(() => playSound(1200, 0.08, 'triangle'), 80);
    };

    const initializeGame = () => {
        setTimeLeft(timeLimit);
        setProgressPercent(100);
        setGameComplete(false);
        setGameSuccess(false);
        setPlayerPosition({ x: 0, y: 0 });
        setPath([{ x: 0, y: 0 }]);
        setIsMoving(false);
        
        const newCorrectPath = generateCorrectPath();
        setCorrectPath(newCorrectPath);
        
        setTimeout(() => {
            if ((window as any).audioContext && (window as any).audioContext.state === 'suspended') {
                (window as any).audioContext.resume();
            }
        }, 100);
    };

    const generateCorrectPath = () => {
        const path = [{ x: 0, y: 0 }];
        let currentX = 0;
        let currentY = 0;
        
        while (currentX < gridSize - 1 || currentY < gridSize - 1) {
            if (currentX < gridSize - 1 && Math.random() < 0.6) {
                currentX++;
            } else if (currentY < gridSize - 1) {
                currentY++;
            } else {
                currentX++;
            }
            path.push({ x: currentX, y: currentY });
        }
        
        return path;
    };

    useEffect(() => {
        initializeGame();
    }, []);

    useEffect(() => {
        if (gameStarted && timeLeft > 0 && !gameComplete) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !gameComplete) {
            setGameComplete(true);
            setGameSuccess(false);
            playFailureSound();
            setTimeout(() => onComplete(false), 2500);
            setTimeout(() => onClose(), 3000);
        }
    }, [gameStarted, timeLeft, gameComplete, onComplete]);

    useEffect(() => {
        if (timeLeft === 10 && !gameComplete) {
            playTimeWarningSound();
        }
    }, [timeLeft, gameComplete]);

    useEffect(() => {
        if (gameStarted && !gameComplete) {
            const startTime = Date.now();
            const startTimeLeft = timeLeft;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const remainingTime = Math.max(0, startTimeLeft - (elapsed / 1000));
                const percent = (remainingTime / timeLimit) * 100;
                
                setProgressPercent(Math.max(0, percent));
                
                if (remainingTime > 0 && !gameComplete) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        }
    }, [gameStarted, gameComplete, timeLeft, timeLimit]);

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (!gameStarted || gameComplete || isMoving) return;

            let newX = playerPosition.x;
            let newY = playerPosition.y;

            switch (event.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    newY = Math.max(0, playerPosition.y - 1);
                    break;
                case 'arrowdown':
                case 's':
                    newY = Math.min(gridSize - 1, playerPosition.y + 1);
                    break;
                case 'arrowleft':
                case 'a':
                    newX = Math.max(0, playerPosition.x - 1);
                    break;
                case 'arrowright':
                case 'd':
                    newX = Math.min(gridSize - 1, playerPosition.x + 1);
                    break;
                default:
                    return;
            }

            if (newX !== playerPosition.x || newY !== playerPosition.y) {
                handleGridClick(newX, newY);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameStarted, gameComplete, isMoving, playerPosition, gridSize]);

    const handleGridClick = (x: number, y: number) => {
        if (gameComplete || isMoving) return;

        const newPosition = { x, y };
        const lastPosition = path[path.length - 1];
        
        const isValidMove = Math.abs(x - lastPosition.x) + Math.abs(y - lastPosition.y) === 1;
        
        if (!isValidMove) {
            return;
        }

        const isOnCorrectPath = correctPath.some(pos => pos.x === x && pos.y === y);
        
        if (!isOnCorrectPath) {
            setGameComplete(true);
            setGameSuccess(false);
            playFailureSound();
            setTimeout(() => onComplete(false), 2500);
            setTimeout(() => onClose(), 3000);
            return;
        }

        const newPath = [...path, newPosition];
        setPath(newPath);
        setPlayerPosition(newPosition);
        setIsMoving(true);
        playMoveSound();

        if (x === gridSize - 1 && y === gridSize - 1) {
            setTimeout(() => {
                setGameComplete(true);
                setGameSuccess(true);
                playSuccessSound();
                setTimeout(() => onComplete(true), 2500);
                setTimeout(() => onClose(), 3000);
            }, 500);
        } else {
            setTimeout(() => {
                setIsMoving(false);
            }, 200);
        }
    };

    const isOnPath = (x: number, y: number) => {
        return path.some(pos => pos.x === x && pos.y === y);
    };

    const isCorrectPath = (x: number, y: number) => {
        return correctPath.some(pos => pos.x === x && pos.y === y);
    };

    const isPlayerPosition = (x: number, y: number) => {
        return playerPosition.x === x && playerPosition.y === y;
    };

    const getProgressBarColor = () => {
        if (timeLeft > 20) return 'bg-green-500';
        if (timeLeft > 10) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const renderGrid = () => {
        const grid = [];
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const isPath = isOnPath(x, y);
                const isCorrect = isCorrectPath(x, y);
                const isPlayer = isPlayerPosition(x, y);
                
                let className = 'aspect-square border border-border transition-all duration-200 ';
                
                if (isPlayer) {
                    className += 'bg-primary ';
                } else if (isPath) {
                    className += 'bg-primary/50 ';
                } else if (isCorrect) {
                    className += 'bg-secondary ';
                } else {
                    className += 'bg-muted ';
                }
                

                grid.push(
                    <div
                        key={`${x}-${y}`}
                        className={className}
                    >
                    </div>
                );
            }
        }
        
        return grid;
    };

    return (
        <div className='w-full max-w-4xl'>
            <Card className='border-border/40 bg-card/95 shadow-xl relative'>
                <div className='px-6 py-6'>
                    <CardTitle className='text-xl'>Path Finder</CardTitle>
                    <CardDescription>
                        Navigate from start to end to complete the minigame
                    </CardDescription>
                </div>
                <Separator />
                <CardContent className='p-0 pt-6 pb-6'>
                    <div className='space-y-4'>
                        <div className='flex justify-center px-6'>
                            <div 
                                className='grid gap-1 focus:outline-none' 
                                style={{ 
                                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                                    width: 'min(90vw, 80vh)',
                                    aspectRatio: '1'
                                }}
                                tabIndex={-1}
                            >
                                {renderGrid()}
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
                                <div 
                                    className={`h-2 progress-bar-fill ${getProgressBarColor()}`}
                                    style={{ 
                                        transform: `scaleX(${progressPercent / 100})`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                
                {gameComplete && (
                    <div className='absolute inset-0 bg-background flex items-center justify-center rounded-lg'>
                        <div className='text-center max-w-sm mx-auto px-8'>
                            {gameSuccess ? (
                                <div className='space-y-8'>
                                    <div className='relative'>
                                        <div className='w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center'>
                                            <LibIcon 
                                                icon='check' 
                                                className='h-10 w-10 text-green-500' 
                                            />
                                        </div>
                                    </div>
                                    <div className='space-y-3'>
                                        <h2 className='text-2xl font-semibold text-foreground'>
                                            Success
                                        </h2>
                                        <p className='text-muted-foreground text-base leading-relaxed'>
                                            Minigame completed successfully
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className='space-y-8'>
                                    <div className='relative'>
                                        <div className='w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center'>
                                            <LibIcon 
                                                icon='xmark' 
                                                className='h-10 w-10 text-destructive' 
                                            />
                                        </div>
                                    </div>
                                    <div className='space-y-3'>
                                        <h2 className='text-2xl font-semibold text-foreground'>
                                            Failed
                                        </h2>
                                        <p className='text-muted-foreground text-base leading-relaxed'>
                                            {timeLeft === 0 
                                                ? 'Time limit exceeded. Minigame failed.' 
                                                : 'Incorrect path taken. Minigame failed.'
                                            }
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

export default PathMinigame;
