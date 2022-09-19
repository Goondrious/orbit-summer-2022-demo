import React, { DOMAttributes, useState } from "react";
import ScrollLock from "react-scrolllock";
import { useAppSelector } from "../app/store";
import zIndices from "./common/zIndices";
import { CompletedReviewOverlay } from "./CompletedReviewOverlay";

type CustomElement<T> = Partial<T & DOMAttributes<T> & { children: any }>;

declare global {
  namespace JSX {
    // noinspection JSUnusedGlobalSymbols
    interface IntrinsicElements {
      ["orbit-reviewarea"]: CustomElement<
        HTMLElement & { height?: string; ref: any; modal: boolean }
      >;
      ["orbit-prompt"]: CustomElement<{
        question: string;
        answer: string;
        id: string;
        key: string;
      }>;
    }
  }
}

export type ModalReviewState =
  | {
      // i.e. we're reviewing a list of prompts specified by the author
      mode: "list";
      promptIDs: string[];
    }
  | {
      // i.e. we're reviewing all the due prompts the user has saved
      mode: "user";
    };

export type ModalReviewProps = {
  onClose: () => void;
  onContinueReview: () => void; // i.e. when the user is successfully upsold from author list to review their due prompts
} & ModalReviewState;

export function ModalReview(props: ModalReviewProps) {
  const prompts = useAppSelector((state) => state.prompts);
  const duePromptIDs = useAppSelector((state) =>
    Object.keys(state.prompts).filter((id) => state.prompts[id].isDue),
  );

  const [isReviewComplete, setReviewComplete] = useState(false);

  // A bit of a hack: we tee up the review queue when this component is mounted.
  const [queuedPromptIDs] = useState<string[]>(() =>
    props.mode === "list" ? props.promptIDs : duePromptIDs,
  ); // TODO shuffle

  return (
    <ScrollLock>
      <div
        css={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          // TODO abstract palette for inline review
          backgroundColor: "#ff5252",
          zIndex: zIndices.modalReview,
        }}
      >
        <orbit-reviewarea
          modal
          ref={(
            element: {
              onExitReview: () => void;
              onReviewComplete: () => void;
            } | null,
          ) => {
            if (element) {
              element.onExitReview = () => {
                props.onClose();
              };

              element.onReviewComplete = function () {
                setReviewComplete(true);
              };
            }
          }}
          height="100vh"
        >
          {queuedPromptIDs.map((id) => {
            const prompt = prompts[id];
            const attachmentURL = getAttachmentURL(prompt.content.back);
            return (
              <orbit-prompt
                question={prompt.content.front}
                answer={attachmentURL ? "" : prompt.content.back}
                answer-attachments={attachmentURL}
                id={id}
                key={id}
              ></orbit-prompt>
            );
          })}
        </orbit-reviewarea>

        <CompletedReviewOverlay
          mode={props.mode}
          context="modal"
          isReviewComplete={isReviewComplete}
          onClose={props.onClose}
          onContinueReview={props.onContinueReview}
        />
      </div>
    </ScrollLock>
  );
}

// HACK: The embedded iframe (which uses the "real" Orbit bits) can't access local URLs. So we convert relative URLs of these images back to absolute paths on the original publication servers.
function getAttachmentURL(text: string): string | null {
  const imageMatch = text.match(/<img src="(.+?)".+$/);
  if (imageMatch) {
    const resolved = new URL(imageMatch[1], document.baseURI).pathname;
    const inDomainSubpath = resolved.split("/").slice(2).join("/");
    if (resolved.startsWith("/shape-up")) {
      return `https://basecamp.com/${inDomainSubpath}`;
    } else if (resolved.startsWith("/ims")) {
      return `https://openintro-ims.netlify.app/${inDomainSubpath}`;
    } else {
      throw new Error("Unsupported image URL");
    }
  } else {
    return null;
  }
}
