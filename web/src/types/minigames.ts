export interface PathMinigameProps {
    onComplete: (success: boolean) => void;
    onClose: () => void;
    gridSize?: number;
    timeLimit?: number;
    enableSound?: boolean;
}

export interface SequenceMinigameProps {
    onComplete: (success: boolean) => void;
    onClose: () => void;
    rounds?: number;
    sequenceLength?: number;
    showTime?: number;
    inputTime?: number;
}

export interface Cell {
    id: number;
    isActive: boolean;
    isCorrect: boolean;
    isWrong: boolean;
}

export interface Position {
    x: number;
    y: number;
}
