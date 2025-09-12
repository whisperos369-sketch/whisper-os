/**
 * @fileoverview The "Sudoku" utility component.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { sharedStyles } from '@/shared-styles.ts';
import { StudioModule } from '@/studio-module.ts';
import { formatDuration } from '@/utils.ts';

type Difficulty = 'easy' | 'medium' | 'hard';

const puzzles: Record<Difficulty, (number | null)[][]> = {
    easy: [
        [null, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, null],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, null, 5, null, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [null, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, null]
    ],
    medium: [
        [5, 3, null, null, 7, null, null, null, null],
        [6, null, null, 1, 9, 5, null, null, null],
        [null, 9, 8, null, null, null, null, 6, null],
        [8, null, null, null, 6, null, null, null, 3],
        [4, null, null, 8, null, 3, null, null, 1],
        [7, null, null, null, 2, null, null, null, 6],
        [null, 6, null, null, null, null, 2, 8, null],
        [null, null, null, 4, 1, 9, null, null, 5],
        [null, null, null, null, 8, null, null, 7, 9]
    ],
    hard: [
        [null, null, null, 6, null, null, 4, null, null],
        [7, null, null, null, null, 3, 6, null, null],
        [null, null, null, null, 9, 1, null, 8, null],
        [null, null, null, null, null, null, null, null, null],
        [null, 5, 1, null, null, null, null, null, 3],
        [null, null, null, 3, null, null, null, null, null],
        [6, null, null, null, null, null, null, 7, 5],
        [null, null, 3, 4, null, null, null, null, null],
        [null, null, null, null, null, null, 1, null, null]
    ]
};

@customElement('sudoku-utility')
export class SudokuUtility extends StudioModule {
    @state() private board: (number | null)[][] = [];
    @state() private isEditable: boolean[][] = [];
    @state() private errors: boolean[][] = [];
    @state() private currentDifficulty: Difficulty = 'medium';
    @state() private elapsedTime = 0;
    @state() private isSolved = false;
    @state() private isTimerPaused = false;
    private timerInterval: number | undefined;

    constructor() {
        super();
        this.resetGame();
    }

    disconnectedCallback() {
        // FIX: Removed `super.disconnectedCallback()` call as `StudioModule` does not have a `disconnectedCallback` method.
        this._stopTimer();
    }

    private _startTimer() {
        this._stopTimer();
        this.timerInterval = window.setInterval(() => {
            if (!this.isTimerPaused) {
                this.elapsedTime++;
            }
        }, 1000);
    }

    private _stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = undefined;
        }
    }

    private _toggleTimerPause() {
        if (this.isSolved) return;
        this.isTimerPaused = !this.isTimerPaused;
    }

    private resetGame() {
        this._stopTimer();
        this.elapsedTime = 0;
        this.isSolved = false;
        this.isTimerPaused = false;

        const initialBoard = puzzles[this.currentDifficulty];
        this.board = initialBoard.map(row => [...row]);
        this.isEditable = initialBoard.map(row => row.map(cell => cell === null));
        this.errors = Array(9).fill(null).map(() => Array(9).fill(false));
        this._validateBoard();
        this._startTimer();
    }
    
    private _changeDifficulty(difficulty: Difficulty) {
        this.currentDifficulty = difficulty;
        this.resetGame();
    }

    private _checkIfSolved(): boolean {
        const isFull = !this.board.some(row => row.some(cell => cell === null));
        if (!isFull) return false;

        this._validateBoard();
        const hasErrors = this.errors.some(row => row.some(cell => cell === true));

        return isFull && !hasErrors;
    }

    private _validateBoard() {
        const newErrors: boolean[][] = Array(9).fill(null).map(() => Array(9).fill(false));

        for (let i = 0; i < 9; i++) {
            const row = new Set<number>();
            const col = new Set<number>();
            const box = new Set<number>();
            for (let j = 0; j < 9; j++) {
                // Row check
                const rowVal = this.board[i][j];
                if (rowVal !== null) {
                    if (row.has(rowVal)) {
                        for (let k = 0; k < 9; k++) if (this.board[i][k] === rowVal) newErrors[i][k] = true;
                    }
                    row.add(rowVal);
                }
                // Col check
                const colVal = this.board[j][i];
                if (colVal !== null) {
                    if (col.has(colVal)) {
                         for (let k = 0; k < 9; k++) if (this.board[k][i] === colVal) newErrors[k][i] = true;
                    }
                    col.add(colVal);
                }
                // Box check
                const boxRow = 3 * Math.floor(i / 3) + Math.floor(j / 3);
                const boxCol = 3 * (i % 3) + (j % 3);
                const boxVal = this.board[boxRow][boxCol];
                if (boxVal !== null) {
                    if (box.has(boxVal)) {
                         for (let r_off = 0; r_off < 3; r_off++) {
                            for (let c_off = 0; c_off < 3; c_off++) {
                                const r = 3 * Math.floor(i/3) + r_off;
                                const c = 3 * (i % 3) + c_off;
                                if(this.board[r][c] === boxVal) newErrors[r][c] = true;
                            }
                        }
                    }
                    box.add(boxVal);
                }
            }
        }
        this.errors = newErrors;
    }

    private _handleInputChange(e: Event, r: number, c: number) {
        const input = e.target as HTMLInputElement;
        let value = parseInt(input.value, 10);

        if (isNaN(value) || value < 1 || value > 9) {
            value = NaN;
            input.value = '';
        }

        this.board[r][c] = isNaN(value) ? null : value;
        this.board = [...this.board];
        this._validateBoard();

        if (this._checkIfSolved()) {
            this.isSolved = true;
            this._stopTimer();
        }
    }
}