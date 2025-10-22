import React, { useState, useEffect } from 'react';
import { debugData } from '@/utils/debugData';
import { fetchNui } from '@/utils/fetchNui';
import ScaleFade from '@/transitions/ScaleFade';
import { useNuiEvent } from '@/hooks/useNuiEvent';
import PathMinigame from '@/components/minigames/path';
import SequenceMinigame from '@/components/minigames/sequence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

debugData([
    {
        action: 'showUi',
        data: true,
    },
]);

const App: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [currentMinigame, setCurrentMinigame] = useState<string | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const [minigameConfig, setMinigameConfig] = useState({
        gridSize: 12,
        timeLimit: 30,
        enableSound: true,
        difficulty: 1,
        rounds: 3,
        sequenceLength: 3,
        showTime: 3000,
        inputTime: 8000
    });
    const [customConfig, setCustomConfig] = useState({
        gridSize: '12',
        timeLimit: '30',
        enableSound: 'true',
        rounds: '3',
        sequenceLength: '3',
        showTime: '3000',
        inputTime: '8000'
    });
    const [showSequenceConfig, setShowSequenceConfig] = useState(false);

    useNuiEvent<boolean>('showUi', (data) => {
        setVisible(true);
    });

    useNuiEvent<{minigame: string, config: {gridSize?: number, timeLimit?: number, enableSound?: boolean, difficulty?: number}}>('startMinigame', (data) => {
        setMinigameConfig({
            gridSize: data.config.gridSize || 12,
            timeLimit: data.config.timeLimit || 30,
            enableSound: data.config.enableSound !== false,
            difficulty: data.config.difficulty || 1,
            rounds: 3,
            sequenceLength: 3,
            showTime: 3000,
            inputTime: 8000
        });
        setCurrentMinigame(data.minigame);
        setVisible(true);
    });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && visible) {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [visible]);

    const handleClose = () => {
        if (currentMinigame) {
            fetchNui('minigameComplete', { success: false, minigame: currentMinigame });
        }
        setVisible(false);
        setCurrentMinigame(null);
        fetchNui('hideFrame');
    };

    const handleMinigameComplete = (success: boolean) => {
        fetchNui('minigameComplete', { success, minigame: currentMinigame });
        setTimeout(() => {
            setCurrentMinigame(null);
            handleClose();
        }, 2000);
    };

    const startCustomMinigame = (minigameType: string) => {
        const gridSize = parseInt(customConfig.gridSize) || 12;
        const timeLimit = parseInt(customConfig.timeLimit) || 30;
        const enableSound = customConfig.enableSound === 'true';
        
        setMinigameConfig({
            gridSize: Math.max(4, Math.min(20, gridSize)), 
            timeLimit: Math.max(10, Math.min(120, timeLimit)),
            enableSound,
            difficulty: 1, 
            rounds: 3,
            sequenceLength: 3,
            showTime: 3000,
            inputTime: 8000
        });
        setCurrentMinigame(minigameType);
        setShowConfig(false);
        setShowSequenceConfig(false);
        setVisible(true);
    };

    const startSequenceMinigame = () => {
        const rounds = parseInt(customConfig.rounds) || 3;
        const sequenceLength = parseInt(customConfig.sequenceLength) || 3;
        const showTime = parseInt(customConfig.showTime) || 3000;
        const inputTime = parseInt(customConfig.inputTime) || 8000;
        
        setMinigameConfig({
            gridSize: 12,
            timeLimit: 30,
            enableSound: true,
            difficulty: 1,
            rounds: Math.max(1, Math.min(10, rounds)),
            sequenceLength: Math.max(1, Math.min(6, sequenceLength)),
            showTime: Math.max(500, Math.min(10000, showTime)),
            inputTime: Math.max(2000, Math.min(30000, inputTime))
        });
        setCurrentMinigame('sequence');
        setShowSequenceConfig(false);
        setVisible(true);
    };

    const isDev = process.env.NODE_ENV === 'development';

    return (
        <div className='fixed inset-0 flex items-center justify-center'>
            {isDev && !currentMinigame && !showConfig && !showSequenceConfig && (
                <div className='absolute top-1/2 right-4 transform -translate-y-1/2 z-50 flex flex-col gap-2'>
                    <Button 
                        onClick={() => setShowConfig(true)}
                        variant='outline'
                        size='sm'
                        className='text-foreground hover:text-foreground'
                    >
                        Start Path Minigame
                    </Button>
                    <Button 
                        onClick={() => setShowSequenceConfig(true)}
                        variant='outline'
                        size='sm'
                        className='text-foreground hover:text-foreground'
                    >
                        Start Sequence Minigame
                    </Button>
                </div>
            )}

            {isDev && showConfig && (
                <div className='fixed inset-0 flex items-center justify-center z-50'>
                    <div className='absolute inset-0 bg-black/50' onClick={() => setShowConfig(false)}></div>
                    <Card className='w-80 relative'>
                        <CardHeader>
                            <CardTitle className='text-lg'>Path Minigame</CardTitle>
                            <CardDescription>
                                Configure your minigame settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='grid w-full max-w-sm items-center gap-2'>
                                <Label htmlFor='gridSize'>Grid Size (4-20)</Label>
                                <Input
                                    id='gridSize'
                                    type='number'
                                    placeholder='12'
                                    value={customConfig.gridSize}
                                    onChange={(e) => setCustomConfig(prev => ({ ...prev, gridSize: e.target.value }))}
                                />
                            </div>
                            <div className='grid w-full max-w-sm items-center gap-2'>
                                <Label htmlFor='timeLimit'>Time Limit (10-120s)</Label>
                                <Input
                                    id='timeLimit'
                                    type='number'
                                    placeholder='30'
                                    value={customConfig.timeLimit}
                                    onChange={(e) => setCustomConfig(prev => ({ ...prev, timeLimit: e.target.value }))}
                                />
                            </div>
                            <div className='grid w-full max-w-sm items-center gap-2'>
                                <Label htmlFor='enableSound'>Enable Sound</Label>
                                <select
                                    id='enableSound'
                                    className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                                    value={customConfig.enableSound}
                                    onChange={(e) => setCustomConfig(prev => ({ ...prev, enableSound: e.target.value }))}
                                >
                                    <option value='true'>Yes</option>
                                    <option value='false'>No</option>
                                </select>
                            </div>
                            <Button 
                                onClick={() => startCustomMinigame('path')}
                                className='w-full'
                            >
                                Start Path Minigame
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {isDev && showSequenceConfig && (
                <div className='fixed inset-0 flex items-center justify-center z-50'>
                    <div className='absolute inset-0 bg-black/50' onClick={() => setShowSequenceConfig(false)}></div>
                    <Card className='w-80 relative'>
                        <CardHeader>
                            <CardTitle className='text-lg'>Sequence Minigame</CardTitle>
                            <CardDescription>
                                Configure your sequence minigame settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='grid w-full max-w-sm items-center gap-2'>
                                <Label htmlFor='rounds'>Rounds (1-10)</Label>
                                <Input
                                    id='rounds'
                                    type='number'
                                    placeholder='3'
                                    value={customConfig.rounds}
                                    onChange={(e) => setCustomConfig(prev => ({ ...prev, rounds: e.target.value }))}
                                />
                            </div>
                            <div className='grid w-full max-w-sm items-center gap-2'>
                                <Label htmlFor='sequenceLength'>Sequence Length (1-6)</Label>
                                <Input
                                    id='sequenceLength'
                                    type='number'
                                    placeholder='3'
                                    value={customConfig.sequenceLength}
                                    onChange={(e) => setCustomConfig(prev => ({ ...prev, sequenceLength: e.target.value }))}
                                />
                            </div>
                            <div className='grid w-full max-w-sm items-center gap-2'>
                                <Label htmlFor='showTime'>Show Time (500-10000ms)</Label>
                                <Input
                                    id='showTime'
                                    type='number'
                                    placeholder='3000'
                                    value={customConfig.showTime}
                                    onChange={(e) => setCustomConfig(prev => ({ ...prev, showTime: e.target.value }))}
                                />
                            </div>
                            <div className='grid w-full max-w-sm items-center gap-2'>
                                <Label htmlFor='inputTime'>Input Time (2000-30000ms)</Label>
                                <Input
                                    id='inputTime'
                                    type='number'
                                    placeholder='8000'
                                    value={customConfig.inputTime}
                                    onChange={(e) => setCustomConfig(prev => ({ ...prev, inputTime: e.target.value }))}
                                />
                            </div>
                            <Button 
                                onClick={startSequenceMinigame}
                                className='w-full'
                            >
                                Start Sequence Minigame
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <ScaleFade visible={visible}>
                {currentMinigame === 'path' && (
                    <PathMinigame 
                        onComplete={handleMinigameComplete}
                        onClose={handleClose}
                        gridSize={minigameConfig.gridSize}
                        timeLimit={minigameConfig.timeLimit}
                        enableSound={minigameConfig.enableSound}
                    />
                )}
                {currentMinigame === 'sequence' && (
                    <SequenceMinigame 
                        onComplete={handleMinigameComplete}
                        onClose={handleClose}
                        rounds={minigameConfig.rounds}
                        sequenceLength={minigameConfig.sequenceLength}
                        showTime={minigameConfig.showTime}
                        inputTime={minigameConfig.inputTime}
                    />
                )}
            </ScaleFade>
        </div>
    );
};

export default App;