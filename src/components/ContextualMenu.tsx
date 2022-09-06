import { css } from "@emotion/react";
import React from "react";

interface ContextualMenuItemProps {
  title: string;
  onClick: () => void;
}
function ContextualMenuItem({ title, onClick }: ContextualMenuItemProps) {
  return (
    <button
      onClick={(e) => {
        onClick?.();
        e.stopPropagation();
      }}
      css={css`
        width: 100%;
        text-align: left;
        background-color: var(--bg2);
        font-family: "Dr-ExtraBold";
        font-size: 16px;
        line-height: 20px;
        letter-spacing: 0.03em;
        border: none;
        padding: 8px 12px 8px 12px;
        margin: 0;
        color: var(--accent);
        white-space: nowrap;

        &:hover {
          background-color: var(--bg1);
        }

        & span {
          display: inline-block;
          position: relative;
          top: -1px;
        }

        &:active span {
          opacity: 0.2;
        }
      `}
    >
      <span>{title}</span>
    </button>
  );
}

export interface ContextualMenuProps {
  position: "left" | "right" | "center";
  items: { title: string; onClick: () => void }[];
}
export default function ContextualMenu({
  position,
  items,
}: ContextualMenuProps) {
  return (
    <div
      className={position}
      css={css`
        padding-top: 8px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      `}
    >
      {items.map((item, i) => (
        <ContextualMenuItem {...item} key={i} />
      ))}
    </div>
  );
}
