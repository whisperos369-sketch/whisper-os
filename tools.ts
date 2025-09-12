

/**
 * @fileoverview Tool definitions for J Agent function cacal
 * jp
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {Type} from '@google/genai';
import { GENRES } from './data.ts';

export const tools = [
  {
    functionDeclarations: [
      {
        name: "navigateToView",
        description: "Navigate the user's view to a specific mode or utility. One of: 'presets', 'studio', 'remix', 'lora-training', 'releases', 'settings', 'daily-banger', 'creative-dna', 'stem-mixer', 'sudoku', 'sonic-alchemist', 'spatial-sound'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            viewId: {
              type: Type.STRING,
              description: "The ID of the view to navigate to. One of: 'presets', 'studio', 'remix', 'lora-training', 'releases', 'settings', 'daily-banger', 'creative-dna', 'stem-mixer', 'sudoku', 'sonic-alchemist', 'spatial-sound'."
            },
          },
          required: ["viewId"]
        }
      },
      {
        name: "runQuickDrop",
        description: "Initiates the Quick Drop workflow via the 'Presets' mode to generate a complete song from a single prompt.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            prompt: {
              type: Type.STRING,
              description: "A natural language description of the song to create, e.g., 'a cinematic trap beat about exploring a new city'."
            },
            vibe: {
                type: Type.STRING,
                description: "The overall vibe. Can be one of 'Chill', 'Energetic', 'Hypnotic', 'Cinematic', or a custom freeform description."
            },
            leadVoice: {
                type: Type.STRING,
                description: "The style of the lead voice. Can be a standard voice like 'Whisper Soul', 'Titan', 'Aria', or the name of a custom-trained vocal LoRA model."
            }
          },
          required: ["prompt", "vibe", "leadVoice"]
        }
      },
      {
        name: "generateRemixPlan",
        description: "Initiates the Remix workflow to generate a production plan for a remix.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                source: {
                    type: Type.STRING,
                    description: "A description of the source audio, e.g., 'the current track', 'the uploaded file', or a URL."
                },
                genre: {
                    type: Type.STRING,
                    description: "The target genre for the remix.",
                    enum: GENRES
                },
                targets: {
                    type: Type.ARRAY,
                    description: "The specific stems to focus on in the remix.",
                    items: {
                        type: Type.STRING,
                        enum: ["Vocals", "Drums", "Bass", "Synth", "Guitar", "Other"]
                    }
                }
            },
            required: ["source", "genre", "targets"]
        }
      }
    ]
  }
];