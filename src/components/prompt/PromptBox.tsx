import React, { useEffect, useRef, useState } from "react";
import styled from '@emotion/styled'
import { Prompt } from "../../app/promptSlice";
import { EditingProps, HoverProps, Icon, SavedProps, BulkProps, PromptText, PromptBack, HiddenProps, ANIMATION_TIME_MSEC} from "./PromptComponents";

// HACKy regex for seeing if prompt is image
const IMAGE_REGEX = /<img.+src="(.+)".+>/;

function getPromptImageSrc(promptContent: string): string | undefined  {
  const res = promptContent.match(IMAGE_REGEX);
  if (res && res.length > 0){
    return res[1];
  } 
}

export interface PromptProps {
    prompt: Prompt
    isNew?: boolean;
    clearNew?: () => any;
    isBulk?: boolean;
    // Informs the parent of bounding box of the fully expanded state on mount
    setFullBoundingBox?: (box: {top: number, bottom: number}) => any;
    computeFullBoundingBox?: boolean;
    savePrompt: () => any;
    updatePromptFront: (newPrompt: string) => any;
    updatePromptBack: (newPrompt: string) => any;
}

const PromptImage = styled.img`
    width: 50%;
    border-radius: 0px;
`;

const PromptContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
`;

const Container = styled.div<HoverProps & SavedProps & EditingProps & BulkProps & HiddenProps>`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 332px;
  padding: 8px 8px 10px 9px;
  gap: 8px;
  cursor: ${props => !props.isSaved ? 'pointer' : 'auto'};
  position: relative;
  opacity: ${props => props.isHidden ? 0.0 : 1.0};
  border-left: ${props => {
    if (props.isBulk && !props.isHovered){
      return '3px solid var(--fgTertiary)';
    } else if (props.isHovered && !props.isSaved){
      return '3px solid var(--accentPrimary)';
    } else if (props.isSaved && !props.isEditing) {
      return '3px solid var(--accentSecondary)';
    } else if (props.isSaved && props.isEditing){
      return '3px solid var(--accentPrimary)';
    } else {
      return '3px solid transparent';
    }
  }};
  box-shadow: ${props => {
    if (props.isHovered && !props.isSaved && !props.isBulk){
      return '0px 1px 3px rgba(0, 0, 0, 0.07), 0px 5px 10px rgba(0, 0, 0, 0.08)';
    }
  }};
  background: ${props => {
    if (props.isSaved) {
      return 'var(--bgPrimary)';
    } else if (props.isHovered && !props.isSaved && !props.isBulk){
      return 'var(--bgContent)';
    }
  }};

  /* Bulk hover state */
  ${props => props.isBulk ? `
    :hover::before {
      position: absolute;
      content: '';
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--hoverLayer);
    };` : null
  }

  /* Pressed state */
  ${props => !props.isSaved ? `
    :active::before {
      position: absolute;
      content: '';
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--pressedLayer);
    };` : null
  }

  transition: ${ANIMATION_TIME_MSEC / 1000}s ease-out;
`;

export default function PromptBox({
    prompt, 
    isNew,
    clearNew,
    isBulk,
    setFullBoundingBox,
    computeFullBoundingBox,
    savePrompt,
    updatePromptFront,
    updatePromptBack,
}: PromptProps) {
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(isNew ?? false);
    const hidePromptBackTimeout = useRef<number | undefined>();
    const [showPromptBack, setShowPromptBack] = useState<boolean>(false);
    const [imageSrc, setImageSrc] = useState<string | undefined>();
    const isSaved = prompt.isSaved;

    const promptFrontRef = useRef<HTMLDivElement | null>(null);
    const promptBackRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // We hide the prompt back only after the animation for unhover'ing is done. This way the container doesn't instantly resize and cause animation to glitch
    useEffect(() => {
      if(!isHovered && !isSaved){
        hidePromptBackTimeout.current = window.setTimeout(() => {
          setShowPromptBack(false);
        }, ANIMATION_TIME_MSEC);
      } else if(isHovered || isSaved){
        clearTimeout(hidePromptBackTimeout.current);
        hidePromptBackTimeout.current = undefined;
        setShowPromptBack(true);
      }
    }, [isHovered, isSaved, setShowPromptBack]);

    const startEditing = function(editingFront: boolean){
      setIsEditing(true);

      // Select all text in prompt
      const el = editingFront ? promptFrontRef.current : promptBackRef.current;
      const sel = window.getSelection();
      const range = document.createRange();
      if (el && sel && range) {
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    const endEditing = function(){
      if(promptFrontRef.current?.innerText) {
        updatePromptFront(promptFrontRef.current.innerText);
      }
      if(promptBackRef.current?.innerText) {
        updatePromptBack(promptBackRef.current.innerText);
      }
      setIsEditing(false);
      savePrompt();
      if (clearNew) clearNew();
    };

    // Focus if new
    useEffect(() => {
      if (isNew && promptFrontRef.current) {
        promptFrontRef.current.focus({preventScroll: true});
      }
    }, [isNew, promptFrontRef]);

    // Check if image
    useEffect(() => {
      setImageSrc(getPromptImageSrc(prompt.content.back));
    }, [prompt]);

    // Get full bounding rect
    useEffect(() => {
      if (setFullBoundingBox && containerRef.current && computeFullBoundingBox){
        // TODO: eliminate this awful hack
        setTimeout(() => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect){
            setFullBoundingBox({top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY});
          }
        }, 0);
      }
    }, [setFullBoundingBox, containerRef, computeFullBoundingBox]);

    return (
      <Container 
        isHovered={isHovered} 
        isSaved={isSaved} 
        isEditing={isEditing}
        isHidden={computeFullBoundingBox ?? false}
        isBulk={isBulk ?? false}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)} 
        onClick={() => savePrompt()}
        ref={containerRef}
      >
        <Icon isHovered={isHovered} isSaved={isSaved} isEditing={isEditing}/>
        <PromptContainer>
          <PromptText 
            isHovered={isHovered} 
            isSaved={isSaved}
            isBulk={isBulk ?? false}
            contentEditable={isSaved} 
            onFocus={() => startEditing(true)}
            onBlur={() => endEditing()}
            suppressContentEditableWarning
            ref={promptFrontRef}
            placeholder="Type a prompt here."
            spellCheck={isEditing}
          >
            {prompt.content.front}
          </PromptText>
          {(showPromptBack || isBulk || computeFullBoundingBox) && 
            (imageSrc ?
              <PromptImage src={imageSrc} />
              : <PromptBack 
                isHovered={isHovered} 
                isSaved={isSaved}
                isBulk={isBulk ?? false}
                contentEditable={isSaved} 
                onFocus={() => startEditing(false)}
                onBlur={() => endEditing()}
                suppressContentEditableWarning
                ref={promptBackRef}
                placeholder="Type a response here."
                spellCheck={isEditing}
              >
                {prompt.content.back}
              </PromptBack>
            ) 
          }
        </PromptContainer>
      </Container>
  );
}