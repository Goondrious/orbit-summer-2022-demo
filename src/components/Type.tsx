import { css } from "@emotion/react";
import React from "react";

export enum LabelColor {
  AccentPrimary = "AccentPrimary",
  FGPrimary = "FGPrimary",
  FGSecondaryLarge = "FGSecondaryLarge",
  FGSecondarySmall = "FGSecondarySmall",
}
const colorVarsByEnumValue = {
  [LabelColor.AccentPrimary]: "--accentPrimary",
  [LabelColor.FGPrimary]: "--fgPrimary",
  [LabelColor.FGSecondaryLarge]: "--fgSecondaryLarge",
  [LabelColor.FGSecondarySmall]: "--fgSecondarySmall",
};

interface TypeProps {
  text: string;
  color?: LabelColor;
}

const colorStyle = (color?: LabelColor) =>
  css({
    color: `var(${colorVarsByEnumValue[color ?? LabelColor.FGPrimary]})`,
  });

/* I'm using components instead of simple CSS for our UI type styles because the web's unorthodox "half-leading" type layout results in space added *above* type. This makes it very difficult to lay text out on a consistent grid baseline. e.g. for the Label type style (17px/12px), half-leading shifts the glyph baselines down 1px below the 12px bounding box. */

export function Label(props: TypeProps) {
  return (
    <div
      css={[
        {
          fontFamily: "Dr-ExtraBold",
          fontSize: 17,
          lineHeight: "12px",
          letterSpacing: "0.01em",

          // Manual adjustment for the web's non-standard leading behavior.
          marginTop: -1,
          paddingBottom: 1,
        },
        colorStyle(props.color),
      ]}
    >
      {props.text}
    </div>
  );
}

export function LabelSmall(props: TypeProps) {
  return (
    <div
      css={[
        {
          fontFamily: "Dr-ExtraBold",
          fontSize: 15,
          lineHeight: "12px",
          letterSpacing: "0.02em",
        },
        colorStyle(props.color),
      ]}
    >
      {props.text}
    </div>
  );
}
