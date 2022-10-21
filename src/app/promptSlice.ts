import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  HypothesisJSONData,
  readPromptsFromHypothesisJSON,
} from "../util/hypothesisJSON";

export type PromptId = string;

export interface Prompt {
  content: {
    front: string;
    back: string;
  };
  selectors: PromptSelector[];

  isByAuthor: boolean;
  isSaved: boolean;
  isDue: boolean;
  showAnchors: boolean;

  // For prompts saved automatically via review, we track the ID of the review area where it came from, so that we can implement the "undo" feature allowing users to *unsave* those auto-saved prompts.
  sourceReviewAreaID?: string;
}

// i.e. following Hypothes.is's selector format, as specified in src/vendor/hypothesis-annotator
// annoyingly, this is distinct from the W3 Annotation format which hypothes.is helped define: https://www.w3.org/TR/annotation-model
export type PromptSelector =
  | RangeSelector
  | TextPositionSelector
  | TextQuoteSelector;

export enum PromptSelectorType {
  RangeSelector = "RangeSelector",
  TextPositionSelector = "TextPositionSelector",
  TextQuoteSelector = "TextQuoteSelector",
}

export interface RangeSelector {
  type: PromptSelectorType.RangeSelector;
  startOffset: number;
  endOffset: number;
  startContainer: string; // i.e. an XPath string
  endContainer: string; // i.e. an XPath string
}

// specifies an index range within the innerText of the page
export interface TextPositionSelector {
  type: PromptSelectorType.TextPositionSelector;
  start: number;
  end: number;
}

export interface TextQuoteSelector {
  type: PromptSelectorType.TextQuoteSelector;
  exact: string;
  prefix: string;
  suffix: string;
}

//---

export interface PromptsState {
  [id: PromptId]: Prompt;
}

export type IdAction = PayloadAction<PromptId>;
export type UpdatePromptText = PayloadAction<
  [id: PromptId, promptText: string]
>;
export type CreateNewPrompt = PayloadAction<{ id: PromptId; prompt: Prompt }>;
export type SyncPromptFromReview = PayloadAction<{
  id: PromptId;
  wasSkipped: boolean;
  newInterval: number;
  sourceReviewAreaID: string;
}>;

const initialState: PromptsState = {};

const promptSlice = createSlice({
  name: "prompts",
  initialState,
  reducers: {
    savePrompt(state, action: IdAction) {
      const prompt = state[action.payload];
      if (!prompt.isSaved) {
        prompt.isSaved = true;
        prompt.isDue = true;
      }
    },
    unsavePrompt(state, action: IdAction) {
      const prompt = state[action.payload];
      prompt.isSaved = false;
      prompt.isDue = false;
      prompt.sourceReviewAreaID = undefined;
    },
    deletePrompt(state, action: IdAction) {
      delete state[action.payload];
    },
    updatePromptFront(state, action: UpdatePromptText) {
      const prompt = state[action.payload[0]];
      prompt.content.front = action.payload[1];
    },
    updatePromptBack(state, action: UpdatePromptText) {
      const prompt = state[action.payload[0]];
      prompt.content.back = action.payload[1];
    },
    createNewPrompt(state, action: CreateNewPrompt) {
      state[action.payload.id] = action.payload.prompt;
    },
    syncPromptFromReview(state, action: SyncPromptFromReview) {
      const { id, wasSkipped, newInterval, sourceReviewAreaID } =
        action.payload;
      const prompt = state[id];
      if (!prompt.isSaved && !wasSkipped) {
        prompt.isSaved = true;

        if (!prompt.sourceReviewAreaID) {
          prompt.sourceReviewAreaID = sourceReviewAreaID;
        }
      }

      // This hacky predicate corresponds to the data we'll see if they marked the prompt as forgotten (i.e. so it's still due).
      prompt.isDue = newInterval === 0 && !wasSkipped;
    },
    reloadPromptsFromJSON(state, action: PayloadAction<HypothesisJSONData>) {
      return readPromptsFromHypothesisJSON(action.payload);
    },
  },
  extraReducers(builder) {
    builder.addCase(loadPrompts.fulfilled, (_state, action) => {
      // Merge the loaded prompts with any persisted prompts.
      for (const [id, prompt] of Object.entries(action.payload)) {
        if (!_state[id]) {
          _state[id] = prompt;
        }
      }
    });
  },
});

export const loadPrompts = createAsyncThunk(
  "prompts/loadPrompts",
  async (promptDataSubpath: string): Promise<PromptsState> => {
    try {
      const json = await import(
        `../static/promptData/${promptDataSubpath}.json`
      );
      return readPromptsFromHypothesisJSON(json);
    } catch (e) {
      // console.error(e);
      return {};
    }
  },
);

export const {
  savePrompt,
  unsavePrompt,
  deletePrompt,
  updatePromptFront,
  updatePromptBack,
  createNewPrompt,
  syncPromptFromReview,
  reloadPromptsFromJSON,
} = promptSlice.actions;
export const promptsReducer = promptSlice.reducer;
